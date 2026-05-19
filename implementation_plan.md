# Controle Inteligente de Infraestrutura e Ativos — Plano Final

## Contexto e Objetivo

Substituir quatro planilhas Excel manuais (Geradores, No-Breaks, Cabines Primárias, Ilhas Self) por um sistema inteligente integrado à plataforma SGM. O sistema deve:

1. **Digitalizar o cadastro técnico** dos ativos de infraestrutura (geradores, nobreaks, cabines, ilhas self)
2. **Substituir os checklists manuais** por registros digitais com regras de prazo
3. **Calcular MTBF e MTTR** usando os dados dos checklists de equipamentos existentes
4. **Cruzar dados de falha com dados financeiros** para embasar decisões de "Comprar vs Manter"
5. **Dar visibilidade ao Coordenador** sobre inadimplência, vencimentos e tendências de custo

---

## Hierarquia de Responsabilidades (Regras de Negócio)

| Role | Responsabilidade |
|------|--------------------|
| **GESTOR** | Executa checklists semanais/mensais/bimestrais; abre chamados corretivos; orça com fornecedores; pode fechar manualmente um registro de falha |
| **COORDENADOR** | Monitora conformidade; programa preventivas de alto custo (baterias); delega tarefas ao Gestor via sistema; pode executar em caso de ausência do Gestor |
| **GERENTE / DIRETOR** | Visualiza indicadores agregados e decisões estratégicas (Buy vs Maintain) |

---

## Regras de Negócio Consolidadas (Sem Pendências)

### Ilhas Self — Somente Corretiva, Alta Criticidade

> [!IMPORTANT]
> Ilhas Self **não possuem manutenção preventiva** — apenas corretiva. Porém, são ativos de **extrema importância** para o negócio: em uma rede de supermercados, "sem ilha = sem venda". Qualquer falha impacta diretamente o faturamento da loja.

**Implicação para o sistema:**
- Ilhas Self devem ser rastreadas com `RegistroFalhaAtivo` para cálculo de MTBF e MTTR
- O Painel de Inteligência deve destacar ilhas com **alta frequência de falhas** (MTBF baixo) como ativos críticos que demandam substituição prioritária
- O critério "Comprar vs Manter" se aplica com peso maior para ilhas (menor tolerância de MTBF)
- `intervaloPreventiva = null` para ilhas self — sem agendamento de preventiva

---

### Teste Semanal do Gerador — Flexível com Alerta Persistente

O teste **deve ocorrer preferencialmente na segunda-feira**, mas pode ser preenchido em outro dia da mesma semana. A regra é:

- A semana de referência (número da semana ISO) é o identificador, não o dia específico
- Se a semana passar sem o registro ser criado → o painel exibe um **badge de pendência** amarelo/vermelho permanente para aquela unidade, até que o registro seja preenchido (mesmo que com atraso)
- O Gestor pode preencher com atraso — o campo `preenchidoComAtraso = true` é setado automaticamente se a data de preenchimento for após a segunda-feira da semana de referência

---

### MTTR — Duas Fontes de Encerramento

> [!NOTE]
> **As datas do módulo financeiro (abertura/aprovação do chamado CSA) NÃO são usadas como fim do reparo**, pois a aprovação financeira não equivale à conclusão do serviço — a execução depende de fornecedores externos e compra de peças.

**O encerramento do `RegistroFalhaAtivo` (dataResolucao) ocorre por uma dessas duas vias:**

1. **Via checklist**: Quando o próximo checklist de equipamentos registra `operacional = true` para o mesmo ativo → o sistema atualiza `dataResolucao` automaticamente
2. **Via fechamento manual**: O Gestor (ou Coordenador) clica em **"Marcar como Resolvido"** diretamente no painel do ativo, informando a `dataResolucao` manualmente, antes do próximo checklist ocorrer

O chamado CSA pode ainda ser vinculado ao `RegistroFalhaAtivo` via `chamadoId` para rastreabilidade financeira, mas não controla o MTTR.

---

## Proposed Changes

---

### Banco de Dados (Prisma Schema)

#### [MODIFY] `server/prisma/schema.prisma`

**Model `AtivoLoja` — Adições para infraestrutura**

```prisma
model AtivoLoja {
  // ... campos existentes ...

  // Manutenção preventiva (null para ilhas self e ativos somente-corretivos)
  ultimaPreventiva    DateTime?
  proximaPreventiva   DateTime?
  ultimaTrocaBateria  DateTime?
  proximaTrocaBateria DateTime?
  intervaloPreventiva Int?        // em dias (180 = semestral; null = sem preventiva)

  // Dados técnicos flexíveis por categoria
  dadosTecnicos       Json?

  // Relacionamentos
  falhas              RegistroFalhaAtivo[]
  checklistItens      ChecklistEquipamentoItem[]
}
```

> [!NOTE]
> `dadosTecnicos` (Json) por categoria:
> - **Gerador**: `{ fabricante, motor, alternador, tensao, capacidadeKva, qtdBaterias, descricaoBateria }`
>   - `descricaoBateria`: descrição livre da bateria (ex: `"12V/35AH"`, `"12V/7AH"`)
> - **Nobreak**: `{ qtdBaterias, descricaoBateria, capacidadeKva }`
> - **Cabine Primária**: `{ responsavelLaudo, tipoQTA }` — QTA = Quadro de Transferência Automática
>   - As datas do laudo são controladas pelos campos já existentes em `AtivoLoja`:
>     - `ultimaPreventiva` = data do último laudo realizado
>     - `proximaPreventiva` = **data de vencimento do laudo** (exibida no painel de vencimentos com semáforo)
> - **Ilha Self**:
>   ```json
>   {
>     "totalIlhas": 54,
>     "grupos": [
>       { "comprimento": "2.10m", "quantidade": 48 },
>       { "comprimento": "1.85m", "quantidade": 6 }
>     ],
>     "modeloCompressor": "EMBRACO - FNEU2168U",
>     "tipoGas": "R290"
>   }
>   ```
>   Cada loja pode ter grupos de ilhas com comprimentos diferentes. `tipoGas`: R290, R404a, R22, etc.

---

**Model `RegistroFalhaAtivo` [NEW]**

```prisma
model RegistroFalhaAtivo {
  id                  String     @id @default(uuid())
  ativoId             String
  dataDeteccao        DateTime   // Data do checklist que detectou a falha
  dataResolucao       DateTime?  // Preenchido via checklist (auto) ou "Marcar Resolvido" (manual)
  origemResolucao     String?    // "CHECKLIST" ou "MANUAL" — para auditoria
  descricao           String     // Obrigatório: o que foi observado
  reincidencia        Boolean    @default(false) // True se mesmo tipo em < 90 dias
  chamadoId           String?    // Vínculo com ControleChamado (rastreabilidade financeira)
  resolvidoPorId      String?    // Quem marcou como resolvido (se manual)
  criadoEm            DateTime   @default(now())
  ativo               AtivoLoja  @relation(fields: [ativoId], references: [id])
  resolvidoPor        Usuario?   @relation(fields: [resolvidoPorId], references: [id])

  @@index([ativoId, dataDeteccao])
  @@map("registros_falha_ativos")
}
```

---

**Model `ChecklistEquipamentoItem` — Vínculo opcional com AtivoLoja**

> [!IMPORTANT]
> `ativoId` é **opcional** (`String?`) — não quebra dados históricos. O form sugere ativos cadastrados, mas permite preencher sem vínculo.

```prisma
// Adicionar ao model existente:
ativoId String?
ativo   AtivoLoja? @relation(fields: [ativoId], references: [id])
```

---

**Model `ChecklistRotinaInfra` [NEW]**

```prisma
model ChecklistRotinaInfra {
  id                  String          @id @default(uuid())
  tipo                TipoRotinaInfra
  regiao              String
  unidade             String
  semana              Int?            // Semana ISO — apenas para GERADOR_SEMANAL
  mes                 Int
  ano                 Int
  conforme            Boolean
  descricao           String?         // Obrigatório se conforme = false
  preenchidoEm        DateTime        @default(now())
  preenchidoComAtraso Boolean         @default(false)
  // Para incêndio: atraso = preenchido após dia 20
  // Para gerador: atraso = preenchido após segunda-feira da semana de referência
  dataLimite          DateTime        // Calculada automaticamente pelo backend
  criadoPorId         String
  ativoId             String?         // Gerador ou sistema de incêndio relacionado
  criadoPor           Usuario         @relation(fields: [criadoPorId], references: [id])

  @@unique([tipo, unidade, semana, mes, ano], name: "rotina_unica")
  @@index([unidade, mes, ano])
  @@map("checklists_rotina_infra")
}

enum TipoRotinaInfra {
  GERADOR_SEMANAL           // Toda semana (preferencialmente segunda) — sem prazo rígido, mas com badge de pendência
  INCENDIO_MENSAL_VISUAL    // Check visual mensal — prazo: dia 20
  INCENDIO_BIMESTRAL_BOMBA  // Teste prático da bomba — prazo: dia 20 do mês bimestral
}
```

---

### Backend — Lógica e Endpoints

#### [NEW] `src/controllers/rotinaInfra.controller.js` + `src/routes/rotinaInfra.routes.js`

**Endpoints:**

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/rotinas-infra` | COORDENADOR+ | Lista com status calculado |
| `POST` | `/rotinas-infra` | GESTOR+ | Cria registro; seta `preenchidoComAtraso` e `dataLimite` |
| `GET` | `/rotinas-infra/conformidade` | COORDENADOR+ | Matriz conformidade por unidade/mês. Aceita `?dataRef=YYYY-MM-DD` |
| `GET` | `/rotinas-infra/gerador/pendencias` | COORDENADOR+ | Lista semanas sem teste por unidade |

**Lógica de status — Incêndio:**
```
se registro existe:
  se preenchidoComAtraso → "CONCLUIDO_COM_ATRASO"
  senão                  → "CONCLUIDO_NO_PRAZO"
senão se now() > dia_20 do mes/ano:
  → "NAO_REALIZADO_VENCIDO"   ← VERMELHO no painel
senão:
  → "PENDENTE"
```

**Lógica de status — Gerador Semanal:**
```
se registro existe para semana W:
  se preenchidoComAtraso → "CONCLUIDO_COM_ATRASO"  (badge laranja)
  senão                  → "CONCLUIDO_NO_PRAZO"    (badge verde)
senão se semana W já passou:
  → "PENDENTE_ATRASADO"  ← badge amarelo/vermelho persistente até preenchimento
senão:
  → "PENDENTE_ATUAL"
```

> [!TIP]
> O parâmetro `?dataRef=YYYY-MM-DD` nos endpoints de conformidade permite testar regras de prazo sem manipular o relógio do servidor.

---

#### [NEW] `src/controllers/falhaAtivo.controller.js` + `src/routes/falhaAtivo.routes.js`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/falhas-ativo/:ativoId` | COORDENADOR+ | Histórico de falhas do ativo |
| `PATCH` | `/falhas-ativo/:id/resolver` | GESTOR+ | **"Marcar como Resolvido"** — fecha manualmente o registro; seta `dataResolucao = now()` e `origemResolucao = "MANUAL"` |

---

#### [NEW] `src/services/indicadores.service.js`

**Fórmulas:**

```
MTBF por ativo =
  Média dos intervalos entre dataDeteccao consecutivos (RegistroFalhaAtivo)
  Unidade: dias | "Falha em média a cada X dias"

MTTR por ativo =
  Média de (dataResolucao - dataDeteccao) em horas
  Apenas registros com dataResolucao preenchida
  Unidade: horas | "Leva em média X horas para ser reparado"

Custo acumulado por ativo =
  SUM(valor) de ControleChamado
  WHERE chamadoId IN (registros vinculados ao ativo) — se vinculado
  OU WHERE segmento = segmento_do_ativo AND unidade = unidade_do_ativo — fallback por segmento
```

**Critério "Comprar vs Manter"** — flag `SUBSTITUIR` quando **2 ou mais** condições verdadeiras:

| Condição | Threshold Padrão | Ilhas Self |
|----------|-----------------|------------|
| MTBF baixo | < 90 dias | < 180 dias (mais rigoroso — negócio crítico) |
| Custo acumulado (último ano) | > R$ 8.000 | > R$ 5.000 |
| Reincidências (último semestre) | > 3 | > 2 |

---

#### [MODIFY] Checklist de Equipamentos — Service/Controller

Ao salvar um `ChecklistEquipamentoItem` com `operacional = false` **e** `ativoId` preenchido:
1. Criar automaticamente um `RegistroFalhaAtivo` com `dataDeteccao = data do checklist`
2. Verificar se existe falha aberta anterior para o ativo (sem `dataResolucao`) — se sim, marcar `reincidencia = true`

Ao salvar um item com `operacional = true` **e** existir `RegistroFalhaAtivo` aberto para o ativo:
1. Atualizar `dataResolucao = data do checklist` e `origemResolucao = "CHECKLIST"` automaticamente

---

### Frontend — Interface de Usuário

#### [MODIFY] Checklist de Equipamentos

- **Carregamento dinâmico**: Ao selecionar `tipoEquipamento`, busca `GET /ativos-loja?unidade=X&categoria=Y` e exibe dropdown com ativos da loja
- Se ativo não cadastrado → aviso não bloqueante: *"Ativo não cadastrado. Preencha assim mesmo ou cadastre antes."*
- `descricaoProblema` vira **obrigatório** quando `operacional = false`
- Campo `ativoId` preenchido automaticamente ao selecionar do dropdown

---

#### [NEW] `src/pages/infraestrutura/RotinasGestorPage.jsx`

**Acesso:** GESTOR (e COORDENADOR como fallback)

```
┌──────────────────────────────────────────────────────┐
│ 📋 ROTINAS DA SEMANA 21 / MAIO 2026                  │
│ Unidade: Limeira II                                  │
├──────────────────────────────────────────────────────┤
│ 🔴 GERADOR SEMANAL                  [Pendente +3d]   │
│    Sem. 20 — Não realizada          [Preencher →]    │
│                                                      │
│ ✅ GERADOR SEMANAL                  Concluído        │
│    Sem. 21 — Realizado em 19/05                      │
│                                                      │
│ ⚠️  INCÊNDIO — VISUAL MENSAL       [7 dias restantes]│
│    Maio/2026 — Prazo: 20/05         [Preencher →]    │
│                                                      │
│ 📅 INCÊNDIO — BIMESTRAL BOMBA      Próximo: Jun/2026 │
└──────────────────────────────────────────────────────┘
```

- Badge amarelo piscante quando ≤ 5 dias para prazo
- Badge vermelho após prazo expirado (persistente até preenchimento)
- **Semanas de gerador sem registro**: aparecem como cards pendentes até serem preenchidas (mesmo que com atraso)
- Formulário inline (sem modal) para agilidade

---

#### [NEW] `src/pages/infraestrutura/PainelInteligenciaPage.jsx`

**Acesso:** COORDENADOR, GERENTE, DIRETOR

**Seção 1 — Matriz de Conformidade (Incêndio)**

Tabela `unidades × meses` com faróis:
- 🟢 Concluído no prazo
- 🟡 Concluído com atraso
- 🔴 Não realizado / Vencido
- ⚪ Pendente (dentro do prazo)

A partir do **dia 21**: botão "Delegar Tarefa" → cria `Tarefa` atribuída ao Gestor com notificação automática.

**Seção 2 — Pendências do Teste Semanal do Gerador**

Grade `semanas × unidades` das últimas 8 semanas. Células vermelhas = semana não realizada (badge persiste até preenchimento).

**Seção 3 — Vencimentos de Preventivas**

Cards por unidade com semáforo:
- 🟢 > 60 dias | 🟡 30–60 dias | 🔴 < 30 dias ou vencido

Cobre: troca de bateria (nobreak + gerador), TOF semestral, laudo de cabine primária. Ilhas Self **não aparecem** nesta seção (sem preventiva).

**Seção 4 — Inteligência de Ativos (MTBF/MTTR)**

Por ativo com histórico de falhas:

```
┌──────────────────────────────────────────────┐
│ 🏭 ILHA SELF — FRIO — Limeira II  ⚠️ CRÍTICO │
│ Patrimônio: IS-003                           │
├──────────────────────────────────────────────┤
│ MTBF: 38 dias    MTTR: 22 horas             │
│ Falhas (6 meses): 5   Reincidências: 3      │
│ Custo acumulado: R$ 6.100                   │
│                                              │
│ 🔴 RECOMENDAÇÃO: AVALIAR SUBSTITUIÇÃO       │
│ (MTBF crítico + reincidências elevadas)     │
│                                              │
│ [Ver histórico de falhas]  [Abrir chamado]  │
└──────────────────────────────────────────────┘
```

Cada ativo com falha aberta exibe botão **"✅ Marcar como Resolvido"** → chama `PATCH /falhas-ativo/:id/resolver`.

---

#### [NEW] `src/pages/infraestrutura/CadastroInfraPage.jsx`

**Acesso:** COORDENADOR, ADMINISTRADOR

Formulário adaptativo por categoria para migrar dados das planilhas:
- **Gerador**: fabricante, motor, alternador, tensão (V), capacidade (kVa), nº série, TOF, qtd baterias, descrição da bateria (ex: `12V/35AH`)
- **Nobreak**: fabricante, modelo, capacidade (kVa), qtd baterias, descrição da bateria
- **Cabine Primária**: tipo QTA, responsável pelo laudo, **data do último laudo** (`ultimaPreventiva`), **data de vencimento do laudo** (`proximaPreventiva`) — campos obrigatórios para controle no painel
- **Ilha Self**: total de ilhas, grupos por comprimento (quantidade + tamanho em metros), modelo do compressor, tipo de gás refrigerante (R290, R404a, etc.)

---

## Verification Plan

1. **Regra do dia 20** — Usar `?dataRef=2026-05-21` → unidades sem registro aparecem como `NAO_REALIZADO_VENCIDO`. Com `?dataRef=2026-05-19` → `PENDENTE`.

2. **Badge de gerador pendente** — Criar sistema na semana 20, não preencher gerador. Na semana 21, verificar que a semana 20 ainda exibe badge de pendência na tela do Gestor.

3. **RegistroFalhaAtivo automático** — Salvar checklist com `operacional = false` para ativo cadastrado → `RegistroFalhaAtivo` criado com `dataDeteccao` correta.

4. **Fechamento automático via checklist** — Na semana seguinte, salvar checklist com `operacional = true` para o mesmo ativo → `dataResolucao` preenchida e `origemResolucao = "CHECKLIST"`.

5. **Fechamento manual** — Clicar "Marcar como Resolvido" no painel → `dataResolucao = now()` e `origemResolucao = "MANUAL"`.

6. **MTBF** — Inserir 3 registros de falha com datas conhecidas → verificar cálculo de MTBF no endpoint de indicadores.

7. **Flag Substituir (Ilha Self)** — Inserir 3 reincidências e custo > R$ 5.000 → painel exibe badge "AVALIAR SUBSTITUIÇÃO".

8. **Delegação de Tarefa** — Dia 21: clicar "Delegar" para unidade vermelha → `Tarefa` criada com `atribuidoParaId` = Gestor e notificação enviada.

---

## Fases de Entrega (Prioridade)

| Fase | Escopo | Dependência |
|------|--------|-------------|
| **1** | Schema (AtivoLoja + RegistroFalhaAtivo + ChecklistRotinaInfra) + migração das planilhas | Nenhuma |
| **2** | Checklists de Rotinas (Gerador + Incêndio) + tela do Gestor | Fase 1 |
| **3** | Vínculo `ativoId` no checklist de equipamentos + criação/fechamento automático de `RegistroFalhaAtivo` | Fase 1 |
| **4** | `IndicadoresService` (MTBF/MTTR) + botão "Marcar Resolvido" | Fase 3 |
| **5** | Painel de Inteligência do Coordenador (conformidade + vencimentos + Buy vs Maintain) | Fases 2, 3 e 4 |

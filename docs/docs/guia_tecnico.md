# Guia Técnico Completo — SGM (Setor de Gerenciamento de Manutenção)

Este guia documenta as decisões de arquitetura, padrões de projeto e fluxos de dados do sistema SGM, servindo como referência para desenvolvedores e arquitetos.

---

## 1. Arquitetura Geral
O sistema é uma aplicação monorepo dividida em `client` (Frontend) e `server` (Backend), projetada para ser escalável e segura.

### Stack Tecnológica
*   **Frontend**: React 19 + Vite + Vanilla CSS (Design System customizado).
*   **Backend**: Node.js 22 + Express 5 + Prisma ORM.
*   **Infraestrutura**: PostgreSQL (Banco), Redis (Sessão e Rate Limiting).
*   **Deploy**: Vercel (Serverless Functions para o backend e Static Hosting para o frontend).

---

## 2. Padrões de Frontend

### Gerenciamento de Estado
1.  **Estado Global**: Gerenciado via **React Context API** para dados que raramente mudam (Autenticação, Tema).
2.  **Estado de Servidor**: Gerenciado via **TanStack Query (React Query)**. 
    *   Utilizamos `staleTime` para otimizar o cache.
    *   Chaves de consulta (`queryKey`) incluem filtros como `mes` e `ano` para refetch automático.
3.  **Lógica Reativa (Pattern useMemo)**:
    *   Para navegações complexas (drill-down), evitamos salvar objetos inteiros no estado.
    *   Salvamos apenas identificadores (ex: `lojaId`).
    *   O objeto real e seus derivados (semanas, KPIs) são calculados via `useMemo` a partir dos dados do cache, garantindo que se o período mudar, a UI se atualize sem perder o contexto.

### Design System e CSS
*   **Theming**: Sistema de temas claro/escuro utilizando variáveis CSS (`var(--color-...)`).
*   **Componentes de Feedback**: Padronização de Tooltips (`InfoTooltip`) e Modais para garantir UX consistente em dispositivos móveis e desktop. O `InfoTooltip` suporta `balloonStyle` para ajustes finos de posicionamento em telas compactas.
*   **Responsividade**: Mobile-first nas tabelas e cards, com colapso de sidebar e menus de ação otimizados para toque. O header de checklists consolidados mantém textos empilhados à esquerda e filtros à direita para melhor adaptação mobile.

---

## 3. Padrões de Backend

### Segurança e RBAC (Role-Based Access Control)
O sistema utiliza uma hierarquia rígida de acessos. O backend não confia no frontend para filtrar dados; ele aplica filtros de isolamento regional diretamente na query.

*   **Isolamento Regional**: Implementado via `getAccessFilter(usuario)`. 
    *   Se o usuário for `COORDENADOR`, o filtro injeta automaticamente um `WHERE regiao IN (...)` em todas as consultas de lojas, chamados e checklists.
*   **Autenticação**:
    *   **JWT**: Tokens de vida curta (15 min).
    *   **Refresh Token**: Rotação automática e persistência no DB para permitir revogação de sessões.
*   **Rate Limiting**: Proteção contra força bruta e DoS em múltiplos níveis (Auth, Global e Escrita).

### Estrutura de Rotas
As rotas são versionadas (`/api/v1/...`) e protegidas por middlewares de autenticação e validação de roles.

---

## 4. Lógica de Negócio e Dados

### Checklists Consolidados
A agregação de checklists é feita de forma semanal, mas visualizada mensalmente.
*   **Normalização**: O sistema agrupa checklists por `semana` e `ano`. 
*   **Visão Macro**: O componente `ResumoMacroRegional` utiliza um algoritmo que identifica a última semana válida reportada por cada loja para gerar um consolidado de "Estado Atual" das pendências da regional. Se não houver pendências, exibe um estado de "Tudo Operacional".
*   **Estabilização de Modais**: O `ChecklistCardModal` utiliza uma lógica de busca robusta (ID Técnico + Fallback por Label + Trimming) para garantir que os dados de itens com defeito sejam encontrados mesmo com variações de nomenclatura vindas do banco de dados. Além disso, sincroniza automaticamente a semana inicial com a visão selecionada pelo usuário.

### BI e Gráficos
*   **Pareto**: Cálculo de 80/20 feito no frontend a partir do dump de chamados do período.
*   **Concentração por Fornecedor**: Monitoramento de risco de dependência (alerta visual em >40%).
*   **Score de Coordenadores**: Algoritmo que pondera 5 variáveis (Adesão, Custo, Disponibilidade, Tempo de Resposta e Conservação/Mau Uso).

---

## 5. Fluxo de Desenvolvimento e Deploy

### Banco de Dados
Utilizamos **Prisma Migration** para versionamento do esquema. O `seed.js` é fundamental para manter ambientes de desenvolvimento com dados de teste consistentes.

### Deploy na Vercel
*   **Monorepo**: Dois projetos separados vinculados ao mesmo repositório.
*   **Anti-Flash**: Implementação de script inline no `index.html` para evitar o flash de tema claro em usuários que utilizam o tema escuro antes do carregamento do React.

---

## 7. Manutenção Automática e Auditoria

### Ciclo de Vida de Dados (Cleanup)
Para gerenciar o crescimento do banco de dados em ambientes serverless (Vercel) e persistentes (Railway), o sistema implementa uma estratégia híbrida de limpeza:
- **Jobs Centralizados:** Localizados em `src/jobs/limpeza.job.js`, centralizam a lógica de deleção de sessões expiradas, tokens revogados e logs antigos.
- **Trigger Híbrido:**
    - Em servidores persistentes, utiliza `node-cron` para agendamento interno.
    - Em ambiente Vercel, expõe um endpoint `POST /api/v1/jobs/limpar` protegido por um segredo (`CRON_SECRET`) para ser acionado por serviços externos de cron.

### Trilha de Auditoria
Toda ação crítica no sistema (Criação, Edição, Deleção) é registrada no modelo `LogAuditoria`.
- **Captura Automática:** Services invocam o `LogService` para registrar o `antes` e `depois` de cada alteração.
- **Retenção Diferenciada:** Logs de autenticação são mantidos por 90 dias, enquanto logs de negócio (Checklists, Chamados) são mantidos por 2 anos.

---

## 8. Guia de Expansão
Para adicionar novas funcionalidades:
1.  **Modelo**: Atualizar `schema.prisma`.
2.  **Controller**: Implementar lógica respeitando o `getAccessFilter`.
3.  **Frontend Service**: Adicionar chamada em `services/index.js`.
4.  **UI**: Utilizar componentes do design system em `src/components/`.

---

## 9. Visão Executiva e Inteligência de Ativos (Fase 5)

A **Fase 5** introduziu análises estratégicas de alto nível para Coordenadores, Gerentes, Diretores e Administradores, unindo engenharia de confiabilidade e tomada de decisão financeira.

### Matriz de Conformidade Consolidada
*   **Agregação por Regional e Unidade**: Calcula a média percentual de preenchimento dos checklists (`checklistCoverage`) e preventivas em dia (`preventivaAdherence`) das lojas de forma integrada no período de referência.
*   **Semáforos de Infraestrutura Crítica**:
    *   **Laudos de Cabine Primária**: Monitorados diretamente a partir da data em `proximaPreventiva` dos ativos da categoria correspondente. Status "VENCIDO" se a data for anterior à data atual.
    *   **Controle de Baterias**: Monitoramento da data limite em `proximaTrocaBateria` nos nobreaks e geradores. Status "VENCIDO" se a data já expirou.

### Inteligência Analítica "Buy vs. Maintain" (Comprar ou Manter)
O sistema calcula automaticamente se um ativo crítico de infraestrutura (Geradores, Nobreaks, Cabines Primárias ou Ilhas de Congelados) deve ser mantido ou substituído por um novo.
*   **Indicadores de Confiabilidade**:
    *   **MTBF (Mean Time Between Failures)**: Tempo operacional médio por falha registrada em `RegistroFalhaAtivo`. Quando o ativo ainda nao possui falhas, a API retorna `null` para evitar exibir uma media artificial.
    *   **MTTR (Mean Time To Repair)**: Tempo medio (em horas) para resolucao das falhas operacionais. So considera falhas com `dataResolucao` preenchida; falhas abertas nao entram como reparo de zero hora.
    *   **Uptime %**: Percentual de tempo em que o equipamento esteve disponível no período selecionado (descontando o tempo de parada registrado em `RegistroFalhaAtivo`).
    *   **Falhas abertas**: Falhas sem `dataResolucao` continuam contribuindo para downtime e uptime, mas a UI exibe MTTR como "Em aberto" ate a resolucao.
*   **Fórmulas de Decisão**:
    *   **Regra Geral**: Se o custo acumulado de manutenções/reparos (`custoAcumulado`) ultrapassar **60%** do valor de aquisição ou substituição (`custoSubstituicao`) do ativo, se o Uptime for inferior a **85%** com pelo menos 3 falhas, ou se o MTBF for inferior a **30 dias** com pelo menos 2 falhas, o sistema recomenda **SUBSTITUIR (BUY)**.
    *   **Regra de Altíssima Criticidade (Ilhas de Congelados)**: Por ter impacto imediato no faturamento ("sem ilha = sem venda"), a recomendação de substituição é mais severa. O sistema recomenda **SUBSTITUIR (BUY)** se o MTBF for menor que **180 dias** quando houver falhas recorrentes.
*   **Valores de Substituição Padrão**: Na ausência de valor cadastrado em `dadosTecnicos.custoSubstituicao`, são aplicados os fallbacks automáticos:
    *   Cabine Primária: R$ 120.000,00
    *   Gerador: R$ 80.000,00
    *   Nobreak: R$ 35.000,00
    *   Ilha Self (Ilha de Congelados): R$ 25.000,00
*   **Implementacao compartilhada**: O calculo de MTBF, MTTR, uptime, falhas abertas e falhas resolvidas fica centralizado em `server/src/utils/confiabilidadeAtivo.js`, usado tanto por `falhaAtivo.service.js` quanto por `dashboard.service.js`.
*   **Resolucao de falhas**: Falhas podem ser encerradas manualmente via `PATCH /api/v1/falhas-ativo/:id/resolver` ou automaticamente quando um checklist posterior marca o ativo como operacional. A resolucao manual registra `origemResolucao = MANUAL`; a resolucao por checklist registra `origemResolucao = CHECKLIST`.
*   **UI**: A aba Comprar vs. Manter agrupa os ativos por Regional > Loja > Categoria. O modal de detalhes do ativo exibe observacoes cadastradas abaixo dos KPIs de confiabilidade quando existirem.

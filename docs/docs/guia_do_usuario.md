# Guia do Usuario

Este guia apresenta, em linguagem simples, as funcionalidades que ja estao disponiveis no sistema e como cada area deve ser usada no dia a dia.

---

## 1. Visao geral do sistema

O SGM organiza a operacao de manutencao em modulos:

- Dashboard Principal
- Controle Financeiro
- Checklists
- Tarefas
- Estoque
- Fornecedores
- Usuarios e lojas

O acesso muda conforme o perfil do usuario:

- `ADMINISTRADOR`: acesso total
- `DIRETOR`: visao global da operacao
- `GERENTE`: visao das suas regionais
- `COORDENADOR`: visao das suas regionais
- `GESTOR`: visao da sua loja, preenchimento de checklist e gestao de tarefas da unidade
- `TECNICO`: visao das tarefas atribuidas e atualizacao de progresso

---

## 2. Dashboard Principal

O Dashboard Principal concentra a leitura executiva da operacao.

### O que o usuario encontra

- indicadores principais do periodo
- historico de gastos
- distribuicao de gastos por segmento da rede
- ranking de coordenadores
- cards por regional com botoes de drill-down

### Ranking de Coordenadores

O score do coordenador mostra o desempenho operacional de forma consolidada.

- o score sobe com mais disponibilidade, menor custo por chamado e melhor cobertura de checklist
- o score cai com equipamentos parados, carrinhos quebrados, tarefas ativas e registros de mau uso

Ha um botao de ajuda `?` ao lado do titulo para explicar isso diretamente na tela.

### Drill-down dos cards regionais

Ao abrir uma regional no dashboard, os botoes levam o usuario para contextos diferentes:

- `Abrir chamados da regional`: leva ao Controle Financeiro ja filtrado na regional
- `Ver chamados`: leva direto para a loja relacionada
- `BI Regional`: leva para a visao regional de graficos, sem parar primeiro na tabela

Isso evita que o usuario precise refazer filtros manualmente.

---

## 3. Controle Financeiro

O modulo de Controle Financeiro organiza os chamados e os indicadores de custo do periodo.

### O que o usuario pode fazer

- consultar chamados por mes e ano
- navegar por regional e por loja
- abrir chamados dentro do contexto certo da regional
- analisar os maiores ofensores de custo
- identificar concentracao de gastos por fornecedor, segmento ou empresa

### Indicadores disponiveis

- gasto total
- quantidade de chamados
- ticket medio
- `Top 10 Lojas Criticas (Custo)`

### Grafico de Pareto

O Pareto ajuda a priorizar onde atacar primeiro.

- as barras mostram os maiores custos
- a linha mostra a porcentagem acumulada
- o usuario pode alternar entre `segmentos` e `empresas`

Interpretacao curta para o usuario:

"Poucos itens podem concentrar a maior parte do gasto. O Pareto ajuda a enxergar quais sao eles."

Tambem existe um botao `?` com essa explicacao na propria tela.

### Concentracao por Fornecedor

Esse bloco mostra quanto do budget do periodo esta concentrado em cada empresa fornecedora.

- usa grafico de rosca
- mostra uma lista lateral com os fornecedores e sua participacao
- destaca o fornecedor lider
- gera alerta visual quando algum fornecedor ultrapassa `40%` do total

Interpretacao curta para o usuario:

"Se um fornecedor concentra parte muito alta do gasto, existe risco de dependencia."

---

## 4. Checklists

O modulo de Checklists cobre equipamentos e carrinhos da operacao.

### Preenchimento semanal

O preenchimento e feito pelo `GESTOR`.

- equipamentos
- carrinhos

O sistema permite atualizar o checklist da mesma semana, sem duplicar o registro.

Quando um equipamento vinculado a um ativo e marcado como nao operacional, o sistema abre uma falha para esse ativo. Essa falha fica aberta ate ser resolvida manualmente nos detalhes do ativo ou ate o proximo checklist marcar o mesmo ativo como operacional.

### Consolidado gerencial

Os perfis gerenciais acessam o consolidado por camadas:

- `ADMINISTRADOR` e `DIRETOR`: iniciam por gerentes
- `GERENTE`: inicia por coordenadores
- `COORDENADOR`: inicia por regionais
- `GESTOR`: inicia por lojas

Sempre que o usuario desce um nivel, aparece um botao de voltar. Ao retornar para a raiz do seu perfil, esse botao desaparece.

---

## 5. Tarefas

O modulo de Tarefas organiza as demandas operacionais da manutencao.

### O que o usuario pode fazer

- criar tarefa e atribuir conforme hierarquia (ex: Diretor -> Gerente)
- acompanhar status e priorizar execucao
- receber notificações automáticas de novas tarefas ou mudanças de status
- marcar todas as notificações como lidas instantaneamente no cabeçalho

### Hierarquia de Atribuição
Para garantir a ordem operacional, as tarefas seguem este fluxo de comando:
- **Diretor**: atribui tarefas para Gerentes.
- **Gerente**: atribui para Coordenadores de sua regional. (Pode deletar, mas não altera status).
- **Coordenador**: atribui para Gestores e Técnicos de sua regional. (Pode deletar, mas não altera status).
- **Gestor**: atribui para Técnicos de sua unidade e para si mesmo. (Pode atualizar status e deletar).
- **Técnico**: visualiza e atualiza o status de suas próprias tarefas.

### Centro de Notificações
Localizado no sino (topo da tela), o centro de notificações alerta sobre:
- Novas tarefas recebidas
- Mudanças de status em tarefas que você criou ou gerencia
- Você pode clicar em **"Marcar todas como lidas"** para limpar seus alertas de uma só vez.

---

## 6. Estoque

O modulo de Estoque controla pecas e sua movimentacao.

### Funcionalidades

- cadastro de pecas
- entradas com nota fiscal
- movimentacoes entre operacao e requisitante
- saidas definitivas
- atualizacao do saldo de estoque

---

## 7. Fornecedores

O modulo de Fornecedores centraliza os parceiros de manutencao.

---

## 8. Ativos e Confiabilidade

O modulo de Ativos organiza os equipamentos cadastrados por loja e permite acompanhar detalhes tecnicos, observacoes importantes e indicadores de confiabilidade.

### Gestores

O `GESTOR` visualiza os ativos da sua propria loja agrupados por categoria. Ao abrir uma categoria, o sistema mostra a planilha com os ativos daquele grupo.

### Perfis gerenciais

Coordenadores, Gerentes, Diretores e Administradores navegam por camadas de gestao, como regional, loja e categoria, conforme seu escopo de acesso.

### Detalhes e KPIs do ativo

Ao abrir os detalhes de um ativo, o usuario visualiza:

- MTBF
- MTTR
- Uptime
- Total de falhas
- Observacoes importantes, quando cadastradas
- Historico de falhas

Falhas abertas aparecem com o botao `Resolver`. Ao resolver uma falha, o sistema registra a data de resolucao e recalcula os indicadores do ativo.

### Como interpretar MTBF e MTTR

- `MTBF`: tempo medio entre falhas. So aparece quando existe historico de falhas (mínimo 2).
- `MTTR`: tempo medio de reparo. So e calculado quando existe falha resolvida.
- Se houver falha aberta sem resolucao, o MTTR aparece como `Em aberto`.
- Se ainda nao houver falhas resolvidas, o MTTR aparece como `Sem reparos`.

Essas regras evitam interpretar uma falha recem-aberta como reparo de zero hora.

### Custo Estimado de Substituição (Ordem de Prioridade)
Para a análise Comprar vs Manter, o sistema determina o custo de substituição do ativo na seguinte ordem:
1. **Valor de Substituição direto da tabela:** Coluna `valorSubstituicao` no cadastro do ativo (`ativos_loja`).
2. **Dados Técnicos (JSON):** Atributo `custoSubstituicao` no campo flexível `dadosTecnicos` do ativo.
3. **Fallback por Categoria:** Valores padronizados se as opções anteriores estiverem vazias (Geradores: R$ 80k, Nobreaks: R$ 35k, Cabines Primárias: R$ 120k, Ilhas/Congelados: R$ 25k, demais ativos: R$ 15k).

### Maturidade de Confiabilidade (Evitar Falsos Positivos)
Para evitar que ativos novos sejam sugeridos para substituição precipitadamente (devido a poucas quebras logo após o cadastro), **o sistema exige que o ativo esteja cadastrado há pelo menos 90 dias** para aplicar as validações de **Uptime** (<85%) e **MTBF** (<30 dias). Ativos com menos de 90 dias são avaliados apenas pelo critério de **custo acumulado de reparo > 60%** do valor do ativo.

---

## 9. Painel de Auditoria (Apenas Administradores)

O sistema mantém um registro completo de todas as alterações importantes realizadas pelos usuários para garantir segurança e rastreabilidade.

### O que é registrado?
- **Login e Logout:** Registros de acessos e tentativas falhas.
- **Alterações de Dados:** Quem criou, editou ou excluiu registros em modulos como Checklists, Chamados, Estoque e Usuarios.
- **Valores Alterados:** O sistema salva o estado do registro antes e depois da alteração, permitindo saber exatamente o que foi mudado.

### Como consultar?
Acesse o menu **Admin -> Logs de Auditoria**. Você pode filtrar por:
- **Modulo:** (Ex: Checklists, Financeiro, Usuarios)
- **Periodo:** Data inicial e final.
- **Tipo de Ação:** (Criação, Edição, Exclusão).

---

## 10. Como explicar os principais graficos ao usuario final

### Pareto

"As colunas mostram onde estao os maiores custos. A linha mostra quanto do total ja foi acumulado. Assim fica facil ver quais poucos itens concentram a maior parte do gasto."

### Consolidado Regional (Visão Macro)

"Ao selecionar uma Regional ou Coordenador, o sistema exibe automaticamente um card de resumo no topo. Ele soma todos os equipamentos e carrinhos que foram reportados com defeito na semana mais atual de cada loja. Isso permite ao gestor saber, por exemplo, que a Regional X tem 50 carrinhos quebrados no total, sem precisar entrar em cada loja individualmente."

### Concentracao por Fornecedor

"Esse grafico mostra quanto do valor do periodo esta concentrado em cada fornecedor. Se um fornecedor ultrapassa 40%, o sistema sinaliza um risco de dependencia."

### Ranking de Coordenadores

"O score resume desempenho operacional. Ele melhora com boa cobertura de checklist, menor custo por chamado e maior disponibilidade, e piora com paradas, quebras, tarefas ativas e mau uso."

### Comprar vs Manter

"O sistema cruza custo acumulado, falhas, MTBF, MTTR e uptime (desde que o ativo tenha mais de 90 dias de cadastro) para indicar se um ativo deve ser mantido ou substituído. O custo de substituição prioriza o valor cadastrado na tabela de ativos (\`valorSubstituicao\`), caindo nos dados técnicos ou em fallbacks de categoria se estiver ausente. O card do ativo destaca o status SUBSTITUIR em vermelho juntamente com os motivos técnicos da recomendação."

### Barra de Orçamento Regional (Metas)

"Ao detalhar uma Regional nas Metas Orçamentárias, o topo exibe a barra consolidada de progresso do budget da regional (Verde até 90%, Amarelo até 110%, Vermelho acima de 110%). Lojas sem metas individuais cadastradas aparecem em tom cinza neutro para sinalizar que não há limite específico, impedindo que herdem o valor cheio da regional."

---

## 11. Observacoes de uso

- use os filtros de mes e ano para comparar periodos
- sempre que possivel, navegue pelos botoes de drill-down para ja cair no contexto correto
- nos graficos com botao `?`, passe o mouse ou foque o botao para ver a explicacao rapida
- no consolidado de checklists, use o botao de voltar para retornar nivel a nivel ate a raiz do seu perfil

---

## 12. Proximo passo recomendado

Conforme novas funcionalidades entrarem no sistema, este guia deve ser atualizado junto com o `README`, para manter alinhados:

- funcionamento real da aplicacao
- regras de acesso
- explicacoes para o usuario final

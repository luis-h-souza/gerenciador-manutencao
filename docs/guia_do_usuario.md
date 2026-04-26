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

## 8. Usuarios e lojas

O sistema tambem possui gestao administrativa para estruturar o acesso.

---

## 9. Como explicar os principais graficos ao usuario final

### Pareto

"As colunas mostram onde estao os maiores custos. A linha mostra quanto do total ja foi acumulado. Assim fica facil ver quais poucos itens concentram a maior parte do gasto."

### Concentracao por Fornecedor

"Esse grafico mostra quanto do valor do periodo esta concentrado em cada fornecedor. Se um fornecedor ultrapassa 40%, o sistema sinaliza um risco de dependencia."

### Ranking de Coordenadores

"O score resume desempenho operacional. Ele melhora com boa cobertura de checklist, menor custo por chamado e maior disponibilidade, e piora com paradas, quebras, tarefas ativas e mau uso."

---

## 10. Observacoes de uso

- use os filtros de mes e ano para comparar periodos
- sempre que possivel, navegue pelos botoes de drill-down para ja cair no contexto correto
- nos graficos com botao `?`, passe o mouse ou foque o botao para ver a explicacao rapida
- no consolidado de checklists, use o botao de voltar para retornar nivel a nivel ate a raiz do seu perfil

---

## 11. Proximo passo recomendado

Conforme novas funcionalidades entrarem no sistema, este guia deve ser atualizado junto com o `README`, para manter alinhados:

- funcionamento real da aplicacao
- regras de acesso
- explicacoes para o usuario final

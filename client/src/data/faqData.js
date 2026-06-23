export const faqCategories = [
  { id: 'todos', label: 'Todos' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'infraestrutura', label: 'Infraestrutura' },
  { id: 'falhas', label: 'Falhas & Ativos' },
  { id: 'metricas', label: 'Métricas' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'organizacao', label: 'Organização' },
];

export const faqData = [
  {
    id: 'pareto-chart',
    category: 'dashboard',
    title: 'O que é o Gráfico de Pareto no Dashboard?',
    description: 'Entenda a regra 80/20 aplicada aos gastos de manutenção.',
    content: `O Gráfico de Pareto mostra quais segmentos de manutenção concentram a maior parte dos custos, com base na regra 80/20.

**Como funciona:**
- Os segmentos ou empresas são ordenados do maior para o menor gasto
- A linha acumulada mostra quantos segmentos ou empresas respondem por 80% do total
- Normalmente 2 a 4 segmentos ou empresas concentram a maior parte dos gastos

**Como usar:**
- Identifique o que está acima da linha de 80%
- Esses são os focos prioritários de otimização de custo
- Renegocie contratos para preventivas ou avalie se há mau uso nos segmentos líderes

**Exemplo:** Se AR CONDICIONADO e GERADOR representam 78% dos gastos, são eles que merecem atenção estratégica primeiro.`,
  },
  {
    id: 'buy-vs-maintain',
    category: 'dashboard',
    title: 'O que é a análise Comprar vs Manter?',
    description: 'Inteligência para decidir entre reparar ou substituir um ativo.',
    content: `A análise **Comprar vs Manter** avalia se vale mais a pena continuar reparando um equipamento ou substituí-lo por um novo.

**Critérios analisados:**
- **Custo acumulado de manutenção:** Total gasto em chamados para aquele ativo.
- **MTBF (tempo médio entre falhas):** Frequência com que o equipamento quebra (mínimo de 2 falhas para cálculo).
- **MTTR (tempo médio de reparo):** Tempo médio para resolver falhas já encerradas.
- **Taxa de disponibilidade (Uptime):** Porcentagem do tempo em que está operacional.

**Como o Custo de Substituição é calculado (Ordem de Prioridade):**
1. **Valor de Substituição no Banco de Dados:** O sistema busca primeiro a coluna \`valorSubstituicao\` na tabela do ativo (\`ativos_loja\`).
2. **Dados Técnicos Flexíveis:** Se não houver o valor acima, verifica a propriedade \`custoSubstituicao\` dentro do campo JSON \`dadosTecnicos\` do ativo.
3. **Fallback por Categoria:** Caso nenhuma das opções anteriores exista, o sistema estima o valor conforme a categoria (Gerador: R$ 80k, Nobreak: R$ 35k, Cabine Primária: R$ 120k, Ilha/Congelado: R$ 25k, outros: R$ 15k).

**Indicadores de substituição (Recomendação "SUBSTITUIR"):**
- **Custo acumulado** > 60% do valor de substituição do ativo.
- **Uptime de confiabilidade** < 85% com histórico recorrente (mínimo 5 falhas).
- **MTBF** < 30 dias (ou < 180 dias para ilhas de congelados) com pelo menos 2 falhas.

**Evitando Falsos Positivos (Maturidade de Histórico):**
Para evitar que ativos novos ou recém-cadastrados sejam recomendados para substituição por "fotografias" de curto prazo (como duas falhas seguidas logo após o cadastro), **as regras de Uptime e MTBF só são aplicadas se o ativo tiver pelo menos 90 dias de cadastro no SGM**. Para ativos com menos de 90 dias, apenas o critério de custo acumulado (>60%) pode sugerir a troca.

**Como acessar e visualizar:** No Dashboard, na aba **Comprar vs. Manter**. Os ativos aparecem agrupados por regional, loja e categoria. Ativos que ultrapassam os limites aparecem destacados em vermelho indicando "SUBSTITUIR" e exibem detalhadamente na tela os motivos específicos da recomendação.`,
  },
  {
    id: 'conformidade-operacional',
    category: 'dashboard',
    title: 'O que é a Conformidade Operacional?',
    description: 'Visão consolidada do cumprimento de rotinas de manutenção preventiva.',
    content: `A **Conformidade Operacional** mede o percentual de rotinas obrigatórias que foram executadas dentro do prazo.

**Rotinas monitoradas:**
- Teste semanal do gerador
- inspeção mensal do sistema de incêndio
- Teste bimestral da bomba de incêndio
- Preenchimento semanal dos checklists de equipamentos e carrinhos

**Como é calculado:**
\`Conformidade = (Rotinas realizadas no prazo / Total de rotinas esperadas) × 100\`

**Faixas de interpretação:**
- 🟢 Acima de 90% — Excelente
- 🟡 Entre 70% e 90% — Atenção necessária
- 🔴 Abaixo de 70% — Crítico, requer intervenção imediata

**Quem é responsável:** Gestores executam as rotinas; Coordenadores e Gerentes acompanham a conformidade de sua regional.`,
  },
  {
    id: 'o-que-sao-checklists',
    category: 'checklists',
    title: 'O que são os Checklists semanais?',
    description: 'Entenda como funcionam os checklists de equipamentos e carrinhos.',
    content: `Os **Checklists semanais** são inspeções periódicas realizadas pelos Gestores de cada loja para monitorar o estado dos equipamentos e carrinhos de clientes.

**Tipos de checklist:**
- **Equipamentos:** Empilhadeiras, serras-fita, elevadores, escadas rolantes, ilhas self, etc.
- **Carrinhos:** Maria-gorda, supercar, dois-andares, prancha, carrinho de bebê, etc.

**Como funciona:**
1. A cada semana, o Gestor acessa a página de Checklists
2. Informa para cada equipamento: se está operacional, quantidade disponível, quantidade quebrada
3. Se houver problemas, registra o número do chamado e descrição
4. O sistema vincula automaticamente ao ativo correspondente

**Prazos:** O **checklist de equipamentos** deve ser preenchido toda **terça-feira**, o **checklist de carrinhos** deve ser preenchido toda **quinta-feira** de cada semana. Preenchimentos após estas datas ficam marcados como "atrasados".

**Quem vê o quê:**
- **GESTOR:** Preenche e visualiza apenas sua loja
- **COORDENADOR/GERENTE:** Visualiza checklists consolidados de sua regional`,
  },
  {
    id: 'adesao-inadimplencia-checklists',
    category: 'checklists',
    title: 'O que são Adesão no Mês e Inadimplência nos Checklists?',
    description: 'Entenda os indicadores de preenchimento mensal dos checklists.',
    content: `Os indicadores de **Adesão no Mês** e **Inadimplência** mostram se as lojas estão cumprindo a rotina preventiva de checklists.

**Adesão no Mês**

Mede o percentual de lojas que iniciaram ao menos um checklist preventivo no mês selecionado.

\`Adesão = (Lojas com preenchimento / Total de lojas ativas) × 100\`

**Como interpretar:**
- Quanto maior a adesão, maior a cobertura preventiva da operação
- Uma loja conta como aderente quando tem pelo menos um checklist preenchido no mês
- O indicador cruza as lojas dentro do escopo do usuário, como regionais sob gestão ou lojas da regional selecionada

**Inadimplência Total / Lojas Pendentes**

Mostra quantas lojas estão com **zero checklists preenchidos no mês**.

**Por que isso importa:**
- Lojas sem checklist deixam de registrar problemas preventivamente
- A manutenção pode ficar mais reativa, ou seja, só aparece quando já virou chamado ou custo
- Ao clicar nos cards de preenchidas ou pendentes, o sistema lista as lojas agrupadas por regional

**Como usar:** Priorize as lojas pendentes e cobre o preenchimento dentro do mês para melhorar a visibilidade da operação.`,
  },
  {
    id: 'insights-correlacionados-checklists',
    category: 'checklists',
    title: 'O que são Insights Correlacionados nos Checklists?',
    description: 'Cruzamento entre gasto regional e adesão mensal aos checklists.',
    content: `Os **Insights Correlacionados** cruzam o volume financeiro com a adesão mensal aos checklists.

**Como funciona:**
- O sistema compara os gastos do período com a cobertura de checklist das regionais
- A prioridade aparece onde o gasto é alto e a prevenção está baixa
- O alerta mais crítico ocorre quando a regional líder em gastos também é a de menor cobertura de checklist

**O que o painel mostra:**
- Regional com maior gasto no período
- Percentual de cobertura de checklist dessa regional
- Quantidade de lojas sem checklist no mês, quando houver
- Regionais com cobertura abaixo do ideal

**Como interpretar:**
- Gasto alto + baixa adesão pode indicar manutenção reativa
- Baixa cobertura reduz a capacidade de antecipar problemas
- Se não houver alerta relevante, significa que a regional líder em gastos não coincide com a menor cobertura de checklist

**Como agir:** Verifique as lojas sem checklist, cobre preenchimento preventivo e compare se os chamados financeiros estão ligados à falta de acompanhamento operacional.`,
  },
  {
    id: 'gerador-semanal',
    category: 'infraestrutura',
    title: 'Teste Semanal com carga do Gerador',
    description: 'Como registrar e acompanhar o teste semanal do gerador.',
    content: `O **teste semanal do gerador** é uma rotina obrigatória de manutenção preventiva para garantir que o equipamento funcione em casos de falta de energia.

**Frequência:** Uma vez por semana (toda semana)

**Prazo para registro:** Preferencialmente às segundas-feiras (teste com carga)

**Como registrar:**
1. Acesse "Rotinas de Infra." no menu lateral
2. Clique em "Nova Rotina"
3. Selecione o tipo **Teste Semanal do Gerador**
4. Informe se o teste foi **Conforme** ou **Não Conforme**
5. Em caso de não conformidade, descreva o problema encontrado
6. Salve o registro

**O que acontece se não registrar:**
- A pendência aparece no Dashboard de Conformidade
- O Coordenador e Gerente recebem alerta de pendência
- A conformidade da loja é impactada negativamente

**Dica:** Associe o registro ao ativo do gerador para acumular histórico de falhas e calcular o MTBF automaticamente.`,
  },
  {
    id: 'incendio-mensal',
    category: 'infraestrutura',
    title: 'Inspeção mensal do Sistema de combate a Incêndio',
    description: 'Como registrar a inspeção mensal do sistema de combate a incêndio.',
    content: `A **inspeção mensal do sistema de combate a incêndio** verifica o estado aparente dos componentes do sistema de incêndio (sprinklers, extintores, sinalização, bombas de incêndio, VGA's, iluminação de emergência).

**Frequência:** Uma vez por mês

**Prazo para registro:** Até o dia 20 do mês

**O que deve ser verificado:**
- A realização do checklist mensal de combate a incêndio
- Extintores com validade e lacre intacto
- Sinalização de emergência visível e iluminada
- Sprinklers sem obstruções
- Acesso aos hidrantes desobstruídos com as mangueiras e acessórios em conformidade

**Como registrar:**
1. Acesse "Rotinas de Infra." no menu lateral
2. Clique em "Nova Rotina"
3. Selecione **inspeção mensal (Incêndio)**
4. Marque se está **Conforme** ou **Não Conforme**
5. Descreva qualquer anomalia encontrada

**Atenção:** Não confunda com o Teste de Bomba Bimestral, que é um procedimento diferente e mais completo.`,
  },
  {
    id: 'bomba-bimestral',
    category: 'infraestrutura',
    title: 'Teste Bimestral da Bomba de Incêndio',
    description: 'Procedimento para registrar o teste bimestral da bomba de incêndio.',
    content: `**Teste bimestral da bomba** é um teste operacional completo que verifica se a bomba de pressurização do sistema de incêndio funciona corretamente sob carga.

**Frequência:** A cada dois meses (bimestral)

**Meses de referência:** Fevereiro, Abril, Junho, Agosto, Outubro, Dezembro

**Prazo para registro:** Até o dia 20 do mês

**Como funciona o teste:**
1. A bomba é acionada através de um hidrante ou no cavelete de testes
2. Verifica-se a pressão atingida (deve estar dentro dos parâmetros do projeto)
3. Verifica-se o tempo de resposta
4. Confirma-se que não há vazamentos nas conexões

**Como registrar no sistema:**
1. Acesse "Rotinas de Infra." → "Nova Rotina"
2. Selecione **Teste Bimestral da Bomba (Incêndio)**
3. Informe **Conforme** ou **Não Conforme**
4. Em caso de problema, abra um chamado e informe o número no campo "Descrição"

**Nota:** Este teste requer presença de técnico qualificado e pode exigir comunicação prévia com a administração do shopping/loja.`,
  },
  {
    id: 'reincidencia-falhas',
    category: 'falhas',
    title: 'O que é Reincidência de Falhas?',
    description: 'Entenda como o sistema detecta problemas que se repetem no mesmo ativo.',
    content: `A **reincidência** é identificada automaticamente quando o mesmo ativo apresenta um problema semelhante em menos de 90 dias após a última resolução.

**Como é detectada:**
- Ao registrar uma nova falha via checklist ou manualmente, o sistema verifica o histórico do ativo
- Se houver uma falha resolvida do mesmo tipo nos últimos 90 dias, a nova falha é marcada como **Reincidente**

**Por que isso importa:**
- Reincidências indicam que o problema de raiz não foi resolvido
- Um ativo com muitas reincidências é candidato à análise Comprar vs Manter
- Ajuda a pressionar fornecedores que não resolvem definitivamente os problemas

**Como visualizar:**
- Na página de **Ativos da Loja**, abra um ativo e veja o histórico de falhas
- Falhas reincidentes aparecem com ícone de alerta em laranja
- O Dashboard executa um ranking dos ativos com mais reincidências
- Falhas abertas podem ser encerradas pelo botão **Resolver** nos detalhes do ativo

**O que fazer com reincidências:**
- Escalar o chamado para um técnico especializado
- Questionar o fornecedor sobre a solução definitiva
- Avaliar substituição do componente ou do ativo completo`,
  },
  {
    id: 'mtbf-mttr',
    category: 'metricas',
    title: 'O que são MTBF e MTTR?',
    description: 'Métricas de confiabilidade para avaliar a saúde dos seus equipamentos.',
    content: `**MTBF** e **MTTR** são indicadores padrão da indústria para medir a confiabilidade de equipamentos.

---

**MTBF — Mean Time Between Failures (Tempo Médio Entre Falhas)**

Mede o intervalo médio entre uma falha e a próxima.

\`MTBF = Tempo total operacional / Número de falhas\`

**Interpretação:**
- MTBF alto = equipamento mais confiável
- MTBF < 30 dias = equipamento falha com muita frequência → atenção imediata
- Se o ativo ainda não tem falhas, o sistema mostra **Sem histórico** em vez de uma média artificial

---

**MTTR — Mean Time To Repair (Tempo Médio para Reparar)**

Mede quanto tempo leva, em média, para resolver uma falha após sua detecção.

\`MTTR = Soma dos tempos de reparo / Número de falhas resolvidas\`

**Interpretação:**
- MTTR baixo = problemas são resolvidos rapidamente
- MTTR alto = demora excessiva na resolução → rever processos
- Falhas abertas não contam como reparo de 0 hora
- Se existe falha aberta sem resolução, o sistema mostra **Em aberto**
- Se ainda não há falhas resolvidas, o sistema mostra **Sem reparos**

**Como fechar uma falha:**
- Abra **Ativos da Loja**
- Clique em **Detalhes e KPIs** do ativo
- No histórico de falhas, clique em **Resolver** na falha aberta
- O sistema registra a data de resolução e recalcula MTBF, MTTR e Uptime

---

**Disponibilidade**

\`Disponibilidade (%) = MTBF / (MTBF + MTTR) × 100\`

Um ativo com 95%+ de disponibilidade está em excelente estado.

---

**Onde encontrar:** Página **Ativos da Loja** → selecione um ativo → aba "Confiabilidade".`,
  },
  {
    id: 'limite-budget',
    category: 'orcamento',
    title: 'Como funciona o Limite de Budget?',
    description: 'Entenda as Metas Orçamentárias e como monitorar gastos por regional.',
    content: `O sistema permite cadastrar **Metas Orçamentárias** mensais por regional e/ou unidade, criando um limite de referência para os gastos de manutenção.

**Como configurar:**
- Acesse **Controle Financeiro** → aba "Metas" (ou através da página de Metas Orçamentárias)
- Defina o valor da meta por regional, unidade e mês/ano correspondente.

**Barra de Progresso Regional no Drill-Down:**
Ao entrar no detalhamento de uma regional no painel de Metas Orçamentárias:
- **Barra de Orçamento Regional:** É exibido no topo um indicador consolidado com o total de gastos das lojas daquela regional confrontado com a meta regional estipulada. Essa barra diminui gradualmente à medida que o saldo é consumido pelas lojas.
- **Faixas de Cores do Progresso:**
  * 🟢 **Verde:** Consumo menor ou igual a 90% do orçamento.
  * 🟡 **Amarelo:** Consumo entre 91% e 110% (alerta de proximidade do limite).
  * 🔴 **Vermelho:** Consumo acima de 110% (indica estouro crítico do budget).

**Comportamento dos Cards de Lojas:**
- **Metas Individuais:** Cada loja exibe seu próprio consumo com relação à sua meta específica (se cadastrada).
- **Sem Meta (Neutro):** Lojas que não possuem metas individuais cadastradas **não herdam a meta da regional** (evitando que pareçam "estouradas" com o valor total da regional). Os cards dessas lojas são coloridos com um tom **cinza neutro**, sinalizando que não há meta configurada para aquela unidade.

**Tipos de gasto computados:**
- Chamados com status **FINALIZADO**.
- Valor informado no campo "Valor" de cada chamado.

**Chamados sem valor:** Caso o chamado não tenha valor registrado, ele não impacta o cálculo orçamentário. Preencha sempre o campo "Valor" ao finalizar um chamado.`,
  },
  {
    id: 'concentracao-fornecedor',
    category: 'orcamento',
    title: 'O que é Concentração por Fornecedor?',
    description: 'Entenda o risco de dependência quando um fornecedor concentra muito do budget.',
    content: `A **Concentração por Fornecedor** mostra quanto do budget do mês está concentrado em cada empresa fornecedora.

**Como funciona:**
- O sistema soma os valores dos chamados do período por empresa
- Calcula a participação de cada fornecedor sobre o total gasto
- Exibe a distribuição em gráfico de rosca e em lista lateral com percentuais
- Destaca o fornecedor líder do período

**Limite de alerta:**
- Quando algum fornecedor passa de **40% do budget**, o painel sinaliza risco de dependência
- Abaixo desse limite, a distribuição é considerada sem concentração crítica

**Como interpretar:**
- Um fornecedor acima de 40% pode indicar dependência operacional ou financeira
- A concentração pode ser normal em meses com um serviço grande, mas deve ser acompanhada
- Se a mesma empresa aparece frequentemente acima do limite, vale revisar contratos, escopo e alternativas

**Onde encontrar:** No **Controle Financeiro**, na análise gráfica da loja ou no detalhe regional, no bloco **Concentração por Fornecedor**.`,
  },
  {
    id: 'sistema-regionais',
    category: 'organizacao',
    title: 'Como funciona o Sistema de Regionais?',
    description: 'Entenda a hierarquia de acesso por regiões e unidades.',
    content: `O SGM organiza os acessos em uma hierarquia regional para garantir que cada usuário veja apenas os dados de sua área de responsabilidade.

**Estrutura de Regionais:**
- SP CAPITAL (SP 01A, SP 02A, SP 03A, SP 04A, SP 05A, SP 06A)
- SP INTERIOR (SP 07, SP 08, SP 09, SP 10, SP 11, SP 12)
- SUL (PR, SC, RS)
- NORDESTE (PE, BA, CE, RN)
- CENTRO-OESTE (GO, DF, MT)
- OUTROS

**Hierarquia de acesso:**

  Role  |  O que vê
|-----|----------|
| ADMINISTRADOR | Tudo — todas as regiões |
| DIRETOR | Tudo — visão executiva |
| GERENTE | Sua(s) regional(is) completa(s) |
| COORDENADOR | Sua regional específica |
| GESTOR | Apenas sua loja |
| TECNICO | Apenas tarefas atribuídas a ele |

**Criação de dados:** Quando um Gestor cria um chamado ou checklist, a região e unidade são preenchidas automaticamente com os dados da sua loja — sem necessidade de seleção manual.

**Exceção:** ADMINISTRADOR e DIRETOR precisam selecionar explicitamente a regional/unidade ao criar registros.`,
  },
];

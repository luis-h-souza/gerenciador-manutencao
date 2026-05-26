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
- **Custo acumulado de manutenção:** Total gasto em chamados para aquele ativo
- **MTBF (tempo entre falhas):** Frequência com que o equipamento quebra
- **Taxa de disponibilidade:** Porcentagem do tempo em que está operacional

**Indicadores de substituição:**
- Custo acumulado > 60% do valor estimado de um ativo novo
- MTBF < 30 dias (quebra com muito frequência)
- Disponibilidade < 70%
- Reincidências repetidas no mesmo componente

**Como acessar:** No Dashboard, na seção "Inteligência de Ativos". Os ativos que ultrapassam os limites aparecem destacados em vermelho.`,
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

---

**MTTR — Mean Time To Repair (Tempo Médio para Reparar)**

Mede quanto tempo leva, em média, para resolver uma falha após sua detecção.

\`MTTR = Soma dos tempos de reparo / Número de falhas resolvidas\`

**Interpretação:**
- MTTR baixo = problemas são resolvidos rapidamente
- MTTR alto = demora excessiva na resolução → rever processos

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
- Acesse **Controle Financeiro** → aba "Metas"
- Defina o valor da meta por regional/unidade e mês

**Como o Dashboard usa isso:**
- Compara o total de chamados finalizados com a meta do período
- Exibe o percentual de utilização do budget
- Alerta visualmente quando o gasto ultrapassa 80% da meta

**Tipos de gasto computados:**
- Chamados com status **FINALIZADO**
- Valor informado no campo "Valor" de cada chamado

**Chamados sem valor:** Caso o chamado não tenha valor registrado, ele não impacta o cálculo orçamentário. Preencha sempre o campo "Valor" ao finalizar um chamado.

**Dica:** Use a visão **Regional** no Dashboard para comparar o consumo de orçamento entre regiões lado a lado.`,
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

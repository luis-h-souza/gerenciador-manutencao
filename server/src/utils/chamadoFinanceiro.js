const INVESTMENT_TOWER_OR = [
  { status: { in: ['PCI', 'LAUDOS'] } },
  // Compatibilidade com registros antigos em que a torre vinha pelo segmento.
  { segmento: { in: ['LAUDOS', 'SISTEMA_INCENDIO'] } },
];

const PCI_OR = [
  { status: 'PCI' },
  { segmento: 'SISTEMA_INCENDIO' },
];

const LAUDOS_OR = [
  { status: 'LAUDOS' },
  { segmento: 'LAUDOS' },
];

const withAnd = (where, condition) => ({
  ...where,
  AND: [...(Array.isArray(where.AND) ? where.AND : []), condition],
});

const somenteOperacional = (where = {}) => withAnd(where, {
  NOT: { OR: INVESTMENT_TOWER_OR },
});

const somenteInvestimento = (where = {}) => withAnd(where, {
  OR: INVESTMENT_TOWER_OR,
});

const somentePCI = (where = {}) => withAnd(where, {
  OR: PCI_OR,
});

const somenteLaudos = (where = {}) => withAnd(where, {
  OR: LAUDOS_OR,
});

const valorDecimal = (value) => parseFloat(value || 0);

const STATUS_OPEX_CONTABILIZADOS = ['FINALIZADO', 'AGUARDANDO_OM_ENTREGA'];

/**
 * Retorna a condição Prisma para alocar chamados na competência financeira do período [inicio, fim).
 * Regra de negócio orçamentária:
 * 1. dataResolucao no período (conclusão burocrática)
 * 2. dataResolucao nula e dataAprovacao no período (aprovação/empenho da OM)
 * 3. Sem dataResolucao nem dataAprovacao, mas com dataAbertura no período (legado)
 */
const condicaoCompetenciaMes = (inicio, fim) => ({
  OR: [
    { dataResolucao: { gte: inicio, lt: fim } },
    { dataResolucao: null, dataAprovacao: { gte: inicio, lt: fim } },
    { dataResolucao: null, dataAprovacao: null, dataAbertura: { gte: inicio, lt: fim } },
  ],
});

/**
 * Filtro base para chamados OPEX contabilizados em um período [inicio, fim).
 * - Exclui torres de investimento (PCI e Laudos)
 * - Apenas status que consomem OPEX (FINALIZADO e AGUARDANDO_OM_ENTREGA)
 * - Competência pela dataResolucao / dataAprovacao / dataAbertura
 */
const somenteOpexContabilizado = (where = {}, inicio, fim) => {
  const base = somenteOperacional(where);
  const condicoes = [
    { status: { in: STATUS_OPEX_CONTABILIZADOS } },
  ];
  if (inicio && fim) {
    condicoes.push(condicaoCompetenciaMes(inicio, fim));
  }
  return withAnd(base, { AND: condicoes });
};

module.exports = {
  INVESTMENT_TOWER_OR,
  STATUS_OPEX_CONTABILIZADOS,
  condicaoCompetenciaMes,
  somenteOperacional,
  somenteOpexContabilizado,
  somenteInvestimento,
  somentePCI,
  somenteLaudos,
  valorDecimal,
};

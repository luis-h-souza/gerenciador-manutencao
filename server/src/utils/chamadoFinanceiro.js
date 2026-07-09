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

module.exports = {
  INVESTMENT_TOWER_OR,
  somenteOperacional,
  somenteInvestimento,
  somentePCI,
  somenteLaudos,
  valorDecimal,
};

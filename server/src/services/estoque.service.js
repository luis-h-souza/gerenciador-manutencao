const prisma = require('../utils/prisma');
const { getUserRegions } = require('../utils/access.utils');

const getUnidadesPermitidas = async (user) => {
  if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) return null;
  if (user.role === 'GESTOR') return user.loja?.nome ? [user.loja.nome] : [];

  const regioes = getUserRegions(user);
  if (!regioes.length) return [];

  const lojas = await prisma.loja.findMany({
    where: { ativo: true, regiao: regioes.length === 1 ? regioes[0] : { in: regioes } },
    select: { nome: true },
  });

  return lojas.map((loja) => loja.nome);
};

// ─── Peças ────────────────────────────────────────────────────────────────────
const listarPecas = async () => {
  return prisma.peca.findMany({ orderBy: { nome: 'asc' } });
};

const criarPeca = async (data) => {
  const { nome, descricao } = data;
  return prisma.peca.create({ data: { nome, descricao } });
};

// ─── Entradas ─────────────────────────────────────────────────────────────────
const listarEntradas = async (query) => {
  const { pecaId, page = 1, limit = 20 } = query;
  const where = pecaId ? { pecaId } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [entradas, total] = await Promise.all([
    prisma.entradaPeca.findMany({
      where,
      include: { peca: { select: { id: true, nome: true } } },
      orderBy: { dataEntrada: 'desc' },
      skip, take: parseInt(limit),
    }),
    prisma.entradaPeca.count({ where }),
  ]);
  
  return { data: entradas, meta: { total, page: parseInt(page) } };
};

const registrarEntrada = async (data) => {
  const { pecaId, quantidade, valorUnitario, fornecedor, dataEntrada, numeroNotaFiscal } = data;
  const total = quantidade * parseFloat(valorUnitario);

  const [entrada] = await prisma.$transaction([
    prisma.entradaPeca.create({
      data: {
        pecaId, quantidade: parseInt(quantidade),
        valorUnitario: parseFloat(valorUnitario),
        fornecedor,
        dataEntrada: new Date(dataEntrada),
        numeroNotaFiscal, total,
      },
    }),
    prisma.peca.update({
      where: { id: pecaId },
      data: { quantidadeEstoque: { increment: parseInt(quantidade) } },
    }),
  ]);

  return entrada;
};

// ─── Movimentações ───────────────────────────────────────────────────────────
const listarMovimentacoes = async (user) => {
  const unidadesPermitidas = await getUnidadesPermitidas(user);
  const where = unidadesPermitidas ? { lojaRequisitante: { in: unidadesPermitidas } } : {};

  return prisma.movimentacaoPeca.findMany({
    where,
    include: { peca: { select: { id: true, nome: true } } },
    orderBy: { dataMovimentacao: 'desc' },
    take: 100,
  });
};

const registrarMovimentacao = async (user, data) => {
  const { pecaId, quantidade, lojaRequisitante, numeroChamado, dataMovimentacao } = data;
  const unidadesPermitidas = await getUnidadesPermitidas(user);

  if (unidadesPermitidas && !unidadesPermitidas.includes(lojaRequisitante)) {
    throw new Error('Acesso negado: loja fora da sua abrangência');
  }

  const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
  if (!peca) throw new Error('Peça não encontrada');
  
  if (peca.quantidadeEstoque < parseInt(quantidade)) {
    throw {
      status: 400,
      error: 'Estoque insuficiente',
      disponivel: peca.quantidadeEstoque,
    };
  }

  const [mov] = await prisma.$transaction([
    prisma.movimentacaoPeca.create({
      data: {
        pecaId, quantidade: parseInt(quantidade), lojaRequisitante, numeroChamado,
        dataMovimentacao: new Date(dataMovimentacao || Date.now()),
      },
    }),
    prisma.peca.update({
      where: { id: pecaId },
      data: { quantidadeEstoque: { decrement: parseInt(quantidade) } },
    }),
  ]);

  return mov;
};

// ─── Saídas ───────────────────────────────────────────────────────────────────
const listarSaidas = async () => {
  return prisma.saidaPeca.findMany({
    include: { peca: { select: { id: true, nome: true } } },
    orderBy: { data: 'desc' }, take: 100,
  });
};

const registrarSaida = async (data) => {
  const { pecaId, quantidade, destino, nomeRetirou, empresa, data: dataSaida } = data;
  
  const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
  if (!peca) throw new Error('Peça não encontrada');
  
  if (peca.quantidadeEstoque < parseInt(quantidade)) {
    throw {
      status: 400,
      error: 'Estoque insuficiente',
      disponivel: peca.quantidadeEstoque,
    };
  }

  const [saida] = await prisma.$transaction([
    prisma.saidaPeca.create({
      data: { pecaId, quantidade: parseInt(quantidade), destino, nomeRetirou, empresa, data: new Date(dataSaida || Date.now()) },
    }),
    prisma.peca.update({
      where: { id: pecaId },
      data: { quantidadeEstoque: { decrement: parseInt(quantidade) } },
    }),
  ]);

  return saida;
};

module.exports = {
  listarPecas, criarPeca,
  listarEntradas, registrarEntrada,
  listarMovimentacoes, registrarMovimentacao,
  listarSaidas, registrarSaida,
};

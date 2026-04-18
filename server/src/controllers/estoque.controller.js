// src/controllers/estoque.controller.js
const prisma = require('../utils/prisma');

// ─── Peças ────────────────────────────────────────────────────────────────────
const listarPecas = async (req, res, next) => {
  try {
    const pecas = await prisma.peca.findMany({ orderBy: { nome: 'asc' } });
    res.json(pecas);
  } catch (err) { next(err); }
};

const criarPeca = async (req, res, next) => {
  try {
    const peca = await prisma.peca.create({ data: req.body });
    res.status(201).json(peca);
  } catch (err) { next(err); }
};

// ─── Entradas ─────────────────────────────────────────────────────────────────
const listarEntradas = async (req, res, next) => {
  try {
    const { pecaId, page = 1, limit = 20 } = req.query;
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
    res.json({ data: entradas, meta: { total, page: parseInt(page) } });
  } catch (err) { next(err); }
};

const registrarEntrada = async (req, res, next) => {
  try {
    const { pecaId, quantidade, valorUnitario, fornecedor, dataEntrada, numeroNotaFiscal } = req.body;
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

    res.status(201).json(entrada);
  } catch (err) { next(err); }
};

// ─── Movimentações ───────────────────────────────────────────────────────────
const listarMovimentacoes = async (req, res, next) => {
  try {
    const movimentacoes = await prisma.movimentacaoPeca.findMany({
      include: { peca: { select: { id: true, nome: true } } },
      orderBy: { dataMovimentacao: 'desc' },
      take: 100,
    });
    res.json(movimentacoes);
  } catch (err) { next(err); }
};

const registrarMovimentacao = async (req, res, next) => {
  try {
    const { pecaId, quantidade, lojaRequisitante, numeroChamado, dataMovimentacao } = req.body;

    const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
    if (!peca) return res.status(404).json({ error: 'Peça não encontrada' });
    if (peca.quantidadeEstoque < parseInt(quantidade)) {
      return res.status(400).json({ error: 'Estoque insuficiente', disponivel: peca.quantidadeEstoque });
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

    res.status(201).json(mov);
  } catch (err) { next(err); }
};

// ─── Saídas ───────────────────────────────────────────────────────────────────
const listarSaidas = async (req, res, next) => {
  try {
    const saidas = await prisma.saidaPeca.findMany({
      include: { peca: { select: { id: true, nome: true } } },
      orderBy: { data: 'desc' }, take: 100,
    });
    res.json(saidas);
  } catch (err) { next(err); }
};

const registrarSaida = async (req, res, next) => {
  try {
    const { pecaId, quantidade, destino, nomeRetirou, empresa, data } = req.body;
    
    const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
    if (!peca) return res.status(404).json({ error: 'Peça não encontrada' });
    if (peca.quantidadeEstoque < parseInt(quantidade)) {
      return res.status(400).json({ error: 'Estoque insuficiente', disponivel: peca.quantidadeEstoque });
    }

    const [saida] = await prisma.$transaction([
      prisma.saidaPeca.create({
        data: { pecaId, quantidade: parseInt(quantidade), destino, nomeRetirou, empresa, data: new Date(data || Date.now()) },
      }),
      prisma.peca.update({
        where: { id: pecaId },
        data: { quantidadeEstoque: { decrement: parseInt(quantidade) } },
      }),
    ]);

    res.status(201).json(saida);
  } catch (err) { next(err); }
};

module.exports = {
  listarPecas, criarPeca,
  listarEntradas, registrarEntrada,
  listarMovimentacoes, registrarMovimentacao,
  listarSaidas, registrarSaida,
};

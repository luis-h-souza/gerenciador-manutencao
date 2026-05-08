// src/controllers/estoque.controller.js
const estoqueService = require('../services/estoque.service');

// ─── Peças ────────────────────────────────────────────────────────────────────
const listarPecas = async (req, res, next) => {
  try {
    const pecas = await estoqueService.listarPecas();
    res.json(pecas);
  } catch (err) { next(err); }
};

const criarPeca = async (req, res, next) => {
  try {
    const peca = await estoqueService.criarPeca(req.body);
    res.status(201).json(peca);
  } catch (err) { next(err); }
};

// ─── Entradas ─────────────────────────────────────────────────────────────────
const listarEntradas = async (req, res, next) => {
  try {
    const resultado = await estoqueService.listarEntradas(req.query);
    res.json(resultado);
  } catch (err) { next(err); }
};

const registrarEntrada = async (req, res, next) => {
  try {
    const entrada = await estoqueService.registrarEntrada(req.body);
    res.status(201).json(entrada);
  } catch (err) { next(err); }
};

// ─── Movimentações ───────────────────────────────────────────────────────────
const listarMovimentacoes = async (req, res, next) => {
  try {
    const movimentacoes = await estoqueService.listarMovimentacoes(req.user);
    res.json(movimentacoes);
  } catch (err) { next(err); }
};

const registrarMovimentacao = async (req, res, next) => {
  try {
    const mov = await estoqueService.registrarMovimentacao(req.user, req.body);
    res.status(201).json(mov);
  } catch (err) {
    if (err.message === 'Acesso negado: loja fora da sua abrangência') return res.status(403).json({ error: err.message });
    if (err.message === 'Peça não encontrada') return res.status(404).json({ error: err.message });
    if (err.status) return res.status(err.status).json({ error: err.error, disponivel: err.disponivel });
    next(err);
  }
};

// ─── Saídas ───────────────────────────────────────────────────────────────────
const listarSaidas = async (req, res, next) => {
  try {
    const saidas = await estoqueService.listarSaidas();
    res.json(saidas);
  } catch (err) { next(err); }
};

const registrarSaida = async (req, res, next) => {
  try {
    const saida = await estoqueService.registrarSaida(req.body);
    res.status(201).json(saida);
  } catch (err) {
    if (err.message === 'Peça não encontrada') return res.status(404).json({ error: err.message });
    if (err.status) return res.status(err.status).json({ error: err.error, disponivel: err.disponivel });
    next(err);
  }
};

module.exports = {
  listarPecas, criarPeca,
  listarEntradas, registrarEntrada,
  listarMovimentacoes, registrarMovimentacao,
  listarSaidas, registrarSaida,
};

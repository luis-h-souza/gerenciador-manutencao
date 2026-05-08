const ativoService = require('../services/ativo.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await ativoService.listar(req.user, req.query);
    res.json(resultado);
  } catch (err) {
    if (err.message.includes('Acesso negado')) return res.status(403).json({ error: err.message });
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const ativo = await ativoService.buscarPorId(req.user, req.params.id);
    if (!ativo) return res.status(404).json({ error: 'Ativo não encontrado ou acesso negado' });
    res.json(ativo);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const ativo = await ativoService.criar(req.user, req.body);
    res.status(201).json(ativo);
  } catch (err) {
    if (err.message === 'Usuário sem loja/região definida' || err.message === 'Status inválido') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const ativo = await ativoService.atualizar(req.user, req.params.id, req.body);
    res.json(ativo);
  } catch (err) {
    if (err.message === 'Ativo não encontrado ou acesso negado') return res.status(404).json({ error: err.message });
    if (err.message === 'Status inválido') return res.status(400).json({ error: err.message });
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await ativoService.remover(req.user, req.params.id);
    res.json({ message: 'Ativo inativado' });
  } catch (err) {
    if (err.message === 'Ativo não encontrado ou acesso negado') return res.status(404).json({ error: err.message });
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

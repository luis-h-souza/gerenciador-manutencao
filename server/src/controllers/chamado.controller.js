const chamadoService = require('../services/chamado.service');

const listar = async (req, res, next) => {
  try {
    const data = await chamadoService.listar(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const data = await chamadoService.buscarPorId(req.user, req.params.id);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const data = await chamadoService.criar(req.user, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const data = await chamadoService.atualizar(req.user, req.params.id, req.body);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await chamadoService.remover(req.user, req.params.id);
    res.json({ message: 'Chamado removido' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const resumoMensal = async (req, res, next) => {
  try {
    const data = await chamadoService.resumoMensal(req.user, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, resumoMensal };

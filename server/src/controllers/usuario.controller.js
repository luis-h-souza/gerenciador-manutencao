const usuarioService = require('../services/usuario.service');

const listar = async (req, res, next) => {
  try {
    const data = await usuarioService.listar(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const data = await usuarioService.buscarPorId(req.user, req.params.id);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const data = await usuarioService.criar(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const data = await usuarioService.atualizar(req.user, req.params.id, req.body);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await usuarioService.remover(req.user, req.params.id);
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

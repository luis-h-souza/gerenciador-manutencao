const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
// src/controllers/tarefa.controller.js
const tarefaService = require('../services/tarefa.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await tarefaService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const tarefa = await tarefaService.buscarPorId(req.user, req.params.id);
    resSucesso(res, 'Operação realizada com sucesso', 200, tarefa);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const tarefa = await tarefaService.criar(req.user, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 201, tarefa);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const tarefa = await tarefaService.atualizar(req.user, req.params.id, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 200, tarefa);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await tarefaService.remover(req.user, req.params.id);
    resSucesso(res, 'Tarefa removida com sucesso');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

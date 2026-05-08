const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
// src/controllers/loja.controller.js
const lojaService = require('../services/loja.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await lojaService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) { next(err); }
};

const listarRegioes = async (req, res, next) => {
  try {
    const regioes = await lojaService.listarRegioes(req.user);
    resSucesso(res, 'Operação realizada com sucesso', 200, regioes);
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const loja = await lojaService.buscarPorId(req.user, req.params.id);
    resSucesso(res, 'Operação realizada com sucesso', 200, loja);
  } catch (err) {
    if (err.message === 'Loja não encontrada') return res.status(404).json({ error: err.message });
    if (err.message === 'Acesso negado: loja de outra região') return res.status(403).json({ error: err.message });
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const { loja, isReactivated } = await lojaService.criar(req.user, req.body);
    res.status(isReactivated ? 200 : 201).json(loja);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.error,
        message: err.message,
        field: err.field,
      });
    }
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const loja = await lojaService.atualizar(req.params.id, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 200, loja);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    await lojaService.remover(req.params.id);
    resSucesso(res, 'Loja desativada');
  } catch (err) { next(err); }
};

module.exports = { listar, listarRegioes, buscarPorId, criar, atualizar, remover };

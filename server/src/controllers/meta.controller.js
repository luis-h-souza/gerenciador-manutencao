// src/controllers/meta.controller.js
const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado } = require('../utils/retornoHttp');
const metaService = require('../services/meta.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await metaService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ sucesso: false, mensagem: err.message });
    next(err);
  }
};

const upsert = async (req, res, next) => {
  try {
    const meta = await metaService.upsert(req.user, req.body);
    resSucesso(res, 'Meta orçamentária salva com sucesso', 200, meta);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ sucesso: false, mensagem: err.message });
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await metaService.remover(req.user, req.params.id);
    resSucesso(res, 'Meta orçamentária removida com sucesso');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ sucesso: false, mensagem: err.message });
    next(err);
  }
};

const cards = async (req, res, next) => {
  try {
    const resultado = await metaService.cardsStatus(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ sucesso: false, mensagem: err.message });
    next(err);
  }
};

module.exports = { listar, upsert, remover, cards };

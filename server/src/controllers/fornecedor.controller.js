const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
// src/controllers/fornecedor.controller.js
const fornecedorService = require('../services/fornecedor.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await fornecedorService.listar(req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const f = await fornecedorService.buscarPorId(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    resSucesso(res, 'Operação realizada com sucesso', 200, f);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const f = await fornecedorService.criar(req.body);
    resSucesso(res, 'Operação realizada com sucesso', 201, f);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const f = await fornecedorService.atualizar(req.params.id, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 200, f);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    await fornecedorService.remover(req.params.id);
    resSucesso(res, 'Fornecedor removido');
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

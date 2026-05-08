// src/controllers/fornecedor.controller.js
const fornecedorService = require('../services/fornecedor.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await fornecedorService.listar(req.query);
    res.json(resultado);
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const f = await fornecedorService.buscarPorId(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json(f);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const f = await fornecedorService.criar(req.body);
    res.status(201).json(f);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const f = await fornecedorService.atualizar(req.params.id, req.body);
    res.json(f);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    await fornecedorService.remover(req.params.id);
    res.json({ message: 'Fornecedor removido' });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

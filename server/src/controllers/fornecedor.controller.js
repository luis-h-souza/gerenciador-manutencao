// src/controllers/fornecedor.controller.js
const prisma = require('../utils/prisma');

const listar = async (req, res, next) => {
  try {
    const { nome, segmento, cnpj, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { ativo: true };
    if (nome) where.nome = { contains: nome, mode: 'insensitive' };
    if (segmento) where.segmento = { contains: segmento, mode: 'insensitive' };
    if (cnpj) where.cnpj = { contains: cnpj };

    const [fornecedores, total] = await Promise.all([
      prisma.fornecedor.findMany({ where, orderBy: { nome: 'asc' }, skip, take: parseInt(limit) }),
      prisma.fornecedor.count({ where }),
    ]);
    res.json({ data: fornecedores, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const f = await prisma.fornecedor.findUnique({ where: { id: req.params.id } });
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado' });
    res.json(f);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const f = await prisma.fornecedor.create({ data: req.body });
    res.status(201).json(f);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const f = await prisma.fornecedor.update({ where: { id: req.params.id }, data: req.body });
    res.json(f);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    await prisma.fornecedor.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Fornecedor removido' });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

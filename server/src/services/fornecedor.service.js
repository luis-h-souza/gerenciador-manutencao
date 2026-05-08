const prisma = require('../utils/prisma');

const listar = async (filtros) => {
  const { nome, segmento, cnpj, page = 1, limit = 20 } = filtros;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ativo: true };
  if (nome) where.nome = { contains: nome, mode: 'insensitive' };
  if (segmento) where.segmento = { contains: segmento, mode: 'insensitive' };
  if (cnpj) where.cnpj = { contains: cnpj };

  const [fornecedores, total] = await Promise.all([
    prisma.fornecedor.findMany({ where, orderBy: { nome: 'asc' }, skip, take: parseInt(limit) }),
    prisma.fornecedor.count({ where }),
  ]);
  return { data: fornecedores, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const buscarPorId = async (id) => {
  return prisma.fornecedor.findUnique({ where: { id } });
};

const criar = async (data) => {
  const { nome, telefone, email, segmento, cnpj } = data;
  return prisma.fornecedor.create({ data: { nome, telefone, email, segmento, cnpj } });
};

const atualizar = async (id, data) => {
  const { nome, telefone, email, segmento, cnpj } = data;
  return prisma.fornecedor.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(telefone !== undefined && { telefone }),
      ...(email !== undefined && { email }),
      ...(segmento !== undefined && { segmento }),
      ...(cnpj !== undefined && { cnpj }),
    },
  });
};

const remover = async (id) => {
  return prisma.fornecedor.update({ where: { id }, data: { ativo: false } });
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

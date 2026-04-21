// src/controllers/loja.controller.js
const prisma = require('../utils/prisma');
const { getUserRegions, canAccessRegion } = require('../utils/access.utils');

const listar = async (req, res, next) => {
  try {
    const { nome, numero, regiao, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { ativo: true };
    const regioesPermitidas = getUserRegions(req.user);

    if (nome)   where.nome   = { contains: nome,   mode: 'insensitive' };
    if (numero) where.numero = parseInt(numero);
    if (regiao) where.regiao = regiao;
    if (req.user.role === 'COORDENADOR') {
      if (!regioesPermitidas.length) {
        where.regiao = '__SEM_REGIAO__';
      } else if (regiao && !regioesPermitidas.includes(regiao)) {
        where.regiao = '__SEM_REGIAO__';
      } else if (!regiao) {
        where.regiao = regioesPermitidas.length === 1 ? regioesPermitidas[0] : { in: regioesPermitidas };
      }
    }

    const [lojas, total] = await Promise.all([
      prisma.loja.findMany({ where, orderBy: [{ regiao: 'asc' }, { numero: 'asc' }], skip, take: parseInt(limit) }),
      prisma.loja.count({ where }),
    ]);
    res.json({ data: lojas, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const listarRegioes = async (req, res, next) => {
  try {
    const where = { ativo: true };
    const regioesPermitidas = getUserRegions(req.user);

    if (req.user.role === 'COORDENADOR') {
      where.regiao = regioesPermitidas.length === 1 ? regioesPermitidas[0] : { in: regioesPermitidas };
    }

    const result = await prisma.loja.findMany({
      where,
      select: { regiao: true },
      distinct: ['regiao'],
      orderBy: { regiao: 'asc' },
    });
    res.json(result.map(r => r.regiao));
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });
    if (req.user.role === 'COORDENADOR' && !canAccessRegion(req.user, loja.regiao)) {
      return res.status(403).json({ error: 'Acesso negado: loja de outra região' });
    }
    res.json(loja);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const { numero, nome, regiao, telefone, endereco } = req.body;
    const numeroLoja = parseInt(numero);
    const lojaExistente = await prisma.loja.findUnique({
      where: { numero: numeroLoja },
    });

    if (lojaExistente?.ativo) {
      return res.status(409).json({
        error: 'Conflito',
        message: 'Ja existe uma loja ativa cadastrada com esse numero.',
        field: ['numero'],
      });
    }

    if (lojaExistente && !lojaExistente.ativo) {
      if (req.user?.role !== 'ADMINISTRADOR') {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Somente administrador pode reativar uma loja inativa com esse numero.',
        });
      }

      const lojaReativada = await prisma.loja.update({
        where: { id: lojaExistente.id },
        data: {
          numero: numeroLoja,
          nome,
          regiao,
          telefone,
          endereco,
          ativo: true,
        },
      });

      return res.status(200).json(lojaReativada);
    }

    const loja = await prisma.loja.create({ data: { numero: numeroLoja, nome, regiao, telefone, endereco } });
    res.status(201).json(loja);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { numero, nome, regiao, telefone, endereco, ativo } = req.body;
    const data = {};
    if (numero    !== undefined) data.numero   = parseInt(numero);
    if (nome      !== undefined) data.nome      = nome;
    if (regiao    !== undefined) data.regiao    = regiao;
    if (telefone  !== undefined) data.telefone  = telefone;
    if (endereco  !== undefined) data.endereco  = endereco;
    if (ativo     !== undefined) data.ativo     = ativo;

    const loja = await prisma.loja.update({ where: { id: req.params.id }, data });
    res.json(loja);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    await prisma.loja.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Loja desativada' });
  } catch (err) { next(err); }
};

module.exports = { listar, listarRegioes, buscarPorId, criar, atualizar, remover };

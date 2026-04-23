// src/controllers/usuario.controller.js
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { splitRegions, getUserRegions, canAccessRegion } = require('../utils/access.utils');


const listar = async (req, res, next) => {
  try {
    const { role, ativo, regiao, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    const and = [];
    const regioesSolicitadas = splitRegions(regiao);
    if (role)             where.role  = role;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    if (regioesSolicitadas.length > 0) {
      const regReqContains = regioesSolicitadas.map(r => ({ regiao: { contains: r } }));
      const lojaReqContains = regioesSolicitadas.map(r => ({ loja: { is: { regiao: r } } }));
      and.push({ OR: [ ...regReqContains, ...lojaReqContains ] });
    }

    if (['GERENTE', 'COORDENADOR'].includes(req.user.role)) {
      const regioes = getUserRegions(req.user);
      if (!regioes.length) {
        and.push({ regiao: '__SEM_REGIAO__' });
      } else if (regioesSolicitadas.length && regioesSolicitadas.some((item) => !regioes.includes(item))) {
        and.push({ regiao: '__SEM_REGIAO__' });
      } else {
        const regContains = regioes.map(r => ({ regiao: { contains: r } }));
        const lojaContains = regioes.map(r => ({ loja: { is: { regiao: r } } }));
        and.push({
          OR: [
            ...regContains,
            ...lojaContains,
          ],
        });
      }
    }
    if (req.user.role === 'GESTOR') {
      where.lojaId = req.user.lojaId || '__SEM_LOJA__';
    }
    if (and.length) where.AND = and;

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true, nome: true, email: true, role: true,
          ativo: true, regiao: true, lojaId: true, criadoEm: true,
          loja: { select: { id: true, numero: true, nome: true, regiao: true } },
        },
        orderBy: { nome: 'asc' },
        skip, take: parseInt(limit),
      }),
      prisma.usuario.count({ where }),
    ]);

    res.json({ data: usuarios, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, nome: true, email: true, role: true,
        ativo: true, regiao: true, lojaId: true, criadoEm: true,
        loja: { select: { id: true, numero: true, nome: true, regiao: true } },
      },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (
      ['GERENTE', 'COORDENADOR'].includes(req.user.role) &&
      !canAccessRegion(req.user, usuario.regiao || usuario.loja?.regiao)
    ) {
      return res.status(403).json({ error: 'Acesso negado: usuário de outra região' });
    }
    if (req.user.role === 'GESTOR' && usuario.lojaId !== req.user.lojaId) {
      return res.status(403).json({ error: 'Acesso negado: usuário de outra loja' });
    }

    res.json(usuario);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const { nome, email, senha, role, regiao, lojaId } = req.body;
    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase().trim(),
        senha: senhaHash,
        role: role || 'TECNICO',
        regiao: regiao || null,
        lojaId: lojaId || null,
      },
      select: { id: true, nome: true, email: true, role: true, regiao: true, lojaId: true, criadoEm: true,
        loja: { select: { id: true, numero: true, nome: true, regiao: true } } },
    });

    res.status(201).json(usuario);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, email, senha, role, ativo, regiao, lojaId } = req.body;
    const data = {};
    if (nome   !== undefined) data.nome   = nome;
    if (email  !== undefined) data.email  = email.toLowerCase().trim();
    if (senha)                data.senha  = await bcrypt.hash(senha, 12);
    if (role   !== undefined) data.role   = role;
    if (ativo  !== undefined) data.ativo  = ativo;
    if (regiao !== undefined) data.regiao = regiao || null;
    if (lojaId !== undefined) data.lojaId = lojaId || null;

    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data,
      select: { id: true, nome: true, email: true, role: true, regiao: true, lojaId: true, ativo: true,
        loja: { select: { id: true, numero: true, nome: true, regiao: true } } },
    });
    res.json(usuario);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    // Soft delete
    await prisma.usuario.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

// src/controllers/usuario.controller.js
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');


const listar = async (req, res, next) => {
  try {
    const { role, ativo, regiao, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    if (regiao) where.regiao = regiao;

    // Isolamento regional: Coordenadores e Gestores veem apenas sua região
    if (['COORDENADOR', 'GESTOR'].includes(req.user.role)) {
      where.regiao = req.user.regiao || '__SEM_REGIAO__';
    }

    // Filtro de visibilidade: Admin, Diretor e Gerente veem todos. 
    // Supervisor vê Coordenadores para baixo (opcional, mantendo compatibilidade).
    if (req.user.role === 'SUPERVISOR') {
      where.role = { in: ['COORDENADOR', 'GESTOR', 'TECNICO'] };
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: { id: true, nome: true, email: true, role: true, ativo: true, regiao: true, unidade: true, criadoEm: true },
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
      select: { id: true, nome: true, email: true, role: true, ativo: true, regiao: true, unidade: true, criadoEm: true },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Bloqueia leitura de fora da região para Coordenadores/Gestores
    if (['COORDENADOR', 'GESTOR'].includes(req.user.role) && usuario.regiao !== req.user.regiao) {
      return res.status(403).json({ error: 'Acesso negado: usuário de outra região' });
    }

    res.json(usuario);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const { nome, email, senha, role, regiao, unidade } = req.body;
    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.create({
      data: { 
        nome, 
        email: email.toLowerCase().trim(), 
        senha: senhaHash, 
        role: role || 'TECNICO', 
        regiao: regiao || null,
        unidade: unidade || null
      },
      select: { id: true, nome: true, email: true, role: true, regiao: true, unidade: true, criadoEm: true },
    });

    res.status(201).json(usuario);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, email, senha, role, ativo, regiao, unidade } = req.body;
    const data = {};
    if (nome) data.nome = nome;
    if (email) data.email = email.toLowerCase().trim();
    if (senha) data.senha = await bcrypt.hash(senha, 12);
    if (role) data.role = role;
    if (ativo !== undefined) data.ativo = ativo;
    if (unidade !== undefined) data.unidade = unidade || null;
    if (regiao !== undefined) data.regiao = regiao || null;

    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data,
      select: { id: true, nome: true, email: true, role: true, regiao: true, unidade: true, ativo: true },
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

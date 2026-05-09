const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { splitRegions, getUserRegions, canAccessRegion } = require('../utils/access.utils');
const logService = require('./log.service');

const listar = async (user, query) => {
  const { role, ativo, regiao, page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  const and = [];
  const regioesSolicitadas = splitRegions(regiao);

  if (role) where.role  = role;
  if (ativo !== undefined) where.ativo = ativo === 'true';

  if (regioesSolicitadas.length > 0) {
    const regReqContains = regioesSolicitadas.map(r => ({ regiao: { contains: r } }));
    const lojaReqContains = regioesSolicitadas.map(r => ({ loja: { is: { regiao: r } } }));
    and.push({ OR: [ ...regReqContains, ...lojaReqContains ] });
  }

  if (['GERENTE', 'COORDENADOR'].includes(user.role)) {
    const regioes = getUserRegions(user);
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
  if (user.role === 'GESTOR') {
    where.lojaId = user.lojaId || '__SEM_LOJA__';
  }

  // Nenhuma role (exceto ADMINISTRADOR) pode ver dados de administradores
  if (user.role !== 'ADMINISTRADOR') {
    and.push({ role: { not: 'ADMINISTRADOR' } });
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

  return { data: usuarios, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const buscarPorId = async (user, id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true, nome: true, email: true, role: true,
      ativo: true, regiao: true, lojaId: true, criadoEm: true,
      loja: { select: { id: true, numero: true, nome: true, regiao: true } },
    },
  });
  
  if (!usuario) throw { status: 404, error: 'Usuário não encontrado' };

  if (
    ['GERENTE', 'COORDENADOR'].includes(user.role) &&
    !canAccessRegion(user, usuario.regiao || usuario.loja?.regiao)
  ) {
    throw { status: 403, error: 'Acesso negado: usuário de outra região' };
  }
  if (user.role === 'GESTOR' && usuario.lojaId !== user.lojaId) {
    throw { status: 403, error: 'Acesso negado: usuário de outra loja' };
  }

  // Nenhuma role (exceto ADMINISTRADOR) pode ver dados de administradores
  if (usuario.role === 'ADMINISTRADOR' && user.role !== 'ADMINISTRADOR') {
    throw { status: 403, error: 'Acesso negado: dados restritos' };
  }

  return usuario;
};

const criar = async (user, body) => {
  const { nome, email, senha, role, regiao, lojaId } = body;
  const senhaHash = await bcrypt.hash(senha, 12);

  const novoUsuario = await prisma.usuario.create({
    data: {
      nome,
      email: email.toLowerCase().trim(),
      senha: senhaHash,
      role: role || 'TECNICO',
      regiao: regiao || null,
      lojaId: lojaId || null,
    },
    select: { 
      id: true, nome: true, email: true, role: true, regiao: true, lojaId: true, criadoEm: true,
      loja: { select: { id: true, numero: true, nome: true, regiao: true } } 
    },
  });

  // Auditoria: Registro de Criação de Usuário
  if (user) {
    await logService.registrar({
      usuarioId: user.id,
      acao: 'CRIAR_USUARIO',
      modulo: 'USUARIO',
      detalhes: { novoUsuarioId: novoUsuario.id, email: novoUsuario.email, role: novoUsuario.role }
    });
  }

  return novoUsuario;
};

const atualizar = async (user, id, body) => {
  const existingUser = await prisma.usuario.findUnique({ where: { id } });

  if (!existingUser) throw { status: 404, error: 'Usuário não encontrado' };

  // Nenhuma role (exceto ADMINISTRADOR) pode editar um administrador
  if (existingUser.role === 'ADMINISTRADOR' && user.role !== 'ADMINISTRADOR') {
    throw { status: 403, error: 'Acesso negado: não é possível alterar um administrador' };
  }

  const { nome, email, senha, role, ativo, regiao, lojaId } = body;
  const data = {};
  if (nome   !== undefined) data.nome   = nome;
  if (email  !== undefined) data.email  = email.toLowerCase().trim();
  if (senha)                data.senha  = await bcrypt.hash(senha, 12);
  if (role   !== undefined) data.role   = role;
  if (ativo  !== undefined) data.ativo  = ativo;
  if (regiao !== undefined) data.regiao = regiao || null;
  if (lojaId !== undefined) data.lojaId = lojaId || null;

  const updated = await prisma.usuario.update({
    where: { id },
    data,
    select: { 
      id: true, nome: true, email: true, role: true, regiao: true, lojaId: true, ativo: true,
      loja: { select: { id: true, numero: true, nome: true, regiao: true } } 
    },
  });

  // Auditoria: Registro de Atualização de Usuário
  await logService.registrar({
    usuarioId: user.id,
    acao: 'EDITAR_USUARIO',
    modulo: 'USUARIO',
    detalhes: { usuarioEditadoId: id, camposAlterados: Object.keys(data) }
  });

  return updated;
};

const remover = async (user, id) => {
  const existingUser = await prisma.usuario.findUnique({ where: { id } });

  if (!existingUser) throw { status: 404, error: 'Usuário não encontrado' };

  // Nenhuma role (exceto ADMINISTRADOR) pode remover um administrador
  if (existingUser.role === 'ADMINISTRADOR' && user.role !== 'ADMINISTRADOR') {
    throw { status: 403, error: 'Acesso negado: não é possível remover um administrador' };
  }

  // Soft delete
  await prisma.usuario.update({ where: { id }, data: { ativo: false } });

  // Auditoria: Registro de Remoção (Desativação) de Usuário
  await logService.registrar({
    usuarioId: user.id,
    acao: 'REMOVER_USUARIO',
    modulo: 'USUARIO',
    detalhes: { usuarioRemovidoId: id, email: existingUser.email }
  });
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

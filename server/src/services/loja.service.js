const prisma = require('../utils/prisma');
const { getUserRegions, canAccessRegion } = require('../utils/access.utils');

const listar = async (user, query) => {
  const { nome, numero, regiao, page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ativo: true };
  const regioesPermitidas = getUserRegions(user);

  if (nome)   where.nome   = { contains: nome,   mode: 'insensitive' };
  if (numero) where.numero = parseInt(numero);
  if (regiao) where.regiao = regiao;
  
  if (user.role === 'COORDENADOR') {
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
  
  return { data: lojas, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const listarRegioes = async (user) => {
  const where = { ativo: true };
  const regioesPermitidas = getUserRegions(user);

  if (user.role === 'COORDENADOR') {
    where.regiao = regioesPermitidas.length === 1 ? regioesPermitidas[0] : { in: regioesPermitidas };
  }

  const result = await prisma.loja.findMany({
    where,
    select: { regiao: true },
    distinct: ['regiao'],
    orderBy: { regiao: 'asc' },
  });
  
  return result.map(r => r.regiao);
};

const buscarPorId = async (user, id) => {
  const loja = await prisma.loja.findUnique({ where: { id } });
  if (!loja) throw new Error('Loja não encontrada');

  if (user.role === 'GESTOR') {
    if (!user.lojaId || user.lojaId !== id) {
      throw new Error('Acesso negado: você só pode consultar a sua loja');
    }
    return loja;
  }

  if (user.role === 'COORDENADOR' && !canAccessRegion(user, loja.regiao)) {
    throw new Error('Acesso negado: loja de outra região');
  }

  return loja;
};

const criar = async (user, body) => {
  const { numero, nome, regiao, telefone, endereco } = body;
  const numeroLoja = parseInt(numero);
  const lojaExistente = await prisma.loja.findUnique({
    where: { numero: numeroLoja },
  });

  if (lojaExistente?.ativo) {
    throw {
      status: 409,
      error: 'Conflito',
      message: 'Ja existe uma loja ativa cadastrada com esse numero.',
      field: ['numero'],
    };
  }

  if (lojaExistente && !lojaExistente.ativo) {
    if (user?.role !== 'ADMINISTRADOR') {
      throw {
        status: 403,
        error: 'Acesso negado',
        message: 'Somente administrador pode reativar uma loja inativa com esse numero.',
      };
    }

    const loja = await prisma.loja.update({
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

    return { loja, isReactivated: true };
  }

  const loja = await prisma.loja.create({ data: { numero: numeroLoja, nome, regiao, telefone, endereco } });
  return { loja, isReactivated: false };
};

const atualizar = async (id, body) => {
  const { numero, nome, regiao, telefone, endereco, ativo } = body;
  const data = {};
  if (numero    !== undefined) data.numero   = parseInt(numero);
  if (nome      !== undefined) data.nome      = nome;
  if (regiao    !== undefined) data.regiao    = regiao;
  if (telefone  !== undefined) data.telefone  = telefone;
  if (endereco  !== undefined) data.endereco  = endereco;
  if (ativo     !== undefined) data.ativo     = ativo;

  return prisma.loja.update({ where: { id }, data });
};

/** Gestor: consulta a própria loja vinculada */
const buscarMinhaLoja = async (user) => {
  if (user.role !== 'GESTOR') {
    throw { status: 403, error: 'Acesso negado', message: 'Somente gestores podem usar este recurso' };
  }
  if (!user.lojaId) {
    throw { status: 400, error: 'Sem loja', message: 'Sua conta não está vinculada a uma loja. Contate o administrador.' };
  }

  const loja = await prisma.loja.findUnique({ where: { id: user.lojaId } });
  if (!loja || !loja.ativo) {
    throw { status: 404, error: 'Loja não encontrada', message: 'Loja vinculada não encontrada ou inativa' };
  }

  return loja;
};

/** Gestor: atualiza apenas telefone e endereço da própria loja */
const atualizarMinhaLoja = async (user, body) => {
  if (user.role !== 'GESTOR') {
    throw { status: 403, error: 'Acesso negado', message: 'Somente gestores podem usar este recurso' };
  }
  if (!user.lojaId) {
    throw { status: 400, error: 'Sem loja', message: 'Sua conta não está vinculada a uma loja. Contate o administrador.' };
  }

  const data = {};
  if (body.telefone !== undefined) data.telefone = body.telefone?.trim() || null;
  if (body.endereco !== undefined) data.endereco = body.endereco?.trim() || null;

  if (!Object.keys(data).length) {
    throw { status: 400, error: 'Dados inválidos', message: 'Informe telefone e/ou endereço para atualizar' };
  }

  const loja = await prisma.loja.findUnique({ where: { id: user.lojaId } });
  if (!loja || !loja.ativo) {
    throw { status: 404, error: 'Loja não encontrada', message: 'Loja vinculada não encontrada ou inativa' };
  }

  return prisma.loja.update({ where: { id: user.lojaId }, data });
};

const remover = async (id) => {
  return prisma.loja.update({ where: { id }, data: { ativo: false } });
};

module.exports = { listar, listarRegioes, buscarPorId, buscarMinhaLoja, criar, atualizar, atualizarMinhaLoja, remover };

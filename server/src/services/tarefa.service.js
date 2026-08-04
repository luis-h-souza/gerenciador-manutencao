const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { getAccessFilter, getCreationContext, getUserRegions } = require('../utils/access.utils');

async function validarAtribuicao(fromUser, toUserId) {
  if (!toUserId) return true;
  if (fromUser.role === 'ADMINISTRADOR') return true;

  const toUser = await prisma.usuario.findUnique({ 
    where: { id: toUserId },
    include: { loja: true }
  });
  if (!toUser) throw { status: 403, message: 'Usuário atribuído não encontrado' };

  const fromRegions = getUserRegions(fromUser);
  const toRegions = getUserRegions(toUser);
  const hasRegionOverlap = fromRegions.some(r => toRegions.includes(r));

  if (fromUser.role === 'DIRETOR') {
    if (toUser.role === 'GERENTE') return true;
    throw { status: 403, message: 'Diretores só podem atribuir tarefas para Gerentes' };
  }

  if (fromUser.role === 'GERENTE') {
    if (toUser.role === 'COORDENADOR' && hasRegionOverlap) return true;
    throw { status: 403, message: 'Gerentes só podem atribuir para Coordenadores de sua regional' };
  }

  if (fromUser.role === 'COORDENADOR') {
    if (['GESTOR', 'TECNICO'].includes(toUser.role) && hasRegionOverlap) return true;
    throw { status: 403, message: 'Coordenadores só podem atribuir para Gestores ou Técnicos de sua regional' };
  }

  if (fromUser.role === 'GESTOR') {
    if (toUser.id === fromUser.id) return true;
    // Compara lojaId para maior precisão
    const sameStore = toUser.role === 'TECNICO' && toUser.lojaId === fromUser.lojaId;
    if (sameStore) return true;
    throw { status: 403, message: 'Gestores só podem atribuir para si mesmos ou técnicos de sua unidade' };
  }

  if (fromUser.role === 'OPERACAO') {
    const sameStore = toUser.lojaId === fromUser.lojaId;
    if (sameStore && ['GESTOR', 'TECNICO'].includes(toUser.role)) return true;
    throw { status: 403, message: 'Opera\u00e7\u00e3o s\u00f3 pode atribuir para Gestores ou T\u00e9cnicos de sua unidade' };
  }

  if (fromUser.role === 'TECNICO') {
    if (toUser.id === fromUser.id) return true;
    throw { status: 403, message: 'Técnicos só podem atribuir tarefas para si mesmos' };
  }

  throw { status: 403, message: 'Atribuição inválida' };
}

const listar = async (user, query) => {
  const { status, prioridade, atribuidoParaId, page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = getAccessFilter(user);
  const where = { ...filter };
  
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  
  if (user.role === 'TECNICO') {
    where.atribuidoParaId = user.id;
  } else if (atribuidoParaId) {
    where.atribuidoParaId = atribuidoParaId;
  }

  const [tarefas, total] = await Promise.all([
    prisma.tarefa.findMany({
      where,
      include: {
        criadoPor: { select: { id: true, nome: true, email: true } },
        atribuidoPara: { select: { id: true, nome: true, email: true } },
      },
      orderBy: [{ prioridade: 'desc' }, { criadoEm: 'desc' }],
      skip,
      take: parseInt(limit),
    }),
    prisma.tarefa.count({ where }),
  ]);

  return { data: tarefas, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } };
};

const buscarPorId = async (user, id) => {
  const filter = getAccessFilter(user);
  const where = { id, ...filter };
  
  if (user.role === 'TECNICO') {
    where.atribuidoParaId = user.id;
  }

  const tarefa = await prisma.tarefa.findFirst({
    where,
    include: {
      criadoPor: { select: { id: true, nome: true, email: true } },
      atribuidoPara: { select: { id: true, nome: true, email: true } },
    },
  });

  if (!tarefa) throw { status: 404, message: 'Tarefa não encontrada ou acesso negado' };
  return tarefa;
};

const criar = async (user, body) => {
  const { descricao, prioridade, dataPrevisao, areResponsavel, atribuidoParaId } = body;
  const context = getCreationContext(user);
  
  await validarAtribuicao(user, atribuidoParaId);

  const tarefa = await prisma.tarefa.create({
    data: {
      descricao,
      prioridade: prioridade || 'MEDIA',
      regiao: context.regiao,
      unidade: context.unidade,
      ...(dataPrevisao && { dataPrevisao: new Date(dataPrevisao) }),
      areResponsavel,
      criadoPorId: user.id,
      atribuidoParaId: atribuidoParaId || null,
    },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      atribuidoPara: { select: { id: true, nome: true } },
    },
  });

  if (atribuidoParaId) {
    await prisma.notificacao.create({
      data: {
        titulo: 'Nova tarefa atribuída',
        mensagem: `Você recebeu uma nova tarefa de ${user.nome}: ${descricao.substring(0, 80)}`,
        tarefaId: tarefa.id,
        usuarioId: atribuidoParaId,
      },
    });
  }

  logger.info(`Tarefa criada: ${tarefa.id} por ${user.email} na unidade ${context.unidade}`);
  return tarefa;
};

const atualizar = async (user, id, body) => {
  const { descricao, prioridade, status, dataPrevisao, areResponsavel, atribuidoParaId } = body;

  if (user.role === 'TECNICO') {
    const camposNaoPermitidos = Object.keys(body).filter((campo) => campo !== 'status');
    if (!status || camposNaoPermitidos.length > 0) {
      throw { status: 403, message: 'Técnicos só podem atualizar o status das próprias tarefas' };
    }
  }

  const filter = getAccessFilter(user);
  if (user.role === 'TECNICO') filter.atribuidoParaId = user.id;
  const tarefaExiste = await prisma.tarefa.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!tarefaExiste) throw { status: 404, message: 'Tarefa não encontrada ou acesso negado' };

  if (atribuidoParaId !== undefined && atribuidoParaId !== tarefaExiste.atribuidoParaId) {
    await validarAtribuicao(user, atribuidoParaId);
  }

  if (status && status !== tarefaExiste.status) {
    const role = user.role;
    let podeMudarStatus = false;

    if (['ADMINISTRADOR', 'DIRETOR'].includes(role)) podeMudarStatus = true;
    if (role === 'TECNICO' && tarefaExiste.atribuidoParaId === user.id) podeMudarStatus = true;
    if (['GESTOR', 'OPERACAO'].includes(role)) {
      if (tarefaExiste.atribuidoParaId === user.id) podeMudarStatus = true;
      else {
        const target = await prisma.usuario.findUnique({ where: { id: tarefaExiste.atribuidoParaId } });
        const allowedRoles = role === 'OPERACAO' ? ['GESTOR', 'TECNICO'] : ['TECNICO'];
        if (allowedRoles.includes(target?.role) && target.lojaId === user.lojaId) podeMudarStatus = true;
      }
    }

    if (!podeMudarStatus) {
      throw { status: 403, message: 'Seu cargo não permite alterar o status desta tarefa' };
    }
  }

  const tarefa = await prisma.tarefa.update({
    where: { id },
    data: {
      ...(descricao && { descricao }),
      ...(prioridade && { prioridade }),
      ...(status && { status }),
      ...(dataPrevisao !== undefined && { dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null }),
      ...(status === 'CONCLUIDA' && tarefaExiste.status !== 'CONCLUIDA' && { dataConclusao: new Date() }),
      ...(status && status !== 'CONCLUIDA' && tarefaExiste.status === 'CONCLUIDA' && { dataConclusao: null }),
      ...(areResponsavel && { areResponsavel }),
      ...(atribuidoParaId !== undefined && { atribuidoParaId }),
    },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      atribuidoPara: { select: { id: true, nome: true } },
    },
  });

  if (atribuidoParaId && atribuidoParaId !== tarefaExiste.atribuidoParaId) {
    await prisma.notificacao.create({
      data: {
        titulo: 'Tarefa atribuída a você',
        mensagem: `Você foi designado como responsável pela tarefa: ${tarefa.descricao.substring(0, 60)}`,
        tarefaId: tarefa.id,
        usuarioId: atribuidoParaId,
      },
    });
  }

  if (status && status !== tarefaExiste.status) {
    const destinatario = tarefaExiste.atribuidoParaId || tarefaExiste.criadoPorId;
    if (destinatario !== user.id) {
      await prisma.notificacao.create({
        data: {
          titulo: 'Status atualizado',
          mensagem: `A tarefa "${tarefa.descricao.substring(0, 40)}..." foi para: ${status}`,
          tarefaId: tarefa.id,
          usuarioId: destinatario,
        },
      });
    }
  }

  return tarefa;
};

const remover = async (user, id) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.tarefa.findFirst({ where: { id, ...filter } });
  if (!existe) throw { status: 404, message: 'Tarefa não encontrada ou acesso negado' };

  await prisma.tarefa.delete({ where: { id } });
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

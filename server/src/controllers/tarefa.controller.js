const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { getAccessFilter, getCreationContext, getUserRegions } = require('../utils/access.utils');

/**
 * Valida se o usuário de origem pode atribuir uma tarefa ao usuário de destino
 */
async function validarAtribuicao(fromUser, toUserId) {
  if (!toUserId) return true;
  if (fromUser.role === 'ADMINISTRADOR') return true;

  const toUser = await prisma.usuario.findUnique({ 
    where: { id: toUserId },
    include: { loja: true }
  });
  if (!toUser) throw new Error('Usuário atribuído não encontrado');

  const fromRegions = getUserRegions(fromUser);
  const toRegions = getUserRegions(toUser);
  const hasRegionOverlap = fromRegions.some(r => toRegions.includes(r));

  if (fromUser.role === 'DIRETOR') {
    if (toUser.role === 'GERENTE') return true;
    throw new Error('Diretores só podem atribuir tarefas para Gerentes');
  }

  if (fromUser.role === 'GERENTE') {
    if (toUser.role === 'COORDENADOR' && hasRegionOverlap) return true;
    throw new Error('Gerentes só podem atribuir para Coordenadores de sua regional');
  }

  if (fromUser.role === 'COORDENADOR') {
    if (['GESTOR', 'TECNICO'].includes(toUser.role) && hasRegionOverlap) return true;
    throw new Error('Coordenadores só podem atribuir para Gestores ou Técnicos de sua regional');
  }

  if (fromUser.role === 'GESTOR') {
    if (toUser.id === fromUser.id) return true;
    const sameUnit = toUser.role === 'TECNICO' && toUser.unidade === fromUser.unidade;
    if (sameUnit) return true;
    throw new Error('Gestores só podem atribuir para si mesmos ou técnicos de sua unidade');
  }

  if (fromUser.role === 'TECNICO') {
    if (toUser.id === fromUser.id) return true;
    throw new Error('Técnicos só podem atribuir tarefas para si mesmos');
  }

  return false;
}

const listar = async (req, res, next) => {
  try {
    const { status, prioridade, atribuidoParaId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filtro base do usuário (Regional ou Unidade)
    const filter = getAccessFilter(req.user);
    const where = { ...filter };
    
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    
    // Regra específica para Técnicos: se for técnico, vê apenas as atribuídas a ele por padrão,
    // a menos que queira ver tudo da sua regional (conforme permitido pelo getAccessFilter).
    if (req.user.role === 'TECNICO') {
      where.atribuidoParaId = req.user.id;
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

    res.json({
      data: tarefas,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const filter = getAccessFilter(req.user);
    const where = { id: req.params.id, ...filter };
    
    // Técnicos só acessam as suas
    if (req.user.role === 'TECNICO') {
      where.atribuidoParaId = req.user.id;
    }

    const tarefa = await prisma.tarefa.findFirst({
      where,
      include: {
        criadoPor: { select: { id: true, nome: true, email: true } },
        atribuidoPara: { select: { id: true, nome: true, email: true } },
      },
    });

    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    res.json(tarefa);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const { descricao, prioridade, dataConclusao, areResponsavel, atribuidoParaId } = req.body;
    // Validar hierarquia de atribuição
    try {
      await validarAtribuicao(req.user, atribuidoParaId);
    } catch (err) {
      return res.status(403).json({ error: err.message });
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        descricao,
        prioridade: prioridade || 'MEDIA',
        regiao: context.regiao,
        unidade: context.unidade,
        dataConclusao: dataConclusao ? new Date(dataConclusao) : null,
        areResponsavel,
        criadoPorId: req.user.id,
        atribuidoParaId: atribuidoParaId || null,
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        atribuidoPara: { select: { id: true, nome: true } },
      },
    });

    // Notificar se atribuído
    if (atribuidoParaId) {
      await prisma.notificacao.create({
        data: {
          titulo: 'Nova tarefa atribuída',
          mensagem: `Você recebeu uma nova tarefa de ${req.user.nome}: ${descricao.substring(0, 80)}`,
          tarefaId: tarefa.id,
          usuarioId: atribuidoParaId,
        },
      });
    }

    logger.info(`Tarefa criada: ${tarefa.id} por ${req.user.email} na unidade ${context.unidade}`);
    res.status(201).json(tarefa);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const { descricao, prioridade, status, dataConclusao, areResponsavel, atribuidoParaId } = req.body;

    // 1. Validar se usuário tem acesso à tarefa
    const filter = getAccessFilter(req.user);
    const tarefaExiste = await prisma.tarefa.findFirst({ 
      where: { id: req.params.id, ...filter } 
    });
    
    if (!tarefaExiste) return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });

    // 2. Validar atribuição se estiver mudando o responsável
    if (atribuidoParaId !== undefined && atribuidoParaId !== tarefaExiste.atribuidoParaId) {
      try {
        await validarAtribuicao(req.user, atribuidoParaId);
      } catch (err) {
        return res.status(403).json({ error: err.message });
      }
    }

    // 3. Validar mudança de status
    if (status && status !== tarefaExiste.status) {
      const role = req.user.role;
      let podeMudarStatus = false;

      if (['ADMINISTRADOR', 'DIRETOR'].includes(role)) podeMudarStatus = true;
      if (role === 'TECNICO' && tarefaExiste.atribuidoParaId === req.user.id) podeMudarStatus = true;
      if (role === 'GESTOR') {
        // Gestor muda o dele ou dos seus técnicos
        if (tarefaExiste.atribuidoParaId === req.user.id) podeMudarStatus = true;
        else {
          const target = await prisma.usuario.findUnique({ where: { id: tarefaExiste.atribuidoParaId } });
          if (target?.role === 'TECNICO' && target.unidade === req.user.unidade) podeMudarStatus = true;
        }
      }

      if (!podeMudarStatus) {
        return res.status(403).json({ error: 'Seu cargo não permite alterar o status desta tarefa' });
      }
    }

    const tarefa = await prisma.tarefa.update({
      where: { id: req.params.id },
      data: {
        ...(descricao && { descricao }),
        ...(prioridade && { prioridade }),
        ...(status && { status }),
        ...(dataConclusao !== undefined && { dataConclusao: dataConclusao ? new Date(dataConclusao) : null }),
        ...(areResponsavel && { areResponsavel }),
        ...(atribuidoParaId !== undefined && { atribuidoParaId }),
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        atribuidoPara: { select: { id: true, nome: true } },
      },
    });

    // 4. Notificações
    // Notificar novo atribuído
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

    // Notificar mudança de status
    if (status && status !== tarefaExiste.status) {
      const destinatario = tarefaExiste.atribuidoParaId || tarefaExiste.criadoPorId;
      if (destinatario !== req.user.id) {
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

    res.json(tarefa);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    const filter = getAccessFilter(req.user);
    const existe = await prisma.tarefa.findFirst({ where: { id: req.params.id, ...filter } });
    if (!existe) return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });

    await prisma.tarefa.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

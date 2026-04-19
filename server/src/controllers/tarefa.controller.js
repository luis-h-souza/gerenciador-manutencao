const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { getAccessFilter, getCreationContext } = require('../utils/access.utils');

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
    const context = getCreationContext(req.user);

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
          mensagem: `Você recebeu uma nova tarefa: ${descricao.substring(0, 80)}`,
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

    // Verificar se usuário tem acesso a esta tarefa
    const filter = getAccessFilter(req.user);
    const tarefaExiste = await prisma.tarefa.findFirst({ 
      where: { id: req.params.id, ...filter } 
    });
    
    if (!tarefaExiste) return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });

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

    if (status && status !== tarefaExiste.status) {
      const destinatario = tarefaExiste.atribuidoParaId || tarefaExiste.criadoPorId;
      await prisma.notificacao.create({
        data: {
          titulo: 'Status da tarefa atualizado',
          mensagem: `Tarefa "${tarefa.descricao.substring(0, 60)}" — novo status: ${status}`,
          tarefaId: tarefa.id,
          usuarioId: destinatario,
        },
      });
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

const prisma = require('../utils/prisma');
const { getAccessFilter, getCreationContext } = require('../utils/access.utils');
const logService = require('./log.service');
const { invalidateDashboardCache } = require('../utils/dashboard.cache');

const CAMPOS_CHAMADO = [
  'dataAbertura',
  'numeroChamado',
  'segmento',
  'empresa',
  'descricao',
  'regiao',
  'unidade',
  'numeroOrcamento',
  'solicitacao',
  'dataAprovacao',
  'numeroOM',
  'valor',
  'status',
  'mauUso',
  'ativoId',
  'dataResolucao',
];

const normalizarTextoEnum = (valor) => String(valor)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ç/gi, 'c')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/^_+|_+$/g, '')
  .toUpperCase();

const normalizarSegmento = (valor) => {
  if (!valor) return valor;

  const normalizado = normalizarTextoEnum(valor);
  const aliases = {
    AR_CONDICIONADO: 'AR_CONDICIONADO',
    ARCONDICIONADO: 'AR_CONDICIONADO',
    REFRIGERACAO_PCS: 'REFRIGERACAO_PECAS',
    REFRIGERACAO_PCAS: 'REFRIGERACAO_PECAS',
    REFRIGERACAO_PECAS: 'REFRIGERACAO_PECAS',
    ELEVADOR: 'ELEVADORES',
    PCI: 'SISTEMA_INCENDIO',
    ALUGUEL: 'LOCACAO',
    DIVERSOS: 'OUTROS',
    SERVICOS_GERAIS: 'OUTROS',
    EQUIPAMENTOS: 'OUTROS',
  };

  return aliases[normalizado] || normalizado;
};

const normalizarDataOpcional = (valor) => {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  return normalizarData(valor);
};

const normalizarData = (valor) => {
  if (typeof valor === 'string') {
    const matchDataFormulario = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchDataFormulario) {
      const [, ano, mes, dia] = matchDataFormulario;
      return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia), 12));
    }
  }

  return new Date(valor);
};

const montarDadosChamado = (body) => {
  const data = {};

  for (const campo of CAMPOS_CHAMADO) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  if (data.segmento !== undefined) data.segmento = normalizarSegmento(data.segmento);
  if (data.dataAbertura !== undefined) data.dataAbertura = normalizarData(data.dataAbertura);
  if (data.dataAprovacao !== undefined) data.dataAprovacao = normalizarDataOpcional(data.dataAprovacao);
  if (data.dataResolucao !== undefined) data.dataResolucao = normalizarDataOpcional(data.dataResolucao);
  if (data.valor !== undefined) data.valor = data.valor === null || data.valor === '' ? null : parseFloat(data.valor);
  if (data.solicitacao !== undefined) data.solicitacao = data.solicitacao || null;
  if (data.numeroOM !== undefined) data.numeroOM = data.numeroOM || null;
  if (data.numeroOrcamento !== undefined) data.numeroOrcamento = data.numeroOrcamento || null;
  if (data.ativoId !== undefined) data.ativoId = data.ativoId || null;

  return data;
};

const listar = async (user, query) => {
  const { status, segmento, empresa, mes, ano, page = 1, limit = 20, regiao, unidade, busca } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const filter = getAccessFilter(user);
  const where = { ...filter };

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    const { splitRegions, expandRegionScopes } = require('../utils/access.utils');
    const requestedRegions = expandRegionScopes(splitRegions(regiao));
    
    if (['GERENTE', 'COORDENADOR'].includes(user.role)) {
      const userRegions = require('../utils/access.utils').getUserRegions(user);
      const hasAccess = requestedRegions.every(r => userRegions.includes(r));
      if (!hasAccess) {
        throw { status: 403, error: 'Acesso negado: uma ou mais regiões fora da sua abrangência' };
      }
    }
    
    where.regiao = requestedRegions.length > 1 ? { in: requestedRegions } : requestedRegions[0] || regiao;
  }

  if (unidade) {
    where.unidade = unidade;
  }
  
  if (status) where.status = status;
  if (segmento) where.segmento = segmento;
  if (empresa) where.empresa = { contains: empresa, mode: 'insensitive' };
  if (busca) {
    where.OR = [
      { empresa: { contains: busca, mode: 'insensitive' } },
      { numeroChamado: { contains: busca, mode: 'insensitive' } },
    ];
  }
  
  /**
   * ── Lógica de período financeiro com carry-over ───────────────────────────
   * • Chamados FINALIZADO: competência pela dataResolucao (ou dataAprovacao como fallback).
   * • Chamados AGUARDANDO_OM_ENTREGA: competência pela dataAprovacao (mês da aprovação/empenho).
   *   Se não tiver dataAprovacao nem dataResolucao, acompanha o mês consultado (carry-over),
   *   nunca retrocedendo para a data de abertura do passado.
   * • Chamados AGUARDANDO_APROVACAO: carry-over automático (permanecem no mês atual
   *   enquanto não forem aprovados/resolvidos).
   * • Demais status (ALUGUEL_OUTROS, PCI, LAUDOS): dataResolucao ou dataAbertura.
   * ──────────────────────────────────────────────────────────────────────────
   */
  if (mes && ano) {
    const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const dataFim    = new Date(parseInt(ano), parseInt(mes), 1);

    // 1. Finalizados: competência pela dataResolucao (ou dataAprovacao como fallback)
    const filtroFinalizados = {
      status: 'FINALIZADO',
      OR: [
        { dataResolucao: { gte: dataInicio, lt: dataFim } },
        { dataResolucao: null, dataAprovacao: { gte: dataInicio, lt: dataFim } },
        { dataResolucao: null, dataAprovacao: null, dataAbertura: { gte: dataInicio, lt: dataFim } },
      ],
    };

    // 2. Aguardando OM / Entrega: competência pela dataAprovacao (ou dataResolucao)
    const filtroAguardandoOM = {
      status: 'AGUARDANDO_OM_ENTREGA',
      OR: [
        { dataAprovacao: { gte: dataInicio, lt: dataFim } },
        { dataResolucao: { gte: dataInicio, lt: dataFim } },
        // Fallback carry-over: aberto até o fim do mês e sem datas definidas em outro período
        {
          dataAprovacao: null,
          dataResolucao: null,
          dataAbertura: { lt: dataFim },
        },
      ],
    };

    // 3. Demais categorias (ALUGUEL_OUTROS, PCI, LAUDOS)
    const filtroOutrosResolvidos = {
      status: { in: ['ALUGUEL_OUTROS', 'PCI', 'LAUDOS'] },
      OR: [
        { dataResolucao: { gte: dataInicio, lt: dataFim } },
        { dataResolucao: null, dataAbertura: { gte: dataInicio, lt: dataFim } },
      ],
    };

    // 4. Aguardando Aprovação: carry-over — aberto até o fim do mês e ainda não aprovado/resolvido
    const filtroAguardandoAprovacao = {
      status: 'AGUARDANDO_APROVACAO',
      dataAbertura: { lt: dataFim },
      OR: [
        { dataAprovacao: null, dataResolucao: null },
        { dataAprovacao: { gte: dataFim } },
        { dataResolucao: { gte: dataFim } },
      ],
    };

    if (status) {
      if (status === 'AGUARDANDO_APROVACAO') {
        where.AND = [...(where.AND || []), filtroAguardandoAprovacao];
      } else if (status === 'AGUARDANDO_OM_ENTREGA') {
        where.AND = [...(where.AND || []), filtroAguardandoOM];
      } else if (status === 'FINALIZADO') {
        where.AND = [...(where.AND || []), filtroFinalizados];
      } else {
        where.AND = [...(where.AND || []), filtroOutrosResolvidos];
      }
      delete where.status;
      where.status = status;
    } else {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            filtroFinalizados,
            filtroAguardandoOM,
            filtroAguardandoAprovacao,
            filtroOutrosResolvidos,
          ],
        },
      ];
    }
  }

  const [chamados, total] = await Promise.all([
    prisma.controleChamado.findMany({
      where, orderBy: { dataAbertura: 'desc' }, skip, take: parseInt(limit),
    }),
    prisma.controleChamado.count({ where }),
  ]);

  return { data: chamados, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } };
};

const buscarPorId = async (user, id) => {
  const filter = getAccessFilter(user);
  const chamado = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!chamado) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };
  return chamado;
};

const criar = async (user, body) => {
  const context = getCreationContext(user);
  const data = montarDadosChamado(body);

  // ── Auto-preenche datas de competência financeira se não informadas
  if (data.status === 'AGUARDANDO_OM_ENTREGA' && !data.dataAprovacao) {
    data.dataAprovacao = new Date();
  }
  if (data.status === 'FINALIZADO') {
    if (!data.dataResolucao) data.dataResolucao = new Date();
    if (!data.dataAprovacao) data.dataAprovacao = data.dataResolucao || new Date();
  }

  const novoChamado = await prisma.controleChamado.create({
    data: {
      ...data,
      regiao: context.regiao,
      unidade: context.unidade,
    },
  });

  // Auditoria: Registro de Criação de Chamado
  await logService.registrar({
    usuarioId: user.id,
    acao: 'CRIAR_CHAMADO',
    modulo: 'CHAMADO',
    detalhes: { chamadoId: novoChamado.id, numero: novoChamado.numeroChamado, valor: novoChamado.valor }
  });

  // Invalida cache do dashboard para atualização imediata
  await invalidateDashboardCache().catch(() => {});

  return novoChamado;
};

const atualizar = async (user, id, body) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!existe) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };

  const data = montarDadosChamado(body);

  // ── Regra de negócio: ao mudar para AGUARDANDO_OM_ENTREGA, preenche dataAprovacao automaticamente se vazia
  if (data.status === 'AGUARDANDO_OM_ENTREGA' && !data.dataAprovacao && !existe.dataAprovacao) {
    data.dataAprovacao = new Date();
  }

  // ── Regra de negócio: ao mudar para FINALIZADO, preenche dataResolucao e dataAprovacao se vazias
  if (data.status === 'FINALIZADO') {
    if (!data.dataResolucao && !existe.dataResolucao) {
      data.dataResolucao = new Date();
    }
    if (!data.dataAprovacao && !existe.dataAprovacao) {
      data.dataAprovacao = data.dataResolucao || new Date();
    }
  }

  const updated = await prisma.controleChamado.update({ where: { id }, data });

  // Auditoria: Registro de Atualização de Chamado
  await logService.registrar({
    usuarioId: user.id,
    acao: 'EDITAR_CHAMADO',
    modulo: 'CHAMADO',
    detalhes: { chamadoId: id, camposAlterados: Object.keys(data) }
  });

  // Invalida cache do dashboard para atualização imediata
  await invalidateDashboardCache().catch(() => {});

  return updated;
};

const remover = async (user, id) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!existe) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };

  await prisma.controleChamado.delete({ where: { id } });

  // Auditoria: Registro de Remoção de Chamado
  await logService.registrar({
    usuarioId: user.id,
    acao: 'REMOVER_CHAMADO',
    modulo: 'CHAMADO',
    detalhes: { chamadoId: id, numero: existe.numeroChamado }
  });

  // Invalida cache do dashboard para atualização imediata
  await invalidateDashboardCache().catch(() => {});
};

const resumoMensal = async (user, query) => {
  const { mes, ano } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();
  
  const dataInicio = new Date(anoNum, mesNum - 1, 1);
  const dataFim    = new Date(anoNum, mesNum, 1);

  const filter = getAccessFilter(user);

  /**
   * Para o resumo, só somamos chamados FINALIZADO ou AGUARDANDO_OM_ENTREGA
   * que competem financeiramente a este mês:
   * 1. Tem dataResolucao no mês
   * 2. Tem dataAprovacao no mês (sem dataResolucao)
   * 3. Sem datas definidas, aberto no mês
   */
  const whereContabilizados = {
    ...filter,
    status: { in: ['FINALIZADO', 'AGUARDANDO_OM_ENTREGA'] },
    OR: [
      { dataResolucao: { gte: dataInicio, lt: dataFim } },
      { dataResolucao: null, dataAprovacao: { gte: dataInicio, lt: dataFim } },
      { dataResolucao: null, dataAprovacao: null, dataAbertura: { gte: dataInicio, lt: dataFim } },
    ],
  };

  // Para contagem de status, mantemos o filtro por dataAbertura original
  const whereGeral = { ...filter, dataAbertura: { gte: dataInicio, lt: dataFim } };

  const [chamados, totaisPorSegmento, totaisPorStatus] = await Promise.all([
    prisma.controleChamado.aggregate({
      where: whereContabilizados,
      _sum: { valor: true },
      _count: true,
    }),
    prisma.controleChamado.groupBy({
      by: ['segmento'],
      where: whereContabilizados,
      _sum: { valor: true },
      _count: true,
    }),
    prisma.controleChamado.groupBy({
      by: ['status'],
      where: whereGeral,
      _count: true,
    }),
  ]);

  return {
    periodo: { mes: mesNum, ano: anoNum },
    total: { valor: chamados._sum.valor || 0, quantidade: chamados._count },
    porSegmento: totaisPorSegmento,
    porStatus: totaisPorStatus,
  };
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, resumoMensal };

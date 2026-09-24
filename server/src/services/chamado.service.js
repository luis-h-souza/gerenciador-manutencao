const prisma = require('../utils/prisma');
const { getAccessFilter, getCreationContext } = require('../utils/access.utils');
const logService = require('./log.service');

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
   * ── Lógica de período com carry-over ──────────────────────────────────────
   * • Chamados FINALIZADO ou AGUARDANDO_OM_ENTREGA são contabilizados pelo mês
   *   em que foram resolvidos (dataResolucao), ou pela dataAbertura se ainda
   *   não houver dataResolucao.
   * • Chamados AGUARDANDO_APROVACAO são considerados no mês atual enquanto não
   *   forem resolvidos (carry-over automático).
   * ──────────────────────────────────────────────────────────────────────────
   */
  if (mes && ano) {
    const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const dataFim    = new Date(parseInt(ano), parseInt(mes), 1);

    // Status resolvidos: usa dataResolucao (ou dataAbertura como fallback)
    const resolvidos = ['FINALIZADO', 'AGUARDANDO_OM_ENTREGA', 'ALUGUEL_OUTROS', 'PCI', 'LAUDOS'];

    const filtroResolvidos = {
      status: { in: resolvidos },
      OR: [
        // Tem dataResolucao no período
        { dataResolucao: { gte: dataInicio, lt: dataFim } },
        // Não tem dataResolucao mas foi aberto no período
        { dataResolucao: null, dataAbertura: { gte: dataInicio, lt: dataFim } },
      ],
    };

    // Ag. Aprovação: carry-over — aparece no mês consultado se ainda não foi
    // resolvido até o fim desse mês (aberto antes ou durante)
    const filtroAguardando = {
      status: 'AGUARDANDO_APROVACAO',
      dataAbertura: { lt: dataFim }, // aberto antes do fim do mês
      OR: [
        { dataResolucao: null },                   // não resolvido
        { dataResolucao: { gte: dataFim } },       // resolvido depois do período
      ],
    };

    // Se um filtro de status específico foi aplicado, respeitamos ele
    if (status) {
      if (status === 'AGUARDANDO_APROVACAO') {
        where.AND = [...(where.AND || []), filtroAguardando];
        delete where.status;
      } else {
        where.AND = [...(where.AND || []), filtroResolvidos];
        delete where.status;
        where.status = status;
      }
    } else {
      where.AND = [...(where.AND || []), { OR: [filtroResolvidos, filtroAguardando] }];
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
  const novoChamado = await prisma.controleChamado.create({
    data: {
      ...montarDadosChamado(body),
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

  return novoChamado;
};

const atualizar = async (user, id, body) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!existe) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };

  const data = montarDadosChamado(body);

  // ── Regra de negócio: ao mudar para FINALIZADO, preenche dataResolucao automaticamente
  if (data.status === 'FINALIZADO' && !data.dataResolucao && !existe.dataResolucao) {
    data.dataResolucao = new Date();
  }

  const updated = await prisma.controleChamado.update({ where: { id }, data });

  // Auditoria: Registro de Atualização de Chamado
  await logService.registrar({
    usuarioId: user.id,
    acao: 'EDITAR_CHAMADO',
    modulo: 'CHAMADO',
    detalhes: { chamadoId: id, camposAlterados: Object.keys(data) }
  });

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
   * que foram resolvidos neste mês (pela dataResolucao), garantindo que
   * chamados Ag. Aprovação não inflem o total do mês.
   */
  const whereContabilizados = {
    ...filter,
    status: { in: ['FINALIZADO', 'AGUARDANDO_OM_ENTREGA'] },
    OR: [
      { dataResolucao: { gte: dataInicio, lt: dataFim } },
      { dataResolucao: null, dataAbertura: { gte: dataInicio, lt: dataFim } },
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

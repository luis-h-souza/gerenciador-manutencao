const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions, canAccessRegion } = require('../utils/access.utils');
const { calcularMetricasConfiabilidade } = require('../utils/confiabilidadeAtivo');
const { getWeek, startOfMonth, endOfMonth } = require('date-fns');
const { buildKey, withCache, TTL } = require('../utils/dashboard.cache');
const { buscarMetaVigente } = require('./meta.service');

const formatarSegmento = (segmento) => {
  if (!segmento) return 'Diversos';
  const conversoes = {
    'AR_CONDICIONADO': 'AR-CONDICIONADO',
    'REFRIGERACAO_PCS': 'REFRIGERACAO-PÇS',
    'SERVICOS_GERAIS': 'SERVIÇOS GERAIS',
    'REFRIGERACAO': 'Refrigeração',
    'EMPILHADEIRA': 'Empilhadeira',
    'CIVIL': 'Civil'
  };
  return conversoes[segmento] || segmento;
};

const agruparSegmentoPareto = (segmento) => {
  const segmentoNormalizado = (segmento || '').trim() || 'Diversos';
  const grupos = {
    AR_CONDICIONADO: 'REFRIGERACAO',
    REFRIGERACAO: 'REFRIGERACAO',
    REFRIGERACAO_PECAS: 'REFRIGERACAO',
    REFRIGERACAO_PCS: 'REFRIGERACAO',
    TRANSPALETEIRA: 'EMPILHADEIRA',
    EMPILHADEIRA: 'EMPILHADEIRA',
    HIDRAULICA: 'CIVIL',
    PINTURA: 'CIVIL',
    LIMPEZA_ESGOTO: 'CIVIL',
    TELHADO: 'CIVIL',
    CIVIL: 'CIVIL',
    LAUDOS: 'OPEX_MANUTENCAO',
    SISTEMA_INCENDIO: 'OPEX_MANUTENCAO',
  };
  return grupos[segmentoNormalizado] || segmentoNormalizado;
};

const isOpexChamado = (segmento) =>
  ['LAUDOS', 'SISTEMA_INCENDIO'].includes((segmento || '').trim());

const OPEX_SEGMENTO_LABEL = 'OPEX Manutenção';

// Investment tower statuses
const isInvestmentTowerStatus = (status) =>
  ['PCI', 'LAUDOS'].includes((status || '').trim());

const investmentTowerLabel = (status) => {
  const labels = {
    'PCI': 'Investimento - Sistema de Incêndio',
    'LAUDOS': 'Investimento - Laudos'
  };
  return labels[status] || status;
};

const hasRegionOverlap = (sourceRegions, targetRegions) => {
  if (!sourceRegions?.length || !targetRegions?.length) return false;
  return targetRegions.some((region) => sourceRegions.includes(region));
};

const resumo = async (user, query) => {
  const { mes, ano, regiao, unidade } = query;
  const agora = new Date();

  const mesIdx = mes ? parseInt(mes) - 1 : agora.getMonth();
  const anoNum = ano ? parseInt(ano) : agora.getFullYear();

  const cacheKey = buildKey('resumo', user, { mes: mesIdx + 1, ano: anoNum, regiao, unidade });
  return withCache(cacheKey, TTL.resumo, async () => {
    const inicioMes = new Date(anoNum, mesIdx, 1);
    const fimMes    = new Date(anoNum, mesIdx + 1, 1);
    const inicioMesPassado = new Date(anoNum, mesIdx - 1, 1);
    const fimMesPassado = new Date(anoNum, mesIdx, 0);

    const filter = getAccessFilter(user);
    const where = { ...filter };

    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
      if (regiao) {
        if (!canAccessRegion(user, regiao)) {
          throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
        }
        where.regiao = regiao;
      }
      if (unidade) where.unidade = unidade;
    }

    const [
      totalTarefas, tarefasPendentes, tarefasEmAndamento, tarefasConcluidas,
      totalChamadosMes, gastosMes, gastosMesPassado,
      chamadosMauUso, totalFornecedores,
      pecasBaixoEstoque,
    ] = await Promise.all([
      prisma.tarefa.count({ where }),
      prisma.tarefa.count({ where: { ...where, status: 'PENDENTE' } }),
      prisma.tarefa.count({ where: { ...where, status: 'EM_ANDAMENTO' } }),
      prisma.tarefa.count({ where: { ...where, status: 'CONCLUIDA' } }),
      prisma.controleChamado.count({ where: { ...where, dataAbertura: { gte: inicioMes, lt: fimMes } } }),
      prisma.controleChamado.aggregate({
        where: { ...where, dataAbertura: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
      }),
      prisma.controleChamado.aggregate({
        where: { ...where, dataAbertura: { gte: inicioMesPassado, lte: fimMesPassado } },
        _sum: { valor: true },
      }),
      prisma.controleChamado.count({ where: { ...where, mauUso: true, dataAbertura: { gte: inicioMes, lt: fimMes } } }),
      prisma.fornecedor.count({ where: { ativo: true } }),
      user.role === 'GESTOR'
        ? prisma.peca.findMany({
            where: { quantidadeEstoque: { lte: 5 } },
            select: { id: true, nome: true, quantidadeEstoque: true },
          })
        : Promise.resolve([]),
    ]);

    const gastoAtual = parseFloat(gastosMes._sum.valor || 0);
    const gastoAnterior = parseFloat(gastosMesPassado._sum.valor || 0);
    const variacaoGastos = gastoAnterior > 0 ? ((gastoAtual - gastoAnterior) / gastoAnterior) * 100 : 0;

    // --- CÁLCULO DE META ORÇAMENTÁRIA (KPI 1) ---
    let valorMeta = null;
    let semMeta = true;

    if (user.role === 'GESTOR') {
      const reg = user.loja?.regiao || null;
      const uni = user.loja?.nome || null;
      const meta = await buscarMetaVigente(reg, uni, anoNum, mesIdx + 1);
      if (meta) {
        valorMeta = parseFloat(meta.valorMeta);
        semMeta = false;
      }
    } else if (unidade) {
      const reg = regiao || (user.role === 'COORDENADOR' ? getUserRegions(user)[0] : null);
      const meta = await buscarMetaVigente(reg, unidade, anoNum, mesIdx + 1);
      if (meta) {
        valorMeta = parseFloat(meta.valorMeta);
        semMeta = false;
      }
    } else if (regiao) {
      const meta = await buscarMetaVigente(regiao, null, anoNum, mesIdx + 1);
      if (meta) {
        valorMeta = parseFloat(meta.valorMeta);
        semMeta = false;
      }
    } else {
      let regioesPermitidas = [];
      if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
        const resultado = await prisma.loja.findMany({
          where: { ativo: true },
          select: { regiao: true },
          distinct: ['regiao'],
        });
        regioesPermitidas = resultado.map(r => r.regiao);
      } else if (user.role === 'COORDENADOR') {
        regioesPermitidas = getUserRegions(user);
      }

      if (regioesPermitidas.length > 0) {
        const metasRegionais = await prisma.metaOrcamentaria.findMany({
          where: {
            regiao: { in: regioesPermitidas },
            unidade: null,
            ano: anoNum,
            mes: mesIdx + 1,
          },
        });
        if (metasRegionais.length > 0) {
          valorMeta = metasRegionais.reduce((sum, m) => sum + parseFloat(m.valorMeta), 0);
          semMeta = false;
        }
      }
    }

    let percentualExecucao = null;
    let statusMeta = 'SEM_META';

    if (!semMeta && valorMeta > 0) {
      percentualExecucao = Math.round((gastoAtual / valorMeta) * 100);
      if (percentualExecucao <= 90) {
        statusMeta = 'VERDE';
      } else if (percentualExecucao <= 110) {
        statusMeta = 'AMARELO';
      } else {
        statusMeta = 'VERMELHO';
      }
    }

    const metaObj = {
      valorMeta,
      percentualExecucao,
      statusMeta,
      semMeta,
    };

    return {
      periodo: { mes: mesIdx + 1, ano: anoNum },
      tarefas: { total: totalTarefas, pendentes: tarefasPendentes, emAndamento: tarefasEmAndamento, concluidas: tarefasConcluidas },
      financeiro: {
        chamadosMes: totalChamadosMes,
        gastosMes: gastoAtual,
        gastosMesPassado: gastoAnterior,
        variacaoPercent: variacaoGastos.toFixed(1),
        mauUso: chamadosMauUso,
        meta: metaObj,
      },
      meta: metaObj,
      fornecedores: { total: totalFornecedores },
      estoque: { pecasBaixoEstoque },
      contexto: {
        unidade: user.loja?.nome || null,
        regiao: user.regiao
      }
    };
  });
};

const gastosPorSegmento = async (user, query) => {
  const { mes, ano, regiao, unidade } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();

  const cacheKey = buildKey('gastosPorSegmento', user, { mes: mesNum, ano: anoNum, regiao, unidade });
  return withCache(cacheKey, TTL.gastosPorSegmento, async () => {
    const dataInicio = new Date(anoNum, mesNum - 1, 1);
    const dataFim = new Date(anoNum, mesNum, 1);

    const filter = getAccessFilter(user);
    const where = {
      ...filter,
      dataAbertura: { gte: dataInicio, lt: dataFim }
    };

    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
      if (regiao) {
        if (!canAccessRegion(user, regiao)) {
          throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
        }
        where.regiao = regiao;
      }
      if (unidade) where.unidade = unidade;
    }

    const dados = await prisma.controleChamado.groupBy({
      by: ['segmento'],
      where: where,
      _sum: { valor: true },
      _count: true,
      orderBy: { _sum: { valor: 'desc' } },
    });

    const agrupado = {};
    dados.forEach((d) => {
      const segmento = isOpexChamado(d.segmento) ? OPEX_SEGMENTO_LABEL : d.segmento;
      if (!agrupado[segmento]) {
        agrupado[segmento] = { segmento, total: 0, quantidade: 0 };
      }
      agrupado[segmento].total += parseFloat(d._sum.valor || 0);
      agrupado[segmento].quantidade += d._count;
    });

    return Object.values(agrupado).sort((a, b) => b.total - a.total);
  });
};

const historicoMensal = async (user, query) => {
  const { regiao, unidade } = query;

  const cacheKey = buildKey('historicoMensal', user, { regiao, unidade });
  return withCache(cacheKey, TTL.historicoMensal, async () => {
    const filter = getAccessFilter(user);

    const baseWhere = { ...filter };
    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
      if (regiao) {
        if (!canAccessRegion(user, regiao)) {
          throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
        }
        baseWhere.regiao = regiao;
      }
      if (unidade) baseWhere.unidade = unidade;
    }

    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Get total aggregated data
      const agg = await prisma.controleChamado.aggregate({
        where: { ...baseWhere, dataAbertura: { gte: inicio, lte: fim } },
        _sum: { valor: true },
        _count: true,
      });

      // Get OPEX data (old segment-based approach for backward compatibility)
      const aggOpex = await prisma.controleChamado.aggregate({
        where: {
          ...baseWhere,
          segmento: { in: ['LAUDOS', 'SISTEMA_INCENDIO'] },
          dataAbertura: { gte: inicio, lte: fim },
        },
        _sum: { valor: true },
        _count: true,
      });

        // Get investment tower data (support both status and segmento for backwards compatibility)
        const aggPCI = await prisma.controleChamado.aggregate({
          where: {
            ...baseWhere,
            AND: [
              { dataAbertura: { gte: inicio, lte: fim } },
              {
                OR: [
                  { status: 'PCI' },
                  { segmento: 'SISTEMA_INCENDIO' },
                ],
              },
            ],
          },
          _sum: { valor: true },
          _count: true,
        });

        const aggLAUDOS = await prisma.controleChamado.aggregate({
          where: {
            ...baseWhere,
            AND: [
              { dataAbertura: { gte: inicio, lte: fim } },
              {
                OR: [
                  { status: 'LAUDOS' },
                  { segmento: 'LAUDOS' },
                ],
              },
            ],
          },
          _sum: { valor: true },
          _count: true,
        });

      const valorTotal = parseFloat(agg._sum.valor || 0);
      const valorOpex = parseFloat(aggOpex._sum.valor || 0);
      const quantidadeOpex = aggOpex._count || 0;

      // Investment tower totals
      const valorPCI = parseFloat(aggPCI._sum.valor || 0);
      const quantidadePCI = aggPCI._count || 0;
      const valorLAUDOS = parseFloat(aggLAUDOS._sum.valor || 0);
      const quantidadeLAUDOS = aggLAUDOS._count || 0;

        meses.push({
        mes: inicio.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        mesNum: inicio.getMonth() + 1,
        anoNum: inicio.getFullYear(),
        valor: valorTotal,
          valorRegular: Math.max(valorTotal - (valorLAUDOS + valorPCI), 0),
        valorOpex,
        quantidade: agg._count,
        quantidadeOpex,
        quantidadeRegular: Math.max(agg._count - quantidadeOpex, 0),
        // Investment tower data
        valorPCI,
        quantidadePCI,
        valorLAUDOS,
        quantidadeLAUDOS,
      });
    }
    return meses;
  });
};

const resumoRegional = async (user, query) => {
  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();

  const cacheKey = buildKey('resumoRegional', user, { mes: mesNum, ano: anoNum });
  return withCache(cacheKey, TTL.resumoRegional, async () => {
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);
    const regioesPermitidas = getUserRegions(user);

    const regioesRes = await prisma.loja.findMany({
      select: { regiao: true },
      distinct: ['regiao'],
      where: { ativo: true },
      orderBy: { regiao: 'asc' },
    });

    const todasRegioes = regioesRes
      .map(r => r.regiao)
      .filter((regiao) => {
        if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) return true;
        return regioesPermitidas.includes(regiao);
      });

    const resumo = await Promise.all(todasRegioes.map(async (regiao) => {
      const [gastos, chamados, tarefas, totalLojas, meta] = await Promise.all([
        prisma.controleChamado.aggregate({
          where: { regiao, dataAbertura: { gte: inicioMes, lt: fimMes } },
          _sum: { valor: true }
        }),
        prisma.controleChamado.count({
          where: { regiao, dataAbertura: { gte: inicioMes, lt: fimMes } }
        }),
        prisma.tarefa.count({
          where: { regiao, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }, criadoEm: { gte: inicioMes, lt: fimMes } }
        }),
        prisma.loja.count({
          where: { regiao, ativo: true }
        }),
        buscarMetaVigente(regiao, null, anoNum, mesNum)
      ]);

      const gastosMes = parseFloat(gastos._sum.valor || 0);
      const valorMeta = meta ? parseFloat(meta.valorMeta) : null;
      const percentualExecucao = valorMeta ? Math.round((gastosMes / valorMeta) * 100) : null;
      let statusMeta = 'SEM_META';
      if (valorMeta) {
        if (percentualExecucao <= 90) statusMeta = 'VERDE';
        else if (percentualExecucao <= 110) statusMeta = 'AMARELO';
        else statusMeta = 'VERMELHO';
      }

      return {
        regiao,
        gastosMes,
        chamadosMes: chamados,
        tarefasAtivas: tarefas,
        totalLojas,
        valorMeta,
        percentualExecucao,
        statusMeta,
        semMeta: !meta,
      };
    }));

    return {
      periodo: { mes: mesNum, ano: anoNum },
      data: resumo,
    };
  });
};

const detalheRegional = async (user, paramRegiao, query) => {
  if (!canAccessRegion(user, paramRegiao)) {
    throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
  }

  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();
  const cacheKey = buildKey('detalheRegional', user, { mes: mesNum, ano: anoNum, regiao: paramRegiao });
  return withCache(cacheKey, TTL.detalheRegional, async () => {
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);

    const [
      gastosPorSegmento,
      topEmpresasGastos,
      totalMauUso,
      resumoFinanceiro,
      lojasRegional
    ] = await Promise.all([
      prisma.controleChamado.groupBy({
        by: ['segmento'],
        where: { regiao: paramRegiao, dataAbertura: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
        _count: true,
        orderBy: { _sum: { valor: 'desc' } },
        take: 10
      }),
      prisma.controleChamado.groupBy({
        by: ['empresa'],
        where: { regiao: paramRegiao, dataAbertura: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
        orderBy: { _sum: { valor: 'desc' } },
        take: 10
      }),
      prisma.controleChamado.aggregate({
        where: { regiao: paramRegiao, mauUso: true, dataAbertura: { gte: inicioMes, lt: fimMes } },
        _count: true,
        _sum: { valor: true }
      }),
      prisma.controleChamado.aggregate({
        where: { regiao: paramRegiao, dataAbertura: { gte: inicioMes, lt: fimMes } },
        _sum: { valor: true },
        _count: true
      }),
      prisma.loja.findMany({
        where: { regiao: paramRegiao, ativo: true },
        select: {
          id: true,
          numero: true,
          nome: true,
          regiao: true,
        },
        orderBy: [{ numero: 'asc' }],
      })
    ]);

    const lojas = await Promise.all(
      lojasRegional.map(async (loja) => {
        const [financeiro, mauUso, gestoresAtivos, meta] = await Promise.all([
          prisma.controleChamado.aggregate({
            where: {
              regiao: paramRegiao,
              unidade: loja.nome,
              dataAbertura: { gte: inicioMes, lt: fimMes },
            },
            _sum: { valor: true },
            _count: true,
          }),
          prisma.controleChamado.count({
            where: {
              regiao: paramRegiao,
              unidade: loja.nome,
              mauUso: true,
              dataAbertura: { gte: inicioMes, lt: fimMes },
            },
          }),
          prisma.usuario.count({
            where: {
              lojaId: loja.id,
              role: 'GESTOR',
              ativo: true,
            },
          }),
          buscarMetaVigente(paramRegiao, loja.nome, anoNum, mesNum)
        ]);

        const totalGasto = parseFloat(financeiro._sum.valor || 0);
        const valorMeta = meta ? parseFloat(meta.valorMeta) : null;
        const percentualExecucao = valorMeta ? Math.round((totalGasto / valorMeta) * 100) : null;
        let statusMeta = 'SEM_META';
        if (valorMeta) {
          if (percentualExecucao <= 90) statusMeta = 'VERDE';
          else if (percentualExecucao <= 110) statusMeta = 'AMARELO';
          else statusMeta = 'VERMELHO';
        }

        return {
          id: loja.id,
          numero: loja.numero,
          nome: loja.nome,
          regiao: loja.regiao,
          gestoresAtivos,
          totalGasto,
          totalChamados: financeiro._count,
          mauUso,
          valorMeta,
          percentualExecucao,
          statusMeta,
          semMeta: !meta,
        };
      })
    );

    return {
      regiao: paramRegiao,
      periodo: { mes: mesNum, ano: anoNum },
      financeiro: {
        totalGasto: parseFloat(resumoFinanceiro._sum.valor || 0),
        totalChamados: resumoFinanceiro._count,
        mauUso: {
          quantidade: totalMauUso._count,
          valor: parseFloat(totalMauUso._sum.valor || 0)
        }
      },
      segmentos: gastosPorSegmento.map(s => ({
        segmento: formatarSegmento(s.segmento),
        valor: parseFloat(s._sum.valor || 0),
        quantidade: s._count
      })),
      empresas: topEmpresasGastos.map(e => ({
        empresa: e.empresa,
        valor: parseFloat(e._sum.valor || 0)
      })),
      lojas: lojas.sort((a, b) => b.totalGasto - a.totalGasto),
    };
  });
};



const rankingCoordenadores = async (user, query) => {
  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();

  const cacheKey = buildKey('rankingCoordenadores', user, { mes: mesNum, ano: anoNum });
  return withCache(cacheKey, TTL.rankingCoordenadores, async () => {
    const inicioMes = startOfMonth(new Date(anoNum, mesNum - 1));
    const fimMes = endOfMonth(new Date(anoNum, mesNum - 1));
    const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
    const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });
    const totalSemanasNoMes = Math.max(1, semanaFim - semanaInicio + 1);
    const regioesPermitidas = getUserRegions(user);

  const coordenadores = await prisma.usuario.findMany({
    where: { role: 'COORDENADOR', ativo: true },
    select: { id: true, nome: true, email: true, regiao: true },
    orderBy: { nome: 'asc' },
  });

  const coordenadoresVisiveis = coordenadores.filter((coordenador) => {
    if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) return true;
    return hasRegionOverlap(regioesPermitidas, getUserRegions(coordenador));
  });

  const rankingBase = await Promise.all(
    coordenadoresVisiveis.map(async (coordenador) => {
      const regioesCoordenador = getUserRegions(coordenador);
      const regionFilter =
        regioesCoordenador.length === 1 ? regioesCoordenador[0] : { in: regioesCoordenador };
      const whereRegiao = regioesCoordenador.length
        ? { regiao: regionFilter }
        : { regiao: '__SEM_REGIAO__' };

      const [
        gastosMes,
        chamadosMes,
        mauUsoMes,
        tarefasAtivas,
        checklistsEquip,
        checklistsCarrinho,
      ] = await Promise.all([
        prisma.controleChamado.aggregate({
          where: { ...whereRegiao, dataAbertura: { gte: inicioMes, lte: fimMes } },
          _sum: { valor: true },
        }),
        prisma.controleChamado.count({
          where: { ...whereRegiao, dataAbertura: { gte: inicioMes, lte: fimMes } },
        }),
        prisma.controleChamado.count({
          where: { ...whereRegiao, mauUso: true, dataAbertura: { gte: inicioMes, lte: fimMes } },
        }),
        prisma.tarefa.count({
          where: { ...whereRegiao, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
        }),
        prisma.checklistEquipamento.findMany({
          where: {
            ...whereRegiao,
            ano: anoNum,
            semana: { gte: semanaInicio, lte: semanaFim },
          },
          select: { semana: true, itens: { where: { operacional: false }, select: { quantidadeQuebrada: true } } },
        }),
        prisma.checklistCarrinho.findMany({
          where: {
            ...whereRegiao,
            ano: anoNum,
            semana: { gte: semanaInicio, lte: semanaFim },
          },
          select: { semana: true, itens: { select: { quebrados: true } } },
        }),
      ]);

      const equipamentosParados = checklistsEquip.reduce(
        (sum, checklist) => sum + checklist.itens.reduce((itemSum, item) => itemSum + (item.quantidadeQuebrada || 0), 0),
        0
      );
      const carrinhosQuebrados = checklistsCarrinho.reduce(
        (sum, checklist) => sum + checklist.itens.reduce((itemSum, item) => itemSum + (item.quebrados || 0), 0),
        0
      );
      const semanasCobertas = new Set([
        ...checklistsEquip.map((item) => item.semana),
        ...checklistsCarrinho.map((item) => item.semana),
      ]).size;
      const gastoTotal = parseFloat(gastosMes._sum.valor || 0);
      const custoPorChamado = chamadosMes > 0 ? gastoTotal / chamadosMes : gastoTotal;
      const disponibilidadeBruta = Math.max(
        0,
        100 - (equipamentosParados * 3 + carrinhosQuebrados * 1.5 + tarefasAtivas * 2 + mauUsoMes * 8)
      );
      const coberturaChecklist = (semanasCobertas / totalSemanasNoMes) * 100;

      return {
        id: coordenador.id,
        nome: coordenador.nome,
        email: coordenador.email,
        regiao: coordenador.regiao,
        regioes: regioesCoordenador,
        gastosMes: gastoTotal,
        chamadosMes,
        mauUsoMes,
        tarefasAtivas,
        equipamentosParados,
        carrinhosQuebrados,
        semanasCobertas,
        totalSemanasNoMes,
        custoPorChamado,
        disponibilidadeBruta,
        coberturaChecklist,
      };
    })
  );

  const custos = rankingBase.map((item) => item.custoPorChamado);
  const minCusto = Math.min(...custos, 0);
  const maxCusto = Math.max(...custos, 0);

  const ranking = rankingBase
    .map((item) => {
      const custoScore =
        maxCusto === minCusto ? 100 : 100 - ((item.custoPorChamado - minCusto) / (maxCusto - minCusto)) * 100;
      const score =
        item.disponibilidadeBruta * 0.5 +
        custoScore * 0.35 +
        item.coberturaChecklist * 0.15;

      return {
        ...item,
        custoScore: Number(custoScore.toFixed(1)),
        score: Number(score.toFixed(1)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, posicao: index + 1 }));

    return {
      periodo: { mes: mesNum, ano: anoNum },
      criterio: 'Ranking proxy por disponibilidade, eficiencia de custo por chamado e cobertura de checklist.',
      data: ranking,
    };
  });
};

const executivo = async (user, query) => {
  const { mes, ano } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();

  const cacheKey = buildKey('executivo', user, { mes: mesNum, ano: anoNum });
  return withCache(cacheKey, TTL.executivo, async () => {
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes    = new Date(anoNum, mesNum, 1);
    const inicioMesPassado = new Date(anoNum, mesNum - 2, 1);
    const fimMesPassado = new Date(anoNum, mesNum - 1, 1);

  const filter = getAccessFilter(user);
  const whereMesAtual = { ...filter, dataAbertura: { gte: inicioMes, lt: fimMes } };
  const whereMesPassado = { ...filter, dataAbertura: { gte: inicioMesPassado, lt: fimMesPassado } };

  const [gastosAtual, gastosPassado, chamadosAtualCount] = await Promise.all([
    prisma.controleChamado.aggregate({ where: whereMesAtual, _sum: { valor: true } }),
    prisma.controleChamado.aggregate({ where: whereMesPassado, _sum: { valor: true } }),
    prisma.controleChamado.count({ where: whereMesAtual })
  ]);

  const totalAtual = parseFloat(gastosAtual._sum.valor || 0);
  const totalPassado = parseFloat(gastosPassado._sum.valor || 0);
  const ticketMedio = chamadosAtualCount > 0 ? totalAtual / chamadosAtualCount : 0;
  const variacaoMoM = totalPassado > 0 ? ((totalAtual - totalPassado) / totalPassado) * 100 : 0;

  const lojasGasto = await prisma.controleChamado.groupBy({
    by: ['unidade'],
    where: whereMesAtual,
    _sum: { valor: true },
    orderBy: { _sum: { valor: 'desc' } },
    take: 10
  });

  const fornecedoresGasto = await prisma.controleChamado.groupBy({
    by: ['empresa'],
    where: whereMesAtual,
    _sum: { valor: true },
    orderBy: { _sum: { valor: 'desc' } }
  });

  const fornecedores = fornecedoresGasto.map(f => ({
    empresa: f.empresa || 'Sem Empresa',
    valor: parseFloat(f._sum.valor || 0),
    share: totalAtual > 0 ? (parseFloat(f._sum.valor || 0) / totalAtual) * 100 : 0
  }));

  const segmentosGasto = await prisma.controleChamado.groupBy({
    by: ['segmento'],
    where: whereMesAtual,
    _sum: { valor: true },
    _count: true,
    orderBy: { _sum: { valor: 'desc' } }
  });

  const segmentosNormalizados = {};
  segmentosGasto.forEach(s => {
    const segmento = agruparSegmentoPareto(s.segmento);
    const valor = parseFloat(s._sum.valor || 0);
    if (!segmentosNormalizados[segmento]) {
      segmentosNormalizados[segmento] = { valor: 0, count: 0 };
    }
    segmentosNormalizados[segmento].valor += valor;
    segmentosNormalizados[segmento].count += s._count;
  });

  let acumulado = 0;
  const paretoSegmentosRaw = Object.entries(segmentosNormalizados)
    .map(([segmento, data]) => ({
      segmento: formatarSegmento(segmento),
      valor: data.valor,
      count: data.count
    }))
    .filter(s => s.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .map(s => {
      acumulado += s.valor;
      return {
        segmento: s.segmento,
        valor: s.valor,
        share: totalAtual > 0 ? (s.valor / totalAtual) * 100 : 0,
        acumulado: totalAtual > 0 ? (acumulado / totalAtual) * 100 : 0
      };
    });

  const paretoSegmentos = paretoSegmentosRaw.map((item) => ({
    ...item,
    acumulado: Math.min(item.acumulado, 100)
  }));

  acumulado = 0;
  const empresasNormalizadas = {};
  fornecedoresGasto.forEach(f => {
    const empresa = (f.empresa || '').trim() || 'Sem Empresa';
    const valor = parseFloat(f._sum.valor || 0);
    if (!empresasNormalizadas[empresa]) {
      empresasNormalizadas[empresa] = { valor: 0, count: 0 };
    }
    empresasNormalizadas[empresa].valor += valor;
    empresasNormalizadas[empresa].count += f._count;
  });

  const paretoEmpresasRaw = Object.entries(empresasNormalizadas)
    .map(([empresa, data]) => ({
      empresa,
      valor: data.valor,
      count: data.count
    }))
    .filter(e => e.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .map(e => {
      acumulado += e.valor;
      return {
        empresa: e.empresa,
        valor: e.valor,
        share: totalAtual > 0 ? (e.valor / totalAtual) * 100 : 0,
        acumulado: totalAtual > 0 ? (acumulado / totalAtual) * 100 : 0
      };
    });

  const paretoEmpresas = paretoEmpresasRaw.map((item) => ({
    ...item,
    acumulado: Math.min(item.acumulado, 100)
  }));

    return {
      comparativo: { atual: totalAtual, passado: totalPassado, variacao: variacaoMoM },
      ticketMedio,
      top5Lojas: lojasGasto.map(l => ({ unidade: l.unidade, valor: parseFloat(l._sum.valor || 0) })),
      fornecedores,
      paretoSegmentos,
      paretoEmpresas,
      pareto: paretoSegmentos
    };
  });
};

const conformidadeMatrix = async (user, query) => {
  const { mes, ano } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();

  const cacheKey = buildKey('conformidadeMatrix', user, { mes: mesNum, ano: anoNum });
  return withCache(cacheKey, TTL.conformidadeMatrix, async () => {
    const inicioMes = startOfMonth(new Date(anoNum, mesNum - 1));
    const fimMes    = endOfMonth(new Date(anoNum, mesNum - 1));
    const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
    const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });
    const totalSemanasNoMes = Math.max(1, semanaFim - semanaInicio + 1);

  const filter = getAccessFilter(user);

  // Buscar todas as lojas do escopo
  const lojas = await prisma.loja.findMany({
    where: { ...filter, ativo: true },
    orderBy: { nome: 'asc' }
  });

  const lojasNomes = lojas.map(l => l.nome);

  // Buscar checklists e ativos
  const [checklistsEquip, checklistsCarrinho, checklistsRotina, ativos] = await Promise.all([
    prisma.checklistEquipamento.findMany({
      where: {
        unidade: { in: lojasNomes },
        ano: anoNum,
        semana: { gte: semanaInicio, lte: semanaFim }
      }
    }),
    prisma.checklistCarrinho.findMany({
      where: {
        unidade: { in: lojasNomes },
        ano: anoNum,
        semana: { gte: semanaInicio, lte: semanaFim }
      }
    }),
    prisma.checklistRotinaInfra.findMany({
      where: {
        unidade: { in: lojas.map(l => String(l.numero)) },
        ano: anoNum,
        mes: mesNum
      }
    }),
    prisma.ativoLoja.findMany({
      where: {
        unidade: { in: lojasNomes },
        ativo: true
      }
    })
  ]);

  const agora = new Date();

  return lojas.map(loja => {
    // 1. Cobertura de Checklist
    const equipFills = checklistsEquip.filter(c => c.unidade === loja.nome).length;
    const carrFills = checklistsCarrinho.filter(c => c.unidade === loja.nome).length;
    const rotinaFills = checklistsRotina.filter(c => c.unidade === String(loja.numero)).length;

    const totalFilled = equipFills + carrFills + rotinaFills;
    const totalExpected = totalSemanasNoMes * 3 + 1; // 1 de equip, 1 de carrinho, 1 de gerador por semana + 1 de incendio visual por mes
    const checklistCoverage = totalExpected > 0 ? Math.min(100, Math.round((totalFilled / totalExpected) * 100)) : 100;

    // 2. Adesão de Preventivas
    const lojaAtivos = ativos.filter(a => a.unidade === loja.nome);
    const ativosPreventiva = lojaAtivos.filter(a => a.intervaloPreventiva !== null);
    let preventivasEmDia = 0;

    ativosPreventiva.forEach(a => {
      if (a.proximaPreventiva) {
        const proxima = new Date(a.proximaPreventiva);
        if (proxima >= agora) {
          preventivasEmDia++;
        }
      }
    });

    let totalItensAdesao = ativosPreventiva.length;
    let itensAdesaoEmDia = preventivasEmDia;

    // Adicionar a conformidade dos checklists de rotinas de infraestrutura do mês na adesão
    const rotinasLoja = checklistsRotina.filter(r => r.unidade === String(loja.numero));
    if (rotinasLoja.length > 0) {
      const tiposRotina = [...new Set(rotinasLoja.map(r => r.tipo))];
      tiposRotina.forEach(tipo => {
        const rotinasTipo = rotinasLoja.filter(r => r.tipo === tipo);
        const temFalha = rotinasTipo.some(r => r.conforme === false);

        totalItensAdesao++;
        if (!temFalha) {
          itensAdesaoEmDia++;
        }
      });
    }

    const preventivaAdherence = totalItensAdesao > 0
      ? Math.round((itensAdesaoEmDia / totalItensAdesao) * 100)
      : 100;

    // 3. Status de Baterias (Nobreak + Gerador) e Cabines Primárias
    const geradores = lojaAtivos.filter(a => (a.categoria || '').toLowerCase().includes('gerador'));
    const nobreaks = lojaAtivos.filter(a => (a.categoria || '').toLowerCase().includes('nobreak'));
    const cabines = lojaAtivos.filter(a => (a.categoria || '').toLowerCase().includes('cabine'));

    let bateriasOk = true;
    let laudoCabineOk = true;
    const alertas = [];

    // Checagem de baterias físicas
    [...geradores, ...nobreaks].forEach(a => {
      if (a.proximaTrocaBateria) {
        const proximaTroca = new Date(a.proximaTrocaBateria);
        if (proximaTroca < agora) {
          bateriasOk = false;
          alertas.push(`Bateria do ${a.nome} vencida em ${proximaTroca.toLocaleDateString('pt-BR')}`);
        }
      }
    });

    // Checagem de laudo da cabine primária (proximaPreventiva)
    cabines.forEach(a => {
      if (a.proximaPreventiva) {
        const vencimento = new Date(a.proximaPreventiva);
        if (vencimento < agora) {
          laudoCabineOk = false;
          alertas.push(`Laudo da Cabine Primária ${a.nome} vencido em ${vencimento.toLocaleDateString('pt-BR')}`);
        }
      }
    });

    // Adicionar checagem das rotinas de infraestrutura do mês
    const rotinasGeradorFalha = rotinasLoja.filter(r => r.tipo === 'GERADOR_SEMANAL' && r.conforme === false);
    if (rotinasGeradorFalha.length > 0) {
      bateriasOk = false;
      rotinasGeradorFalha.forEach(r => {
        alertas.push(`Gerador com não conformidade (Semana ${r.semana}): ${r.descricao || 'Sem descrição'}`);
      });
    }

    const rotinasIncendioFalha = rotinasLoja.filter(r => ['INCENDIO_MENSAL_VISUAL', 'INCENDIO_BIMESTRAL_BOMBA'].includes(r.tipo) && r.conforme === false);
    if (rotinasIncendioFalha.length > 0) {
      laudoCabineOk = false;
      rotinasIncendioFalha.forEach(r => {
        alertas.push(`Sistema de Incêndio com não conformidade: ${r.descricao || 'Sem descrição'}`);
      });
    }

    return {
      unidade: loja.nome,
      regiao: loja.regiao,
      checklistCoverage,
      preventivaAdherence,
      statusBaterias: (geradores.length > 0 || nobreaks.length > 0 || rotinasGeradorFalha.length > 0) ? (bateriasOk ? 'OK' : 'VENCIDO') : 'OK',
      statusCabine: (cabines.length > 0 || rotinasIncendioFalha.length > 0) ? (laudoCabineOk ? 'OK' : 'VENCIDO') : 'N/A',
      alertas,
      totalAtivos: lojaAtivos.length,
      totalPreventivas: ativosPreventiva.length
    };
  });
  });
};

const buyVsMaintain = async (user, query) => {
  const cacheKey = buildKey('buyVsMaintain', user, {});
  return withCache(cacheKey, TTL.buyVsMaintain, async () => {
    const filter = getAccessFilter(user);

    // Buscar todos os ativos com falhas e itens de checklist vinculados
    const ativos = await prisma.ativoLoja.findMany({
      where: { ...filter, ativo: true },
      include: {
        falhas: {
          orderBy: { dataDeteccao: 'desc' }
        },
        checklistItens: {
          select: {
            valor: true
          }
        }
      }
    });

    return ativos.map(ativo => {
      // 1. Métricas de Confiabilidade (MTBF, MTTR, Uptime %)
      const metricas = calcularMetricasConfiabilidade(ativo);
      const { totalFalhas, uptimePercentual, mtbfDias, mttrHoras } = metricas;

      // 2. Custo Acumulado de Reparo
      let custoAcumulado = 0;
      ativo.checklistItens.forEach(item => {
        if (item.valor) {
          custoAcumulado += parseFloat(item.valor);
        }
      });

      // 3. Custo Estimado de Substituição
      let custoSubstituicao = 15000; // Baseline padrão

      const cat = (ativo.categoria || '').toLowerCase();
      const isIlha = cat.includes('ilha') || cat.includes('congelado');

      if (ativo.dadosTecnicos && typeof ativo.dadosTecnicos === 'object') {
        const dt = ativo.dadosTecnicos;
        if (dt.custoSubstituicao) {
          custoSubstituicao = parseFloat(dt.custoSubstituicao);
        } else {
          if (cat.includes('gerador')) custoSubstituicao = 80000;
          else if (cat.includes('nobreak')) custoSubstituicao = 35000;
          else if (cat.includes('cabine')) custoSubstituicao = 120000;
          else if (isIlha) custoSubstituicao = 25000;
        }
      } else {
        if (cat.includes('gerador')) custoSubstituicao = 80000;
        else if (cat.includes('nobreak')) custoSubstituicao = 35000;
        else if (cat.includes('cabine')) custoSubstituicao = 120000;
        else if (isIlha) custoSubstituicao = 25000;
      }

      // 4. Algoritmo de Recomendação Buy vs. Maintain
      // Recomendação é "BUY" se:
      // - Custo acumulado excede 60% do valor de substituição
      // - OU Uptime < 85% e tem pelo menos 3 falhas
      // - OU MTBF é muito baixo (< 30 dias para a maioria, ou < 180 dias para ilhas congeladas)
      let recomendacao = 'MAINTAIN';
      const razoes = [];

      const limiteCusto = custoSubstituicao * 0.6;
      if (custoAcumulado > limiteCusto) {
        recomendacao = 'BUY';
        razoes.push(`Custo acumulado de manutenção (R$ ${custoAcumulado.toFixed(2)}) supera 60% do custo de substituição (R$ ${custoSubstituicao.toFixed(2)})`);
      }

      if (uptimePercentual < 85 && totalFalhas >= 3) {
        recomendacao = 'BUY';
        razoes.push(`Uptime de confiabilidade muito baixo (${uptimePercentual.toFixed(1)}%) com histórico recorrente`);
      }

      const thresholdMtbf = isIlha ? 180 : 30;

      if (totalFalhas >= 2 && mtbfDias !== null && mtbfDias < thresholdMtbf) {
        recomendacao = 'BUY';
        razoes.push(`Intervalo médio entre falhas (MTBF de ${mtbfDias.toFixed(1)} dias) abaixo do limite recomendado (${thresholdMtbf} dias)`);
      }

      return {
        ativoId: ativo.id,
        nome: ativo.nome,
        categoria: ativo.categoria,
        tipo: ativo.tipo,
        patrimonio: ativo.patrimonio,
        unidade: ativo.unidade,
        regiao: ativo.regiao,
        totalFalhas,
        uptimePercentual: uptimePercentual.toFixed(1),
        mtbfDias,
        mttrHoras,
        falhasResolvidas: metricas.falhasResolvidas,
        falhasAbertas: metricas.falhasAbertas,
        possuiHistoricoMtbf: metricas.possuiHistoricoMtbf,
        possuiHistoricoMttr: metricas.possuiHistoricoMttr,
        custoAcumulado,
        custoSubstituicao,
        recomendacao,
        razoes
      };
    });
  });
};

module.exports = {
  resumo,
  gastosPorSegmento,
  historicoMensal,
  resumoRegional,
  detalheRegional,
  rankingCoordenadores,
  executivo,
  conformidadeMatrix,
  buyVsMaintain,
};

const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions, canAccessRegion } = require('../utils/access.utils');
const { getWeek, startOfMonth, endOfMonth } = require('date-fns');

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
    CIVIL: 'CIVIL'
  };
  return grupos[segmentoNormalizado] || segmentoNormalizado;
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

  return {
    periodo: { mes: mesIdx + 1, ano: anoNum },
    tarefas: { total: totalTarefas, pendentes: tarefasPendentes, emAndamento: tarefasEmAndamento, concluidas: tarefasConcluidas },
    financeiro: { chamadosMes: totalChamadosMes, gastosMes: gastoAtual, gastosMesPassado: gastoAnterior, variacaoPercent: variacaoGastos.toFixed(1), mauUso: chamadosMauUso },
    fornecedores: { total: totalFornecedores },
    estoque: { pecasBaixoEstoque },
    contexto: {
      unidade: user.loja?.nome || null,
      regiao: user.regiao
    }
  };
};

const gastosPorSegmento = async (user, query) => {
  const { mes, ano, regiao, unidade } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();

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

  return dados.map(d => ({
    segmento: d.segmento,
    total: parseFloat(d._sum.valor || 0),
    quantidade: d._count,
  }));
};

const historicoMensal = async (user, query) => {
  const { regiao, unidade } = query;
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

    const agg = await prisma.controleChamado.aggregate({
      where: { ...baseWhere, dataAbertura: { gte: inicio, lte: fim } },
      _sum: { valor: true }, _count: true,
    });

    meses.push({
      mes: inicio.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
      mesNum: inicio.getMonth() + 1,
      anoNum: inicio.getFullYear(),
      valor: parseFloat(agg._sum.valor || 0),
      quantidade: agg._count,
    });
  }
  return meses;
};

const resumoRegional = async (user, query) => {
  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();
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
    const [gastos, chamados, tarefas, totalLojas] = await Promise.all([
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
      })
    ]);

    return {
      regiao,
      gastosMes: parseFloat(gastos._sum.valor || 0),
      chamadosMes: chamados,
      tarefasAtivas: tarefas,
      totalLojas,
    };
  }));

  return {
    periodo: { mes: mesNum, ano: anoNum },
    data: resumo,
  };
};

const detalheRegional = async (user, paramRegiao, query) => {
  if (!canAccessRegion(user, paramRegiao)) {
    throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
  }

  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();
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
      const [financeiro, mauUso, gestoresAtivos] = await Promise.all([
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
      ]);

      return {
        id: loja.id,
        numero: loja.numero,
        nome: loja.nome,
        regiao: loja.regiao,
        gestoresAtivos,
        totalGasto: parseFloat(financeiro._sum.valor || 0),
        totalChamados: financeiro._count,
        mauUso,
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
};

const rankingCoordenadores = async (user, query) => {
  const agora = new Date();
  const mesNum = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const anoNum = query.ano ? parseInt(query.ano) : agora.getFullYear();
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
};

const executivo = async (user, query) => {
  const { mes, ano } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();

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
};

module.exports = {
  resumo,
  gastosPorSegmento,
  historicoMensal,
  resumoRegional,
  detalheRegional,
  rankingCoordenadores,
  executivo,
};

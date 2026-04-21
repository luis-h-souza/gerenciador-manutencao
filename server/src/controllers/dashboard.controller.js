const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions, canAccessRegion } = require('../utils/access.utils');

const resumo = async (req, res, next) => {
  try {
    const { mes, ano, regiao, unidade } = req.query;
    const agora = new Date();
    
    // Se não fornecido, usa o mês atual
    const mesIdx = mes ? parseInt(mes) - 1 : agora.getMonth();
    const anoNum = ano ? parseInt(ano) : agora.getFullYear();

    const inicioMes = new Date(anoNum, mesIdx, 1);
    const fimMes    = new Date(anoNum, mesIdx + 1, 1);
    const inicioMesPassado = new Date(anoNum, mesIdx - 1, 1);
    const fimMesPassado = new Date(anoNum, mesIdx, 0);

    const filter = getAccessFilter(req.user);
    const where = { ...filter };

    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'].includes(req.user.role)) {
      if (regiao) {
        if (!canAccessRegion(req.user, regiao)) {
          return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
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
      req.user.role === 'GESTOR'
        ? prisma.peca.findMany({
            where: { quantidadeEstoque: { lte: 5 } },
            select: { id: true, nome: true, quantidadeEstoque: true },
          })
        : Promise.resolve([]),
    ]);

    const gastoAtual = parseFloat(gastosMes._sum.valor || 0);
    const gastoAnterior = parseFloat(gastosMesPassado._sum.valor || 0);
    const variacaoGastos = gastoAnterior > 0 ? ((gastoAtual - gastoAnterior) / gastoAnterior) * 100 : 0;

    res.json({
      tarefas: { total: totalTarefas, pendentes: tarefasPendentes, emAndamento: tarefasEmAndamento, concluidas: tarefasConcluidas },
      financeiro: { chamadosMes: totalChamadosMes, gastosMes: gastoAtual, gastosMesPassado: gastoAnterior, variacaoPercent: variacaoGastos.toFixed(1), mauUso: chamadosMauUso },
      fornecedores: { total: totalFornecedores },
      estoque: { pecasBaixoEstoque },
      contexto: { 
        unidade: req.user.unidade,
        regiao: req.user.regiao
      }
    });
  } catch (err) { next(err); }
};

const gastosPorSegmento = async (req, res, next) => {
  try {
    const { mes, ano, regiao, unidade } = req.query;
    const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anoNum = ano ? parseInt(ano) : new Date().getFullYear();
    
    const dataInicio = new Date(anoNum, mesNum - 1, 1);
    const dataFim = new Date(anoNum, mesNum, 1);

    const filter = getAccessFilter(req.user);
    const where = { 
      ...filter,
      dataAbertura: { gte: dataInicio, lt: dataFim } 
    };
    
    // Filtros manuais (para níveis corporativos)
    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'].includes(req.user.role)) {
      if (regiao) {
        if (!canAccessRegion(req.user, regiao)) {
          return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
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

    res.json(dados.map(d => ({
      segmento: d.segmento,
      total: parseFloat(d._sum.valor || 0),
      quantidade: d._count,
    })));
  } catch (err) { next(err); }
};

const historicoMensal = async (req, res, next) => {
  try {
    const { regiao, unidade } = req.query;
    const filter = getAccessFilter(req.user);
    
    const baseWhere = { ...filter };
    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'].includes(req.user.role)) {
      if (regiao) {
        if (!canAccessRegion(req.user, regiao)) {
          return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
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
    res.json(meses);
  } catch (err) { next(err); }
};

const resumoRegional = async (req, res, next) => {
  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const regioesPermitidas = getUserRegions(req.user);

    // Obter todas as regiões únicas
    const regioesRes = await prisma.loja.findMany({
      select: { regiao: true },
      distinct: ['regiao'],
      where: { ativo: true },
      orderBy: { regiao: 'asc' },
    });
    const todasRegioes = regioesRes
      .map(r => r.regiao)
      .filter((regiao) => {
        if (['ADMINISTRADOR', 'DIRETOR', 'SUPERVISOR'].includes(req.user.role)) return true;
        return regioesPermitidas.includes(regiao);
      });

    const resumo = await Promise.all(todasRegioes.map(async (regiao) => {
      const [gastos, chamados, tarefas] = await Promise.all([
        prisma.controleChamado.aggregate({
          where: { regiao, dataAbertura: { gte: inicioMes } },
          _sum: { valor: true }
        }),
        prisma.controleChamado.count({
          where: { regiao, dataAbertura: { gte: inicioMes } }
        }),
        prisma.tarefa.count({
          where: { regiao, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } }
        })
      ]);

      return {
        regiao,
        gastosMes: parseFloat(gastos._sum.valor || 0),
        chamadosMes: chamados,
        tarefasAtivas: tarefas
      };
    }));

    res.json(resumo);
  } catch (err) { next(err); }
};

const detalheRegional = async (req, res, next) => {
  try {
    const { regiao } = req.params;
    if (!canAccessRegion(req.user, regiao)) {
      return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
    }

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [
      gastosPorSegmento,
      topEmpresasGastos,
      totalMauUso,
      resumoFinanceiro
    ] = await Promise.all([
      prisma.controleChamado.groupBy({
        by: ['segmento'],
        where: { regiao, dataAbertura: { gte: inicioMes } },
        _sum: { valor: true },
        _count: true,
        orderBy: { _sum: { valor: 'desc' } },
        take: 10
      }),
      prisma.controleChamado.groupBy({
        by: ['empresa'],
        where: { regiao, dataAbertura: { gte: inicioMes } },
        _sum: { valor: true },
        orderBy: { _sum: { valor: 'desc' } },
        take: 10
      }),
      prisma.controleChamado.aggregate({
        where: { regiao, mauUso: true, dataAbertura: { gte: inicioMes } },
        _count: true,
        _sum: { valor: true }
      }),
      prisma.controleChamado.aggregate({
        where: { regiao, dataAbertura: { gte: inicioMes } },
        _sum: { valor: true },
        _count: true
      })
    ]);

    res.json({
      regiao,
      financeiro: {
        totalGasto: parseFloat(resumoFinanceiro._sum.valor || 0),
        totalChamados: resumoFinanceiro._count,
        mauUso: {
          quantidade: totalMauUso._count,
          valor: parseFloat(totalMauUso._sum.valor || 0)
        }
      },
      segmentos: gastosPorSegmento.map(s => ({
        segmento: s.segmento,
        valor: parseFloat(s._sum.valor || 0),
        quantidade: s._count
      })),
      empresas: topEmpresasGastos.map(e => ({
        empresa: e.empresa,
        valor: parseFloat(e._sum.valor || 0)
      }))
    });
  } catch (err) { next(err); }
};

module.exports = {
  resumo,
  gastosPorSegmento,
  historicoMensal,
  resumoRegional,
  detalheRegional
};

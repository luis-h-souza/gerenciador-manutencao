// src/services/meta.service.js
const prisma = require('../utils/prisma');
const { getUserRegions, canAccessRegion } = require('../utils/access.utils');
const { invalidateDashboardCache } = require('../utils/dashboard.cache');

const ROLES_GESTAO = ['ADMINISTRADOR', 'DIRETOR', 'GERENTE'];

/**
 * Determina o filtro Prisma de escopo de acesso para MetaOrcamentaria.
 * - ADMIN/DIRETOR: sem restrição
 * - GERENTE: filtro por regiões do usuário
 * - COORDENADOR: filtro por regiões do usuário
 * - GESTOR: filtro por regiao + unidade da loja vinculada
 */
const buildScopeFilter = (user) => {
  if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) return {};

  const regioes = getUserRegions(user);

  if (user.role === 'GERENTE' || user.role === 'COORDENADOR') {
    if (!regioes.length) return { regiao: '__SEM_REGIAO__' };
    return regioes.length === 1
      ? { regiao: regioes[0] }
      : { regiao: { in: regioes } };
  }

  if (user.role === 'GESTOR') {
    const regiao  = user.loja?.regiao || null;
    const unidade = user.loja?.nome   || null;
    if (!regiao) return { regiao: '__SEM_REGIAO__' };
    // Gestor vê meta da sua loja específica OU meta regional (unidade = null)
    return {
      regiao,
      OR: [{ unidade }, { unidade: null }],
    };
  }

  return { regiao: '__ACESSO_NEGADO__' };
};

/**
 * Lista metas com filtros opcionais de regiao, unidade, ano, mes.
 * Aplica escopo automático conforme role do usuário.
 */
const listar = async (user, query) => {
  const { regiao, unidade, ano, mes, page = 1, limit = 100 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const scopeFilter = buildScopeFilter(user);

  // Se o COORDENADOR/GESTOR tentar filtrar por região fora do seu escopo, bloquear
  if (regiao && user.role === 'COORDENADOR') {
    const regioes = getUserRegions(user);
    if (!regioes.includes(regiao)) return { data: [], meta: { total: 0 } };
  }

  const where = { ...scopeFilter };

  // Sobreescreve filtro de região se passou via query E tem permissão
  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
    where.regiao = regiao;
  } else if (regiao && user.role === 'COORDENADOR') {
    where.regiao = regiao; // já validado acima
  }

  if (unidade !== undefined) {
    where.unidade = unidade === '' || unidade === 'null' ? null : unidade;
  }
  if (ano)  where.ano  = parseInt(ano);
  if (mes)  where.mes  = parseInt(mes);

  const [metas, total] = await Promise.all([
    prisma.metaOrcamentaria.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { regiao: 'asc' }, { unidade: 'asc' }],
      skip,
      take: parseInt(limit),
    }),
    prisma.metaOrcamentaria.count({ where }),
  ]);

  return { data: metas, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

/**
 * Cria ou atualiza uma meta (upsert pelo @@unique [regiao, unidade, ano, mes]).
 * Apenas ADMIN, DIRETOR e GERENTE podem definir metas.
 */
const upsert = async (user, body) => {
  if (!ROLES_GESTAO.includes(user.role)) {
    throw { status: 403, error: 'Acesso negado', message: 'Apenas Diretores e Gerentes podem definir metas orçamentárias.' };
  }

  const { regiao, unidade = null, ano, mes, valorMeta } = body;

  if (!regiao || !ano || !mes || valorMeta === undefined || valorMeta === null) {
    throw { status: 400, error: 'Dados inválidos', message: 'Informe região, ano, mês e valor da meta.' };
  }

  const anoNum  = parseInt(ano);
  const mesNum  = parseInt(mes);
  const valor   = parseFloat(valorMeta);

  if (mesNum < 1 || mesNum > 12) {
    throw { status: 400, error: 'Dados inválidos', message: 'Mês inválido. Use de 1 a 12.' };
  }
  if (valor < 0) {
    throw { status: 400, error: 'Dados inválidos', message: 'O valor da meta não pode ser negativo.' };
  }

  // Upsert usando o unique constraint: [regiao, unidade, ano, mes]
  const meta = await prisma.metaOrcamentaria.upsert({
    where: {
      meta_unica: {
        regiao,
        unidade: unidade || null,
        ano: anoNum,
        mes: mesNum,
      },
    },
    update: { valorMeta: valor },
    create: { regiao, unidade: unidade || null, ano: anoNum, mes: mesNum, valorMeta: valor },
  });

  await invalidateDashboardCache().catch(() => {});

  return meta;
};

/**
 * Remove uma meta pelo ID.
 * Apenas ADMIN, DIRETOR e GERENTE podem remover metas.
 */
const remover = async (user, id) => {
  if (!ROLES_GESTAO.includes(user.role)) {
    throw { status: 403, error: 'Acesso negado', message: 'Apenas Diretores e Gerentes podem remover metas.' };
  }

  const meta = await prisma.metaOrcamentaria.findUnique({ where: { id } });
  if (!meta) throw { status: 404, error: 'Não encontrado', message: 'Meta não encontrada.' };

  await prisma.metaOrcamentaria.delete({ where: { id } });
  await invalidateDashboardCache().catch(() => {});
  return { id };
};

/**
 * Helper interno: busca a meta vigente para um período e escopo.
 * Prioridade: meta de loja específica > meta regional (unidade = null).
 */
const buscarMetaVigente = async (regiao, unidade, ano, mes) => {
  if (!regiao || !ano || !mes) return null;

  // Tenta primeiro meta específica de loja
  if (unidade) {
    const metaLoja = await prisma.metaOrcamentaria.findUnique({
      where: { meta_unica: { regiao, unidade, ano, mes } },
    });
    if (metaLoja) return metaLoja;
  }

  // Fallback: meta regional (sem unidade específica)
  const metaRegional = await prisma.metaOrcamentaria.findUnique({
    where: { meta_unica: { regiao, unidade: null, ano, mes } },
  });

  return metaRegional || null;
};

/**
 * Retorna cards de situação (gasto real vs meta) agrupados por regional ou loja.
 * Usado pela página de Metas Orçamentárias para exibir os cards visuais.
 */
const cardsStatus = async (user, query) => {
  const { regiao, ano, mes } = query;
  const agora  = new Date();
  const anoNum = ano ? parseInt(ano) : agora.getFullYear();
  const mesNum = mes ? parseInt(mes) : agora.getMonth() + 1;

  const inicioMes = new Date(anoNum, mesNum - 1, 1);
  const fimMes    = new Date(anoNum, mesNum, 1);

  // ── Gestor: card único da sua loja ─────────────────────────────────────────
  if (user.role === 'GESTOR') {
    const lojaRegiao  = user.loja?.regiao || null;
    const lojaUnidade = user.loja?.nome   || null;

    const [gastoAgg, meta] = await Promise.all([
      prisma.controleChamado.aggregate({
        _sum: { valor: true },
        where: {
          loja: { regiao: lojaRegiao, nome: lojaUnidade },
          dataDeteccao: { gte: inicioMes, lt: fimMes },
          status: { not: 'CANCELADO' },
        },
      }),
      buscarMetaVigente(lojaRegiao, lojaUnidade, anoNum, mesNum),
    ]);

    const gastoReal  = Number(gastoAgg._sum.valor || 0);
    const valorMeta  = meta ? Number(meta.valorMeta) : null;
    const percentual = valorMeta ? Math.round((gastoReal / valorMeta) * 100) : null;
    const status     = calcularStatus(percentual);

    return [{
      tipo: 'LOJA',
      regiao: lojaRegiao,
      unidade: lojaUnidade,
      gastoReal,
      valorMeta,
      percentual,
      status,
      semMeta: !meta,
    }];
  }

  // ── Coordenador / Gerente / Admin / Diretor: cards por regional ────────────
  const regioesFiltradas = await resolverRegioes(user, regiao);

  if (regiao) {
    // Nível 2: detalhe por loja dentro da regional
    return await cardsDetalheLoja(user, regiao, regioesFiltradas, anoNum, mesNum, inicioMes, fimMes);
  }

  // Nível 1: um card por regional
  return await cardsNivelRegional(regioesFiltradas, anoNum, mesNum, inicioMes, fimMes);
};

// ── Helpers internos ──────────────────────────────────────────────────────────

const calcularStatus = (percentual) => {
  if (percentual === null) return 'SEM_META';
  if (percentual <= 90)   return 'VERDE';
  if (percentual <= 110)  return 'AMARELO';
  return 'VERMELHO';
};

const resolverRegioes = async (user, regiaoFiltro) => {
  if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
    if (regiaoFiltro) return [regiaoFiltro];
    // Busca todas as regiões existentes no banco
    const resultado = await prisma.loja.findMany({
      where: { ativo: true },
      select: { regiao: true },
      distinct: ['regiao'],
      orderBy: { regiao: 'asc' },
    });
    return resultado.map(r => r.regiao);
  }

  if (user.role === 'COORDENADOR') {
    const regioesPermitidas = getUserRegions(user);
    if (regiaoFiltro) {
      return regioesPermitidas.includes(regiaoFiltro) ? [regiaoFiltro] : [];
    }
    return regioesPermitidas;
  }

  return [];
};

const cardsNivelRegional = async (regioes, ano, mes, inicioMes, fimMes) => {
  const cards = await Promise.all(regioes.map(async (regiao) => {
    const [gastoAgg, meta] = await Promise.all([
      prisma.controleChamado.aggregate({
        _sum: { valor: true },
        where: {
          loja: { regiao },
          dataDeteccao: { gte: inicioMes, lt: fimMes },
          status: { not: 'CANCELADO' },
        },
      }),
      buscarMetaVigente(regiao, null, ano, mes),
    ]);

    const gastoReal  = Number(gastoAgg._sum.valor || 0);
    const valorMeta  = meta ? Number(meta.valorMeta) : null;
    const percentual = valorMeta ? Math.round((gastoReal / valorMeta) * 100) : null;
    const status     = calcularStatus(percentual);

    return { tipo: 'REGIONAL', regiao, unidade: null, gastoReal, valorMeta, percentual, status, semMeta: !meta };
  }));

  return cards;
};

const cardsDetalheLoja = async (user, regiao, regioesPermitidas, ano, mes, inicioMes, fimMes) => {
  if (!regioesPermitidas.includes(regiao)) return [];

  const lojas = await prisma.loja.findMany({
    where: { regiao, ativo: true },
    select: { id: true, nome: true, numero: true, regiao: true },
    orderBy: { numero: 'asc' },
  });

  const cards = await Promise.all(lojas.map(async (loja) => {
    const [gastoAgg, meta] = await Promise.all([
      prisma.controleChamado.aggregate({
        _sum: { valor: true },
        where: {
          lojaId: loja.id,
          dataDeteccao: { gte: inicioMes, lt: fimMes },
          status: { not: 'CANCELADO' },
        },
      }),
      buscarMetaVigente(regiao, loja.nome, ano, mes),
    ]);

    const gastoReal  = Number(gastoAgg._sum.valor || 0);
    const valorMeta  = meta ? Number(meta.valorMeta) : null;
    const percentual = valorMeta ? Math.round((gastoReal / valorMeta) * 100) : null;
    const status     = calcularStatus(percentual);

    return {
      tipo: 'LOJA',
      regiao,
      unidade: loja.nome,
      lojaNumero: loja.numero,
      lojaId: loja.id,
      gastoReal,
      valorMeta,
      percentual,
      status,
      semMeta: !meta,
    };
  }));

  return cards;
};

module.exports = { listar, upsert, remover, buscarMetaVigente, cardsStatus };

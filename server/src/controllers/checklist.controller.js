// src/controllers/checklist.controller.js
const prisma = require('../utils/prisma');
const { getWeek, getYear } = require('date-fns');
const { getAccessFilter, canAccessRegion } = require('../utils/access.utils');

// ─── Utilitário: semana atual ────────────────────────────────────────────────
const semanaAtual = () => {
  const now = new Date();
  return { semana: getWeek(now, { weekStartsOn: 1 }), ano: getYear(now) };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  EQUIPAMENTO
// ═══════════════════════════════════════════════════════════════════════════════

const listarEquipamentos = async (req, res, next) => {
  try {
    const { semana, ano, regiao, unidade, criadoPorId } = req.query;
    const where = { ...getAccessFilter(req.user) };
    if (semana) where.semana = parseInt(semana);
    if (ano)    where.ano    = parseInt(ano);
    if (criadoPorId) where.criadoPorId = criadoPorId;
    
    // Filtros administrativos (Corporativo)
    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(req.user.role)) {
      if (regiao) {
        if (!canAccessRegion(req.user, regiao)) {
          return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
        }
        where.regiao = regiao;
      }
      if (unidade) where.unidade = unidade;
    }

    const checklists = await prisma.checklistEquipamento.findMany({
      where,
      include: {
        itens: { orderBy: { tipoEquipamento: 'asc' } },
        criadoPor: { select: { id: true, nome: true, regiao: true, loja: { select: { nome: true } } } },
      },
      orderBy: [{ ano: 'desc' }, { semana: 'desc' }],
      take: 50,
    });
    res.json(checklists);
  } catch (err) { next(err); }
};

const buscarEquipamentoPorSemana = async (req, res, next) => {
  try {
    const { semana, ano, regiao, unidade, criadoPorId } = req.query;
    const s = parseInt(semana) || semanaAtual().semana;
    const a = parseInt(ano)    || semanaAtual().ano;
    const where = { semana: s, ano: a, ...getAccessFilter(req.user) };

    if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(req.user.role)) {
      if (!canAccessRegion(req.user, regiao)) {
        return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
      }
      where.regiao = regiao;
    }
    if (unidade) where.unidade = unidade;
    if (!unidade && req.user.role === 'GESTOR') where.unidade = req.user.loja?.nome;
    if (criadoPorId) where.criadoPorId = criadoPorId;

    const checklist = await prisma.checklistEquipamento.findFirst({
      where,
      include: { itens: true, criadoPor: { select: { id: true, nome: true } } },
    });
    res.json(checklist || null);
  } catch (err) { next(err); }
};

const salvarEquipamento = async (req, res, next) => {
  try {
    const { semana, ano, itens, observacoes } = req.body;
    const { regiao, unidade } = req.user;

    if (!unidade) return res.status(400).json({ error: 'Usuário sem unidade (loja) definida' });

    const checklist = await prisma.checklistEquipamento.upsert({
      where: { semana_ano_unidade: { semana: parseInt(semana), ano: parseInt(ano), unidade } },
      create: {
        semana: parseInt(semana),
        ano: parseInt(ano),
        regiao,
        unidade,
        observacoes,
        criadoPorId: req.user.id,
        itens: { create: itens.map(mapItemEquipamento) },
      },
      update: {
        observacoes,
        criadoPorId: req.user.id,
        itens: {
          deleteMany: {},
          create: itens.map(mapItemEquipamento),
        },
      },
      include: { itens: true },
    });
    res.json(checklist);
  } catch (err) { next(err); }
};

const mapItemEquipamento = (item) => ({
  tipoEquipamento: item.tipoEquipamento,
  operacional:     item.operacional ?? true,
  quantidade:      parseInt(item.quantidade) || 1,
  quantidadeQuebrada: parseInt(item.quantidadeQuebrada) || 0,
  numeroSerie:     item.numeroSerie || null,
  numeroChamado:   item.numeroChamado || null,
  descricaoProblema: item.descricaoProblema || null,
  valor:           item.valor ? parseFloat(item.valor) : null,
});

const kpiEquipamentos = async (req, res, next) => {
  try {
    const { semana, ano } = semanaAtual();
    const where = { semana, ano, ...getAccessFilter(req.user) };

    const checklists = await prisma.checklistEquipamento.findMany({
      where,
      include: { itens: true },
    });

    const totalQuebrados = checklists.reduce(
      (s, c) => s + c.itens.filter(i => !i.operacional).length, 0
    );
    
    res.json({ semana, ano, totalQuebrados, totalChecklists: checklists.length });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CARRINHO & FROTA
// ═══════════════════════════════════════════════════════════════════════════════

const buscarFrota = async (req, res, next) => {
  try {
    const unidade = req.user.role === 'GESTOR' ? req.user.loja?.nome : req.query.unidade;
    if (!unidade) return res.status(400).json({ error: 'Unidade não especificada' });

    if (['COORDENADOR', 'GERENTE', 'TECNICO'].includes(req.user.role)) {
      const loja = await prisma.loja.findFirst({ where: { nome: unidade, ativo: true } });
      if (!loja || !canAccessRegion(req.user, loja.regiao)) {
        return res.status(403).json({ error: 'Acesso negado: unidade fora da sua abrangência' });
      }
    }

    const frota = await prisma.frotaCarrinho.findMany({
      where: { unidade }
    });
    res.json(frota);
  } catch (err) { next(err); }
};

const salvarFrota = async (req, res, next) => {
  try {
    const { itens } = req.body; // Array de { tipoCarrinho, total }
    const { unidade } = req.user;

    if (!unidade) return res.status(400).json({ error: 'Usuário sem unidade definida' });

    const promises = itens.map(item => 
      prisma.frotaCarrinho.upsert({
        where: { unidade_tipoCarrinho: { unidade, tipoCarrinho: item.tipoCarrinho } },
        create: { unidade, tipoCarrinho: item.tipoCarrinho, total: parseInt(item.total) || 0 },
        update: { total: parseInt(item.total) || 0 }
      })
    );

    await Promise.all(promises);
    res.json({ message: 'Frota atualizada com sucesso' });
  } catch (err) { next(err); }
};

const listarCarrinhos = async (req, res, next) => {
  try {
    const { semana, ano, regiao, unidade, criadoPorId } = req.query;
    const where = { ...getAccessFilter(req.user) };
    if (semana) where.semana = parseInt(semana);
    if (ano)    where.ano    = parseInt(ano);
    if (criadoPorId) where.criadoPorId = criadoPorId;
    
    if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(req.user.role)) {
      if (regiao) {
        if (!canAccessRegion(req.user, regiao)) {
          return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
        }
        where.regiao = regiao;
      }
      if (unidade) where.unidade = unidade;
    }

    const checklists = await prisma.checklistCarrinho.findMany({
      where,
      include: {
        itens: { orderBy: { tipoCarrinho: 'asc' } },
        criadoPor: { select: { id: true, nome: true, regiao: true, loja: { select: { nome: true } } } },
      },
      orderBy: [{ ano: 'desc' }, { semana: 'desc' }],
      take: 50,
    });
    res.json(checklists);
  } catch (err) { next(err); }
};

const buscarCarrinhoPorSemana = async (req, res, next) => {
  try {
    const { semana, ano, regiao, unidade, criadoPorId } = req.query;
    const s = parseInt(semana) || semanaAtual().semana;
    const a = parseInt(ano)    || semanaAtual().ano;
    const where = { semana: s, ano: a, ...getAccessFilter(req.user) };

    if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(req.user.role)) {
      if (!canAccessRegion(req.user, regiao)) {
        return res.status(403).json({ error: 'Acesso negado: região fora da sua abrangência' });
      }
      where.regiao = regiao;
    }
    if (unidade) where.unidade = unidade;
    if (!unidade && req.user.role === 'GESTOR') where.unidade = req.user.loja?.nome;
    if (criadoPorId) where.criadoPorId = criadoPorId;

    const checklist = await prisma.checklistCarrinho.findFirst({
      where,
      include: { itens: true, criadoPor: { select: { id: true, nome: true } } },
    });
    res.json(checklist || null);
  } catch (err) { next(err); }
};

const salvarCarrinho = async (req, res, next) => {
  try {
    const { semana, ano, itens, observacoes } = req.body;
    const { regiao, unidade } = req.user;

    if (!unidade) return res.status(400).json({ error: 'Usuário sem unidade definida' });

    // Buscar a frota atual para garantir que os totais estejam corretos
    const frota = await prisma.frotaCarrinho.findMany({ where: { unidade } });

    const itensComTotal = itens.map(item => {
      const frotaItem = frota.find(f => f.tipoCarrinho === item.tipoCarrinho);
      return {
        ...item,
        total: frotaItem ? frotaItem.total : (parseInt(item.total) || 0)
      };
    });

    const checklist = await prisma.checklistCarrinho.upsert({
      where: { semana_ano_unidade: { semana: parseInt(semana), ano: parseInt(ano), unidade } },
      create: {
        semana: parseInt(semana),
        ano: parseInt(ano),
        regiao,
        unidade,
        observacoes,
        criadoPorId: req.user.id,
        itens: { create: itensComTotal.map(mapItemCarrinho) },
      },
      update: {
        observacoes,
        criadoPorId: req.user.id,
        itens: {
          deleteMany: {},
          create: itensComTotal.map(mapItemCarrinho),
        },
      },
      include: { itens: true },
    });
    res.json(checklist);
  } catch (err) { next(err); }
};

const mapItemCarrinho = (item) => ({
  tipoCarrinho:     item.tipoCarrinho,
  total:            parseInt(item.total) || 0,
  quebrados:        parseInt(item.quebrados) || 0,
  numeroChamado:    item.numeroChamado || null,
  descricaoProblema: item.descricaoProblema || null,
});

const kpiCarrinhos = async (req, res, next) => {
  try {
    const { semana, ano } = semanaAtual();
    const where = { semana, ano, ...getAccessFilter(req.user) };

    const checklists = await prisma.checklistCarrinho.findMany({
      where,
      include: { itens: true },
    });

    const totalQuebrados = checklists.reduce(
      (s, c) => s + c.itens.reduce((si, i) => si + i.quebrados, 0), 0
    );
    const porUnidade = checklists.map(c => ({
      unidade: c.unidade,
      totalCarrinhos: c.itens.reduce((s, i) => s + i.total, 0),
      carrinhoQuebrados: c.itens.reduce((s, i) => s + i.quebrados, 0),
    }));

    res.json({ semana, ano, totalQuebrados, porUnidade });
  } catch (err) { next(err); }
};

// ─── KPI Mensal (Dashboard) ─────────────────────────────────────────────────
const kpiMensal = async (req, res, next) => {
  try {
    const agora = new Date();
    const qMes = req.query.mes ? parseInt(req.query.mes) : agora.getMonth() + 1;
    const qAno = req.query.ano ? parseInt(req.query.ano) : agora.getFullYear();
    const { usuarioId } = req.query;

    const { getWeek, startOfMonth, endOfMonth } = require('date-fns');
    const inicioMes = startOfMonth(new Date(qAno, qMes - 1));
    const fimMes    = endOfMonth(new Date(qAno, qMes - 1));
    const semanaInicio = getWeek(inicioMes, { weekStartsOn: 1 });
    const semanaFim    = getWeek(fimMes,    { weekStartsOn: 1 });

    const baseFilter = getAccessFilter(req.user);
    if (usuarioId) {
      baseFilter.criadoPorId = usuarioId;
    }

    const whereEquip = {
      ano: qAno,
      semana: { gte: semanaInicio, lte: semanaFim },
      ...baseFilter,
    };
    const whereCarrinho = { ...whereEquip };

    const [checklistsEquip, checklistsCarrinho] = await Promise.all([
      prisma.checklistEquipamento.findMany({
        where: whereEquip,
        include: { itens: { where: { operacional: false } } },
        orderBy: { semana: 'desc' },
      }),
      prisma.checklistCarrinho.findMany({
        where: whereCarrinho,
        include: { itens: true },
        orderBy: { semana: 'desc' },
      }),
    ]);

    const totalEquipParados = checklistsEquip.reduce((s, c) => s + c.itens.length, 0);
    const equipPorTipo = {};
    checklistsEquip.forEach(c => {
      c.itens.forEach(i => {
        equipPorTipo[i.tipoEquipamento] = (equipPorTipo[i.tipoEquipamento] || 0) + (i.quantidadeQuebrada || 1);
      });
    });

    const totalCarrinhosQuebrados = checklistsCarrinho.reduce(
      (s, c) => s + c.itens.reduce((si, i) => si + i.quebrados, 0), 0
    );
    const totalCarrinhos = checklistsCarrinho.reduce(
      (s, c) => s + c.itens.reduce((si, i) => si + i.total, 0), 0
    );

    const semanasPreenchidasEquip    = [...new Set(checklistsEquip.map(c => c.semana))].length;
    const semanasPreenchidasCarrinho = [...new Set(checklistsCarrinho.map(c => c.semana))].length;
    const totalSemanasNoMes = semanaFim - semanaInicio + 1;

    res.json({
      mes: qMes, ano: qAno,
      equipamentos: {
        totalParados: totalEquipParados,
        porTipo: equipPorTipo,
        semanasPrenchidas: semanasPreenchidasEquip,
        totalSemanasNoMes,
      },
      carrinhos: {
        totalQuebrados: totalCarrinhosQuebrados,
        totalGeral: totalCarrinhos,
        taxaQuebra: totalCarrinhos > 0 ? ((totalCarrinhosQuebrados / totalCarrinhos) * 100).toFixed(1) : 0,
        semanasPrenchidas: semanasPreenchidasCarrinho,
        totalSemanasNoMes,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  listarEquipamentos, buscarEquipamentoPorSemana, salvarEquipamento, kpiEquipamentos,
  listarCarrinhos,    buscarCarrinhoPorSemana,    salvarCarrinho,    kpiCarrinhos,
  buscarFrota, salvarFrota,
  kpiMensal,
};

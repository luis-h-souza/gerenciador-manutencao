const prisma = require('../utils/prisma');
const { getWeek, getYear } = require('date-fns');
const { getAccessFilter, canAccessRegion } = require('../utils/access.utils');
const logService = require('./log.service');

const semanaAtual = () => {
  const now = new Date();
  return { semana: getWeek(now, { weekStartsOn: 5 }), ano: getYear(now) };
};

const normalizarTexto = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/^_+|_+$/g, '')
  .toUpperCase();

const resolverTipoCarrinhoAtivo = (ativo) => {
  const aliases = {
    MARIA_GORDA: 'MARIA_GORDA',
    SUPERCAR: 'SUPERCAR',
    DOIS_ANDARES: 'DOIS_ANDARES',
    CARRINHO_DOIS_ANDARES: 'DOIS_ANDARES',
    DOIS_ANDAR: 'DOIS_ANDARES',
    PRANCHA: 'PRANCHA',
    PRANCHA_PERECIVEIS: 'PRANCHA_PERECIVEIS',
    PRANCHA_PERECIVEL: 'PRANCHA_PERECIVEIS',
    CARRINHO_ABASTECIMENTO: 'CARRINHO_ABASTECIMENTO',
    CARRINHO_DE_ABASTECIMENTO: 'CARRINHO_ABASTECIMENTO',
    ABASTECIMENTO: 'CARRINHO_ABASTECIMENTO',
    ESCADA: 'ESCADA',
    BEBE_CONFORTO: 'BEBE_CONFORTO',
    BEBE: 'BEBE_CONFORTO',
    CONFORTO: 'BEBE_CONFORTO',
    CARRINHO_BEBE: 'BEBE_CONFORTO',
    CARRINHO_MOTORIZADO: 'CARRINHO_MOTORIZADO',
    MOTORIZADO: 'CARRINHO_MOTORIZADO',
    ESCADA_ABASTECIMENTO: 'ESCADA_ABASTECIMENTO',
    ESCADA_DE_ABASTECIMENTO: 'ESCADA_ABASTECIMENTO',
  };

  const candidatos = [ativo.tipo, ativo.nome].map(normalizarTexto);
  for (const candidato of candidatos) {
    if (aliases[candidato]) return aliases[candidato];
  }

  return null;
};

const subtrairDias = (data, dias) => new Date(data.getTime() - dias * 24 * 60 * 60 * 1000);

const verificarReincidenciaAtivo = async (ativoId, descricao, dataDeteccao) => {
  const where = {
    ativoId,
    dataDeteccao: {
      gte: subtrairDias(dataDeteccao, 90),
      lt: dataDeteccao,
    },
  };

  if (descricao) {
    where.descricao = { equals: descricao, mode: 'insensitive' };
  }

  const falhaAnterior = await prisma.registroFalhaAtivo.findFirst({
    where,
    select: { id: true },
    orderBy: { dataDeteccao: 'desc' },
  });

  return Boolean(falhaAnterior);
};

const buscarFrotaCarrinhosPorAtivos = async (unidade) => {
  const ativos = await prisma.ativoLoja.findMany({
    where: {
      unidade,
      ativo: true,
      status: 'ATIVO',
      categoria: { contains: 'Carrinho', mode: 'insensitive' },
    },
  });

  const porTipo = {};
  ativos.forEach((ativo) => {
    const tipoCarrinho = resolverTipoCarrinhoAtivo(ativo);
    if (!tipoCarrinho) return;
    porTipo[tipoCarrinho] = (porTipo[tipoCarrinho] || 0) + (parseInt(ativo.quantidade) || 0);
  });

  return Object.entries(porTipo).map(([tipoCarrinho, total]) => ({ tipoCarrinho, total }));
};

const listarEquipamentos = async (user, query) => {
  const { semana, ano, regiao, unidade, criadoPorId } = query;
  const where = { ...getAccessFilter(user) };
  if (semana) where.semana = parseInt(semana);
  if (ano)    where.ano    = parseInt(ano);
  if (criadoPorId) where.criadoPorId = criadoPorId;

  if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(user.role)) {
    if (regiao) {
      if (!canAccessRegion(user, regiao)) {
        throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
      }
      where.regiao = regiao;
    }
    if (unidade) where.unidade = unidade;
  }

  return prisma.checklistEquipamento.findMany({
    where,
    include: {
      itens: { orderBy: { tipoEquipamento: 'asc' } },
      criadoPor: { select: { id: true, nome: true, regiao: true, loja: { select: { nome: true } } } },
    },
    orderBy: [{ ano: 'desc' }, { semana: 'desc' }],
    take: 50,
  });
};

const buscarEquipamentoPorSemana = async (user, query) => {
  const { semana, ano, regiao, unidade, criadoPorId } = query;
  const s = parseInt(semana) || semanaAtual().semana;
  const a = parseInt(ano)    || semanaAtual().ano;
  const where = { semana: s, ano: a, ...getAccessFilter(user) };

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    if (!canAccessRegion(user, regiao)) {
      throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
    }
    where.regiao = regiao;
  }
  if (unidade) where.unidade = unidade;
  if (!unidade && user.role === 'GESTOR') where.unidade = user.loja?.nome;
  if (criadoPorId) where.criadoPorId = criadoPorId;

  return prisma.checklistEquipamento.findFirst({
    where,
    include: { itens: true, criadoPor: { select: { id: true, nome: true } } },
  });
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
  ativoId:         item.ativoId || null,
});

const salvarEquipamento = async (user, body) => {
  const { semana, ano, itens, observacoes } = body;
  const { regiao, unidade } = user;

  if (!unidade) throw { status: 400, error: 'Usuário sem unidade (loja) definida' };

  const saved = await prisma.checklistEquipamento.upsert({
    where: { semana_ano_unidade: { semana: parseInt(semana), ano: parseInt(ano), unidade } },
    create: {
      semana: parseInt(semana),
      ano: parseInt(ano),
      regiao,
      unidade,
      observacoes,
      criadoPorId: user.id,
      itens: { create: itens.map(mapItemEquipamento) },
    },
    update: {
      observacoes,
      criadoPorId: user.id,
      itens: {
        deleteMany: {},
        create: itens.map(mapItemEquipamento),
      },
    },
    include: { itens: true },
  });

  // Integração com RegistroFalhaAtivo (Fase 3)
  for (const item of saved.itens) {
    if (item.ativoId) {
      if (!item.operacional) {
        // Verifica se já tem uma falha aberta para este ativo
        const falhaAberta = await prisma.registroFalhaAtivo.findFirst({
          where: { ativoId: item.ativoId, dataResolucao: null },
        });
        if (!falhaAberta) {
          const dataDeteccao = new Date();
          const descricao = item.descricaoProblema || 'Falha detectada via checklist';
          const reincidencia = await verificarReincidenciaAtivo(item.ativoId, descricao, dataDeteccao);

          // Cria nova falha
          await prisma.registroFalhaAtivo.create({
            data: {
              ativoId: item.ativoId,
              dataDeteccao,
              descricao,
              reincidencia,
              chamadoId: null, // Pode ser vinculado futuramente se houver chamado aberto
            },
          });
        }
      } else {
        // Se voltou a ficar operacional, fecha a falha em aberto
        const falhasAbertas = await prisma.registroFalhaAtivo.findMany({
          where: { ativoId: item.ativoId, dataResolucao: null },
        });
        for (const falha of falhasAbertas) {
          await prisma.registroFalhaAtivo.update({
            where: { id: falha.id },
            data: {
              dataResolucao: new Date(),
              origemResolucao: 'CHECKLIST',
            },
          });
        }
      }
    }
  }

  // Auditoria: Registro de Checklist de Equipamento
  await logService.registrar({
    usuarioId: user.id,
    acao: 'SALVAR_CHECKLIST_EQUIPAMENTO',
    modulo: 'CHECKLIST',
    detalhes: { semana: parseInt(semana), ano: parseInt(ano), unidade }
  });

  return saved;
};

const kpiEquipamentos = async (user) => {
  const { semana, ano } = semanaAtual();
  const where = { semana, ano, ...getAccessFilter(user) };

  const checklists = await prisma.checklistEquipamento.findMany({
    where,
    include: { itens: true },
  });

  const totalQuebrados = checklists.reduce(
    (s, c) => s + c.itens.filter(i => !i.operacional).length, 0
  );

  return { semana, ano, totalQuebrados, totalChecklists: checklists.length };
};

const buscarFrota = async (user, query) => {
  const unidade = user.role === 'GESTOR' ? user.loja?.nome : query.unidade;
  if (!unidade) throw { status: 400, error: 'Unidade não especificada' };

  if (['COORDENADOR', 'GERENTE', 'TECNICO'].includes(user.role)) {
    const loja = await prisma.loja.findFirst({ where: { nome: unidade, ativo: true } });
    if (!loja || !canAccessRegion(user, loja.regiao)) {
      throw { status: 403, error: 'Acesso negado: unidade fora da sua abrangência' };
    }
  }

  return buscarFrotaCarrinhosPorAtivos(unidade);
};

const salvarFrota = async (user, itens) => {
  const { unidade } = user;
  if (!unidade) throw { status: 400, error: 'Usuário sem unidade definida' };

  const promises = itens.map(item =>
    prisma.frotaCarrinho.upsert({
      where: { unidade_tipoCarrinho: { unidade, tipoCarrinho: item.tipoCarrinho } },
      create: { unidade, tipoCarrinho: item.tipoCarrinho, total: parseInt(item.total) || 0 },
      update: { total: parseInt(item.total) || 0 }
    })
  );

  await Promise.all(promises);

  // Auditoria: Registro de Atualização de Frota
  await logService.registrar({
    usuarioId: user.id,
    acao: 'SALVAR_FROTA',
    modulo: 'CHECKLIST',
    detalhes: { unidade }
  });
};

const listarCarrinhos = async (user, query) => {
  const { semana, ano, regiao, unidade, criadoPorId } = query;
  const where = { ...getAccessFilter(user) };
  if (semana) where.semana = parseInt(semana);
  if (ano)    where.ano    = parseInt(ano);
  if (criadoPorId) where.criadoPorId = criadoPorId;

  if (['ADMINISTRADOR', 'DIRETOR', 'GERENTE',].includes(user.role)) {
    if (regiao) {
      if (!canAccessRegion(user, regiao)) {
        throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
      }
      where.regiao = regiao;
    }
    if (unidade) where.unidade = unidade;
  }

  return prisma.checklistCarrinho.findMany({
    where,
    include: {
      itens: { orderBy: { tipoCarrinho: 'asc' } },
      criadoPor: { select: { id: true, nome: true, regiao: true, loja: { select: { nome: true } } } },
    },
    orderBy: [{ ano: 'desc' }, { semana: 'desc' }],
    take: 50,
  });
};

const buscarCarrinhoPorSemana = async (user, query) => {
  const { semana, ano, regiao, unidade, criadoPorId } = query;
  const s = parseInt(semana) || semanaAtual().semana;
  const a = parseInt(ano)    || semanaAtual().ano;
  const where = { semana: s, ano: a, ...getAccessFilter(user) };

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    if (!canAccessRegion(user, regiao)) {
      throw { status: 403, error: 'Acesso negado: região fora da sua abrangência' };
    }
    where.regiao = regiao;
  }
  if (unidade) where.unidade = unidade;
  if (!unidade && user.role === 'GESTOR') where.unidade = user.loja?.nome;
  if (criadoPorId) where.criadoPorId = criadoPorId;

  return prisma.checklistCarrinho.findFirst({
    where,
    include: { itens: true, criadoPor: { select: { id: true, nome: true } } },
  });
};

const mapItemCarrinho = (item) => ({
  tipoCarrinho:     item.tipoCarrinho,
  total:            parseInt(item.total) || 0,
  quebrados:        parseInt(item.quebrados) || 0,
  numeroChamado:    item.numeroChamado || null,
  descricaoProblema: item.descricaoProblema || null,
});

const salvarCarrinho = async (user, body) => {
  const { semana, ano, itens, observacoes } = body;
  const { regiao, unidade } = user;

  if (!unidade) throw { status: 400, error: 'Usuário sem unidade definida' };

  const frota = await buscarFrotaCarrinhosPorAtivos(unidade);

  const itensComTotal = itens.map(item => {
    const frotaItem = frota.find(f => f.tipoCarrinho === item.tipoCarrinho);
    return {
      ...item,
      total: frotaItem ? frotaItem.total : (parseInt(item.total) || 0)
    };
  });

  const saved = await prisma.checklistCarrinho.upsert({
    where: { semana_ano_unidade: { semana: parseInt(semana), ano: parseInt(ano), unidade } },
    create: {
      semana: parseInt(semana),
      ano: parseInt(ano),
      regiao,
      unidade,
      observacoes,
      criadoPorId: user.id,
      itens: { create: itensComTotal.map(mapItemCarrinho) },
    },
    update: {
      observacoes,
      criadoPorId: user.id,
      itens: {
        deleteMany: {},
        create: itensComTotal.map(mapItemCarrinho),
      },
    },
    include: { itens: true },
  });

  // Auditoria: Registro de Checklist de Carrinho
  await logService.registrar({
    usuarioId: user.id,
    acao: 'SALVAR_CHECKLIST_CARRINHO',
    modulo: 'CHECKLIST',
    detalhes: { semana: parseInt(semana), ano: parseInt(ano), unidade }
  });

  return saved;
};

const kpiCarrinhos = async (user) => {
  const { semana, ano } = semanaAtual();
  const where = { semana, ano, ...getAccessFilter(user) };

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

  return { semana, ano, totalQuebrados, porUnidade };
};

const kpiMensal = async (user, query) => {
  const agora = new Date();
  const qMes = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const qAno = query.ano ? parseInt(query.ano) : agora.getFullYear();
  const weeksToShow = query.weeksToShow ? parseInt(query.weeksToShow) : 1;
  const { usuarioId } = query;

  const { getWeek, startOfMonth, endOfMonth } = require('date-fns');
  const inicioMes = startOfMonth(new Date(qAno, qMes - 1));
  const fimMes    = endOfMonth(new Date(qAno, qMes - 1));
  
  const isMesAtual = qMes === agora.getMonth() + 1 && qAno === agora.getFullYear();
  
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim    = isMesAtual 
    ? getWeek(agora, { weekStartsOn: 5 })
    : getWeek(fimMes, { weekStartsOn: 5 });

  const semanaComeco = Math.max(semanaInicio, semanaFim - weeksToShow + 1);

  const baseFilter = getAccessFilter(user);
  if (usuarioId) {
    baseFilter.criadoPorId = usuarioId;
  }

  const whereEquip = {
    ano: qAno,
    semana: { gte: semanaComeco, lte: semanaFim },
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

  const equipamentosUnicos = new Map();
  const equipPorTipo = {};

  checklistsEquip.forEach(c => {
    c.itens.forEach(i => {
      const key = `${c.unidade}-${i.tipoEquipamento}`;
      if (!equipamentosUnicos.has(key)) {
        const qtd = i.quantidadeQuebrada || 1;
        equipamentosUnicos.set(key, qtd);
        equipPorTipo[i.tipoEquipamento] = (equipPorTipo[i.tipoEquipamento] || 0) + qtd;
      }
    });
  });

  const totalEquipParados = Array.from(equipamentosUnicos.values()).reduce((a, b) => a + b, 0);

  const carrinhosUnicos = new Map();
  let totalCarrinhosQuebrados = 0;
  let totalCarrinhos = 0;

  checklistsCarrinho.forEach(c => {
    c.itens.forEach(i => {
      const key = `${c.unidade}-${i.tipoCarrinho}`;
      if (!carrinhosUnicos.has(key)) {
        carrinhosUnicos.set(key, { quebrados: i.quebrados, total: i.total });
        totalCarrinhosQuebrados += i.quebrados;
        totalCarrinhos += i.total;
      }
    });
  });

  const semanasPreenchidasEquip    = [...new Set(checklistsEquip.map(c => c.semana))].length;
  const semanasPreenchidasCarrinho = [...new Set(checklistsCarrinho.map(c => c.semana))].length;
  const totalSemanasNoMes = semanaFim - semanaInicio + 1;

  return {
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
  };
};

const getTipoEquipamentoLabel = (tipo) => {
  const labels = {
    'GELADEIRA_ELETRICA': 'Geladeira Elétrica',
    'GELADEIRA_CONVENCIONAL': 'Geladeira Convencional',
    'FREEZER_HORIZONTAL': 'Freezer Horizontal',
    'FREEZER_VERTICAL': 'Freezer Vertical',
    'BALCAO_FRIO': 'Balcão Frio',
    'TEMPERATURA_AMBIENTE': 'Temperatura Ambiente',
    'ACESSORIO_AMOSTRA': 'Acessório Amostra',
    'ACESSORIO_BALCAO': 'Acessório Balcão',
    'ACESSORIO_GELO': 'Acessório Gelo',
    'ACESSORIO_RODAS': 'Acessório Rodas',
    'GERADOR_FRIO': 'Gerador Frio',
  };
  return labels[tipo] || tipo;
};

const getTipoCarrinhoLabel = (tipo) => {
  const labels = {
    'MARIA_GORDA': 'Maria Gorda',
    'MARIA_PEQUENA': 'Maria Pequena',
    'CARRINHO_3_ANDARES': 'Carrinho 3 Andares',
    'CARRINHO_2_ANDARES': 'Carrinho 2 Andares',
    'CARRINHO_FECHADO': 'Carrinho Fechado',
    'CARRINHO_ABERTO': 'Carrinho Aberto',
    'ETIQUETADORA': 'Etiquetadora',
  };
  return labels[tipo] || tipo;
};

const consolidadoRegional = async (user, query) => {
  const agora = new Date();
  const qMes = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const qAno = query.ano ? parseInt(query.ano) : agora.getFullYear();
  const { regiao } = query;

  const { getWeek, startOfMonth, endOfMonth } = require('date-fns');
  const inicioMes = startOfMonth(new Date(qAno, qMes - 1));
  const fimMes    = endOfMonth(new Date(qAno, qMes - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });

  const baseFilter = getAccessFilter(user);
  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    const { splitRegions, expandRegionScopes } = require('../utils/access.utils');
    const requestedRegions = expandRegionScopes(splitRegions(regiao));

    if (user.role === 'GERENTE') {
      const userRegions = require('../utils/access.utils').getUserRegions(user);
      const hasAccess = requestedRegions.every(r => userRegions.includes(r));
      if (!hasAccess) {
        throw { status: 403, error: 'Acesso negado: uma ou mais regiões fora da sua abrangência' };
      }
    }

    baseFilter.regiao = requestedRegions.length > 1 ? { in: requestedRegions } : requestedRegions[0] || regiao;
  }

  const whereEquip = {
    ano: qAno,
    semana: { gte: semanaInicio, lte: semanaFim },
    ...baseFilter,
  };

  const [checklistsEquip, checklistsCarrinho, lojas] = await Promise.all([
    prisma.checklistEquipamento.findMany({
      where: whereEquip,
      include: { itens: true },
    }),
    prisma.checklistCarrinho.findMany({
      where: whereEquip,
      include: { itens: true },
    }),
    prisma.loja.findMany({
      where: { ...baseFilter, ativo: true },
    }),
  ]);

  const lojasPorUnidade = new Map();
  lojas.forEach(loja => {
    lojasPorUnidade.set(loja.nome, {
      unidade: loja.nome,
      numero: loja.numero,
      nome: loja.nome,
      regiao: loja.regiao,
      consolidado: {},
    });
  });

  checklistsEquip.forEach(c => {
    const loja = lojasPorUnidade.get(c.unidade);
    if (!loja) return;

    if (!loja.consolidado[`semana${c.semana}`]) {
      loja.consolidado[`semana${c.semana}`] = {
        equipamentos: [],
        carrinhos: [],
      };
    }

    const equipMap = new Map();
    c.itens.forEach(item => {
      if (!equipMap.has(item.tipoEquipamento)) {
        equipMap.set(item.tipoEquipamento, {
          tipo: item.tipoEquipamento,
          tipoLabel: getTipoEquipamentoLabel(item.tipoEquipamento),
          defeito: 0,
          total: 0,
        });
      }
      const equip = equipMap.get(item.tipoEquipamento);
      equip.total += item.quantidade || 1;
      equip.defeito += item.quantidadeQuebrada || 0;
    });

    loja.consolidado[`semana${c.semana}`].equipamentos = Array.from(equipMap.values()).map(e => ({
      ...e,
      percentual: e.total > 0 ? ((e.defeito / e.total) * 100).toFixed(1) : 0,
    }));
  });

  checklistsCarrinho.forEach(c => {
    const loja = lojasPorUnidade.get(c.unidade);
    if (!loja) return;

    if (!loja.consolidado[`semana${c.semana}`]) {
      loja.consolidado[`semana${c.semana}`] = {
        equipamentos: [],
        carrinhos: [],
      };
    }

    const carriMap = new Map();
    c.itens.forEach(item => {
      if (!carriMap.has(item.tipoCarrinho)) {
        carriMap.set(item.tipoCarrinho, {
          tipo: item.tipoCarrinho,
          tipoLabel: getTipoCarrinhoLabel(item.tipoCarrinho),
          quebrados: 0,
          total: 0,
        });
      }
      const carri = carriMap.get(item.tipoCarrinho);
      carri.total += item.total || 0;
      carri.quebrados += item.quebrados || 0;
    });

    loja.consolidado[`semana${c.semana}`].carrinhos = Array.from(carriMap.values()).map(c => ({
      ...c,
      percentual: c.total > 0 ? ((c.quebrados / c.total) * 100).toFixed(1) : 0,
    }));
  });

  return {
    mes: qMes,
    ano: qAno,
    regiao: baseFilter.regiao || 'Todas',
    lojas: Array.from(lojasPorUnidade.values()),
  };
};

const consolidadoLoja = async (user, query) => {
  const agora = new Date();
  const qMes = query.mes ? parseInt(query.mes) : agora.getMonth() + 1;
  const qAno = query.ano ? parseInt(query.ano) : agora.getFullYear();
  const { unidade, semana } = query;

  if (!unidade) throw { status: 400, error: 'Unidade não especificada' };

  const { getWeek, startOfMonth, endOfMonth } = require('date-fns');
  const inicioMes = startOfMonth(new Date(qAno, qMes - 1));
  const fimMes    = endOfMonth(new Date(qAno, qMes - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });

  const where = {
    ano: qAno,
    semana: semana ? { equals: parseInt(semana) } : { gte: semanaInicio, lte: semanaFim },
    unidade,
    ...getAccessFilter(user),
  };

  const [checklistsEquip, checklistsCarrinho, loja] = await Promise.all([
    prisma.checklistEquipamento.findMany({
      where,
      include: { itens: true },
      orderBy: { semana: 'asc' },
    }),
    prisma.checklistCarrinho.findMany({
      where,
      include: { itens: true },
      orderBy: { semana: 'asc' },
    }),
    prisma.loja.findFirst({ where: { nome: unidade } }),
  ]);

  const semanasMap = new Map();

  checklistsEquip.forEach(c => {
    if (!semanasMap.has(c.semana)) {
      semanasMap.set(c.semana, {
        numero: c.semana,
        label: `Semana ${c.semana}`,
        equipamentos: [],
        carrinhos: [],
        observacoes: c.observacoes,
      });
    }

    semanasMap.get(c.semana).equipamentos = c.itens;
  });

  checklistsCarrinho.forEach(c => {
    if (!semanasMap.has(c.semana)) {
      semanasMap.set(c.semana, {
        numero: c.semana,
        label: `Semana ${c.semana}`,
        equipamentos: [],
        carrinhos: [],
        observacoes: c.observacoes,
      });
    }

    semanasMap.get(c.semana).carrinhos = c.itens;
    semanasMap.get(c.semana).observacoes = c.observacoes;
  });

  return {
    mes: qMes,
    ano: qAno,
    unidade,
    nomeLoja: loja?.nome || unidade,
    semanas: Array.from(semanasMap.values()),
  };
};

module.exports = {
  listarEquipamentos, buscarEquipamentoPorSemana, salvarEquipamento, kpiEquipamentos,
  listarCarrinhos,    buscarCarrinhoPorSemana,    salvarCarrinho,    kpiCarrinhos,
  buscarFrota, salvarFrota,
  kpiMensal, consolidadoRegional, consolidadoLoja,
};

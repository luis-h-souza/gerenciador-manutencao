const prisma = require('../utils/prisma');
const { getAccessFilter, getCreationContext, getUserRegions } = require('../utils/access.utils');

const STATUS_VALIDOS = ['ATIVO', 'EM_MANUTENCAO', 'INATIVO'];
const CAMPOS_ATIVO = [
  'nome',
  'categoria',
  'tipo',
  'fabricante',
  'modelo',
  'numeroSerie',
  'patrimonio',
  'quantidade',
  'status',
  'localizacao',
  'observacoes',
  'ultimaPreventiva',
  'proximaPreventiva',
  'ultimaTrocaBateria',
  'proximaTrocaBateria',
  'intervaloPreventiva',
  'dadosTecnicos',
];

const montarDadosAtivo = (body) => {
  const data = {};

  for (const campo of CAMPOS_ATIVO) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  if (data.quantidade !== undefined) data.quantidade = parseInt(data.quantidade) || 1;
  if (data.status !== undefined) data.status = String(data.status || 'ATIVO').toUpperCase();
  for (const campo of ['tipo', 'fabricante', 'modelo', 'numeroSerie', 'patrimonio', 'localizacao', 'observacoes', 'dadosTecnicos']) {
    if (data[campo] !== undefined) data[campo] = data[campo] || null;
  }
  
  for (const dateField of ['ultimaPreventiva', 'proximaPreventiva', 'ultimaTrocaBateria', 'proximaTrocaBateria']) {
    if (data[dateField]) data[dateField] = new Date(data[dateField]);
  }
  if (data.intervaloPreventiva !== undefined) {
    data.intervaloPreventiva = data.intervaloPreventiva ? parseInt(data.intervaloPreventiva) : null;
  }

  return data;
};

const aplicarFiltrosHierarquia = (user, query, where) => {
  const { regiao, unidade } = query;

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    const podeFiltrarRegiao = ['ADMINISTRADOR', 'DIRETOR'].includes(user.role)
      || getUserRegions(user).includes(regiao);

    if (!podeFiltrarRegiao) {
      return { error: 'Acesso negado: região fora da sua abrangência' };
    }
    where.regiao = regiao;
  }

  if (unidade && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    where.unidade = unidade;
  }

  return null;
};

const listar = async (user, query) => {
  const {
    nome,
    categoria,
    tipo,
    status,
    patrimonio,
    page = 1,
    limit = 20,
    incluirInativos,
  } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ...getAccessFilter(user) };

  if (incluirInativos !== 'true') where.ativo = true;
  if (nome) where.nome = { contains: nome, mode: 'insensitive' };
  if (categoria) where.categoria = { contains: categoria, mode: 'insensitive' };
  if (tipo) where.tipo = { contains: tipo, mode: 'insensitive' };
  if (status) where.status = status;
  if (patrimonio) where.patrimonio = { contains: patrimonio, mode: 'insensitive' };

  const erroHierarquia = aplicarFiltrosHierarquia(user, query, where);
  if (erroHierarquia) throw new Error(erroHierarquia.error);

  const [ativos, total] = await Promise.all([
    prisma.ativoLoja.findMany({
      where,
      orderBy: [{ regiao: 'asc' }, { unidade: 'asc' }, { categoria: 'asc' }, { nome: 'asc' }],
      skip,
      take: parseInt(limit),
      include: { criadoPor: { select: { id: true, nome: true } } },
    }),
    prisma.ativoLoja.count({ where }),
  ]);

  return { data: ativos, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const buscarPorId = async (user, id) => {
  return prisma.ativoLoja.findFirst({
    where: { id, ...getAccessFilter(user) },
    include: { criadoPor: { select: { id: true, nome: true } } },
  });
};

const criar = async (user, body) => {
  const context = getCreationContext(user);
  if (!context.unidade || !context.regiao) {
    throw new Error('Usuário sem loja/região definida');
  }

  const data = montarDadosAtivo(body);
  if (!STATUS_VALIDOS.includes(data.status || 'ATIVO')) {
    throw new Error('Status inválido');
  }

  return prisma.ativoLoja.create({
    data: {
      ...data,
      status: data.status || 'ATIVO',
      regiao: context.regiao,
      unidade: context.unidade,
      criadoPorId: context.criadoPorId,
    },
  });
};

const atualizar = async (user, id, body) => {
  const existe = await prisma.ativoLoja.findFirst({
    where: { id, ...getAccessFilter(user), ativo: true },
  });

  if (!existe) throw new Error('Ativo não encontrado ou acesso negado');

  const data = montarDadosAtivo(body);
  if (data.status && !STATUS_VALIDOS.includes(data.status)) {
    throw new Error('Status inválido');
  }

  return prisma.ativoLoja.update({
    where: { id },
    data,
  });
};

const remover = async (user, id) => {
  const existe = await prisma.ativoLoja.findFirst({
    where: { id, ...getAccessFilter(user), ativo: true },
  });

  if (!existe) throw new Error('Ativo não encontrado ou acesso negado');

  await prisma.ativoLoja.update({
    where: { id },
    data: { ativo: false, status: 'INATIVO' },
  });
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

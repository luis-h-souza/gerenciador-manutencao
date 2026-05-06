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
];

const montarDadosAtivo = (body) => {
  const data = {};

  for (const campo of CAMPOS_ATIVO) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  if (data.quantidade !== undefined) data.quantidade = parseInt(data.quantidade) || 1;
  if (data.status !== undefined) data.status = String(data.status || 'ATIVO').toUpperCase();
  for (const campo of ['tipo', 'fabricante', 'modelo', 'numeroSerie', 'patrimonio', 'localizacao', 'observacoes']) {
    if (data[campo] !== undefined) data[campo] = data[campo] || null;
  }

  return data;
};

const aplicarFiltrosHierarquia = (req, where) => {
  const { regiao, unidade } = req.query;

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(req.user.role)) {
    const podeFiltrarRegiao = ['ADMINISTRADOR', 'DIRETOR'].includes(req.user.role)
      || getUserRegions(req.user).includes(regiao);

    if (!podeFiltrarRegiao) {
      return { error: 'Acesso negado: região fora da sua abrangência' };
    }
    where.regiao = regiao;
  }

  if (unidade && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(req.user.role)) {
    where.unidade = unidade;
  }

  return null;
};

const listar = async (req, res, next) => {
  try {
    const {
      nome,
      categoria,
      tipo,
      status,
      patrimonio,
      page = 1,
      limit = 20,
      incluirInativos,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { ...getAccessFilter(req.user) };

    if (incluirInativos !== 'true') where.ativo = true;
    if (nome) where.nome = { contains: nome, mode: 'insensitive' };
    if (categoria) where.categoria = { contains: categoria, mode: 'insensitive' };
    if (tipo) where.tipo = { contains: tipo, mode: 'insensitive' };
    if (status) where.status = status;
    if (patrimonio) where.patrimonio = { contains: patrimonio, mode: 'insensitive' };

    const erroHierarquia = aplicarFiltrosHierarquia(req, where);
    if (erroHierarquia) return res.status(403).json({ error: erroHierarquia.error });

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

    res.json({
      data: ativos,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const ativo = await prisma.ativoLoja.findFirst({
      where: { id: req.params.id, ...getAccessFilter(req.user) },
      include: { criadoPor: { select: { id: true, nome: true } } },
    });

    if (!ativo) return res.status(404).json({ error: 'Ativo não encontrado ou acesso negado' });
    res.json(ativo);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const context = getCreationContext(req.user);
    if (!context.unidade || !context.regiao) {
      return res.status(400).json({ error: 'Usuário sem loja/região definida' });
    }

    const data = montarDadosAtivo(req.body);
    if (!STATUS_VALIDOS.includes(data.status || 'ATIVO')) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const ativo = await prisma.ativoLoja.create({
      data: {
        ...data,
        status: data.status || 'ATIVO',
        regiao: context.regiao,
        unidade: context.unidade,
        criadoPorId: context.criadoPorId,
      },
    });

    res.status(201).json(ativo);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const existe = await prisma.ativoLoja.findFirst({
      where: { id: req.params.id, ...getAccessFilter(req.user), ativo: true },
    });

    if (!existe) return res.status(404).json({ error: 'Ativo não encontrado ou acesso negado' });

    const data = montarDadosAtivo(req.body);
    if (data.status && !STATUS_VALIDOS.includes(data.status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const ativo = await prisma.ativoLoja.update({
      where: { id: req.params.id },
      data,
    });

    res.json(ativo);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    const existe = await prisma.ativoLoja.findFirst({
      where: { id: req.params.id, ...getAccessFilter(req.user), ativo: true },
    });

    if (!existe) return res.status(404).json({ error: 'Ativo não encontrado ou acesso negado' });

    await prisma.ativoLoja.update({
      where: { id: req.params.id },
      data: { ativo: false, status: 'INATIVO' },
    });

    res.json({ message: 'Ativo inativado' });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };

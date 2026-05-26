const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions } = require('../utils/access.utils');
const { calcularMetricasConfiabilidade } = require('../utils/confiabilidadeAtivo');

const aplicarFiltrosHierarquia = (user, query, where) => {
  const { regiao, unidade } = query;

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    const podeFiltrarRegiao = ['ADMINISTRADOR', 'DIRETOR'].includes(user.role)
      || getUserRegions(user).includes(regiao);

    if (!podeFiltrarRegiao) {
      return { error: 'Acesso negado: região fora da sua abrangência' };
    }
    where.ativo = where.ativo || {};
    where.ativo.regiao = regiao;
  }

  if (unidade && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    where.ativo = where.ativo || {};
    where.ativo.unidade = unidade;
  }

  return null;
};

const listarFalhasPorAtivo = async (user, ativoId, query) => {
  const ativo = await prisma.ativoLoja.findFirst({
    where: { id: ativoId, ...getAccessFilter(user) },
  });

  if (!ativo) {
    throw new Error('Ativo não encontrado ou acesso negado');
  }

  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [falhas, total] = await Promise.all([
    prisma.registroFalhaAtivo.findMany({
      where: { ativoId },
      orderBy: { dataDeteccao: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        resolvidoPor: { select: { id: true, nome: true } },
      },
    }),
    prisma.registroFalhaAtivo.count({ where: { ativoId } }),
  ]);

  return { data: falhas, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const marcarResolvido = async (user, falhaId, body) => {
  const { dataResolucao } = body;
  
  const falha = await prisma.registroFalhaAtivo.findFirst({
    where: { id: falhaId },
    include: { ativo: true },
  });

  if (!falha) {
    throw new Error('Registro de falha não encontrado');
  }

  // Verificar acesso ao ativo
  const temAcesso = await prisma.ativoLoja.findFirst({
    where: { id: falha.ativoId, ...getAccessFilter(user) },
  });

  if (!temAcesso) {
    throw new Error('Acesso negado');
  }

  return prisma.registroFalhaAtivo.update({
    where: { id: falhaId },
    data: {
      dataResolucao: dataResolucao ? new Date(dataResolucao) : new Date(),
      origemResolucao: 'MANUAL',
      resolvidoPorId: user.id,
    },
  });
};

const calcularConfiabilidade = async (user, ativoId) => {
  const ativo = await prisma.ativoLoja.findFirst({
    where: { id: ativoId, ...getAccessFilter(user) },
    include: { falhas: { orderBy: { dataDeteccao: 'asc' } } }
  });

  if (!ativo) {
    throw new Error('Ativo não encontrado ou acesso negado');
  }

  const metricas = calcularMetricasConfiabilidade(ativo);

  return {
    ...metricas,
    ativoCriadoEm: ativo.criadoEm
  };
};

module.exports = {
  listarFalhasPorAtivo,
  marcarResolvido,
  calcularConfiabilidade,
};


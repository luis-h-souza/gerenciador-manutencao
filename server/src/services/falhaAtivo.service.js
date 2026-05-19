const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions } = require('../utils/access.utils');

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

  const agora = new Date();
  const tempoTotalHoras = Math.max(0, (agora - ativo.criadoEm) / (1000 * 60 * 60));

  let downtimeHoras = 0;
  let tempoReparoSoma = 0;
  let falhasResolvidas = 0;

  ativo.falhas.forEach(f => {
    const fim = f.dataResolucao ? f.dataResolucao : agora;
    const duracaoFalha = Math.max(0, (fim - f.dataDeteccao) / (1000 * 60 * 60));
    downtimeHoras += duracaoFalha;

    if (f.dataResolucao) {
      tempoReparoSoma += duracaoFalha;
      falhasResolvidas++;
    }
  });

  const uptimeHoras = Math.max(0, tempoTotalHoras - downtimeHoras);
  const totalFalhas = ativo.falhas.length;

  const mtbf = totalFalhas > 0 ? (uptimeHoras / totalFalhas) : uptimeHoras;
  const mttr = falhasResolvidas > 0 ? (tempoReparoSoma / falhasResolvidas) : 0;
  
  const uptimePercentual = tempoTotalHoras > 0 ? (uptimeHoras / tempoTotalHoras) * 100 : 100;

  return {
    mtbfHoras: mtbf.toFixed(1),
    mttrHoras: mttr.toFixed(1),
    uptimePercentual: uptimePercentual.toFixed(1),
    downtimeHoras: downtimeHoras.toFixed(1),
    totalFalhas,
    falhasResolvidas,
    ativoCriadoEm: ativo.criadoEm
  };
};

module.exports = {
  listarFalhasPorAtivo,
  marcarResolvido,
  calcularConfiabilidade,
};


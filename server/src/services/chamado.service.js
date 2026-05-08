const prisma = require('../utils/prisma');
const { getAccessFilter, getCreationContext } = require('../utils/access.utils');

const CAMPOS_CHAMADO = [
  'dataAbertura',
  'numeroChamado',
  'segmento',
  'empresa',
  'descricao',
  'regiao',
  'unidade',
  'numeroOrcamento',
  'solicitacao',
  'dataAprovacao',
  'numeroOM',
  'valor',
  'status',
  'mauUso',
];

const normalizarTextoEnum = (valor) => String(valor)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ç/gi, 'c')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/^_+|_+$/g, '')
  .toUpperCase();

const normalizarSegmento = (valor) => {
  if (!valor) return valor;

  const normalizado = normalizarTextoEnum(valor);
  const aliases = {
    AR_CONDICIONADO: 'AR_CONDICIONADO',
    ARCONDICIONADO: 'AR_CONDICIONADO',
    REFRIGERACAO_PCS: 'REFRIGERACAO_PECAS',
    REFRIGERACAO_PCAS: 'REFRIGERACAO_PECAS',
    REFRIGERACAO_PECAS: 'REFRIGERACAO_PECAS',
    ELEVADOR: 'ELEVADORES',
    PCI: 'SISTEMA_INCENDIO',
    ALUGUEL: 'LOCACAO',
    DIVERSOS: 'OUTROS',
    SERVICOS_GERAIS: 'OUTROS',
    EQUIPAMENTOS: 'OUTROS',
  };

  return aliases[normalizado] || normalizado;
};

const normalizarDataOpcional = (valor) => {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  return normalizarData(valor);
};

const normalizarData = (valor) => {
  if (typeof valor === 'string') {
    const matchDataFormulario = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchDataFormulario) {
      const [, ano, mes, dia] = matchDataFormulario;
      return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia), 12));
    }
  }

  return new Date(valor);
};

const montarDadosChamado = (body) => {
  const data = {};

  for (const campo of CAMPOS_CHAMADO) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  if (data.segmento !== undefined) data.segmento = normalizarSegmento(data.segmento);
  if (data.dataAbertura !== undefined) data.dataAbertura = normalizarData(data.dataAbertura);
  if (data.dataAprovacao !== undefined) data.dataAprovacao = normalizarDataOpcional(data.dataAprovacao);
  if (data.valor !== undefined) data.valor = data.valor === null || data.valor === '' ? null : parseFloat(data.valor);
  if (data.solicitacao !== undefined) data.solicitacao = data.solicitacao || null;
  if (data.numeroOM !== undefined) data.numeroOM = data.numeroOM || null;
  if (data.numeroOrcamento !== undefined) data.numeroOrcamento = data.numeroOrcamento || null;

  return data;
};

const listar = async (user, query) => {
  const { status, segmento, empresa, mes, ano, page = 1, limit = 20, regiao, unidade } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const filter = getAccessFilter(user);
  const where = { ...filter };

  if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user.role)) {
    const { splitRegions, expandRegionScopes } = require('../utils/access.utils');
    const requestedRegions = expandRegionScopes(splitRegions(regiao));
    
    if (['GERENTE', 'COORDENADOR'].includes(user.role)) {
      const userRegions = require('../utils/access.utils').getUserRegions(user);
      const hasAccess = requestedRegions.every(r => userRegions.includes(r));
      if (!hasAccess) {
        throw { status: 403, error: 'Acesso negado: uma ou mais regiões fora da sua abrangência' };
      }
    }
    
    where.regiao = requestedRegions.length > 1 ? { in: requestedRegions } : requestedRegions[0] || regiao;
  }

  if (unidade) {
    where.unidade = unidade;
  }
  
  if (status) where.status = status;
  if (segmento) where.segmento = segmento;
  if (empresa) where.empresa = { contains: empresa, mode: 'insensitive' };
  
  if (mes && ano) {
    const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const dataFim = new Date(parseInt(ano), parseInt(mes), 1);
    where.dataAbertura = { gte: dataInicio, lt: dataFim };
  }

  const [chamados, total] = await Promise.all([
    prisma.controleChamado.findMany({
      where, orderBy: { dataAbertura: 'desc' }, skip, take: parseInt(limit),
    }),
    prisma.controleChamado.count({ where }),
  ]);

  return { data: chamados, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } };
};

const buscarPorId = async (user, id) => {
  const filter = getAccessFilter(user);
  const chamado = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!chamado) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };
  return chamado;
};

const criar = async (user, body) => {
  const context = getCreationContext(user);
  return prisma.controleChamado.create({
    data: {
      ...montarDadosChamado(body),
      regiao: context.regiao,
      unidade: context.unidade,
    },
  });
};

const atualizar = async (user, id, body) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!existe) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };

  const data = montarDadosChamado(body);

  return prisma.controleChamado.update({ where: { id }, data });
};

const remover = async (user, id) => {
  const filter = getAccessFilter(user);
  const existe = await prisma.controleChamado.findFirst({ 
    where: { id, ...filter } 
  });
  
  if (!existe) throw { status: 404, error: 'Chamado não encontrado ou acesso negado' };

  await prisma.controleChamado.delete({ where: { id } });
};

const resumoMensal = async (user, query) => {
  const { mes, ano } = query;
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();
  
  const dataInicio = new Date(anoNum, mesNum - 1, 1);
  const dataFim = new Date(anoNum, mesNum, 1);

  const filter = getAccessFilter(user);
  const where = { ...filter, dataAbertura: { gte: dataInicio, lt: dataFim } };

  const [chamados, totaisPorSegmento, totaisPorStatus] = await Promise.all([
    prisma.controleChamado.aggregate({
      where: where,
      _sum: { valor: true },
      _count: true,
    }),
    prisma.controleChamado.groupBy({
      by: ['segmento'],
      where: where,
      _sum: { valor: true },
      _count: true,
    }),
    prisma.controleChamado.groupBy({
      by: ['status'],
      where: where,
      _count: true,
    }),
  ]);

  return {
    periodo: { mes: mesNum, ano: anoNum },
    total: { valor: chamados._sum.valor || 0, quantidade: chamados._count },
    porSegmento: totaisPorSegmento,
    porStatus: totaisPorStatus,
  };
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, resumoMensal };

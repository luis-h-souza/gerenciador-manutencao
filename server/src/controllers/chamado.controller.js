const prisma = require('../utils/prisma');
const { getAccessFilter, getCreationContext } = require('../utils/access.utils');

const listar = async (req, res, next) => {
  try {
    const { status, segmento, empresa, mes, ano, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = getAccessFilter(req.user);
    const where = { ...filter };

    const regiao = req.query.regiao;
    if (regiao && ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(req.user.role)) {
      const { splitRegions, expandRegionScopes } = require('../utils/access.utils');
      const requestedRegions = expandRegionScopes(splitRegions(regiao));
      
      if (['GERENTE', 'COORDENADOR'].includes(req.user.role)) {
        const userRegions = require('../utils/access.utils').getUserRegions(req.user);
        const hasAccess = requestedRegions.every(r => userRegions.includes(r));
        if (!hasAccess) {
          return res.status(403).json({ error: 'Acesso negado: uma ou mais regiões fora da sua abrangência' });
        }
      }
      
      where.regiao = requestedRegions.length > 1 ? { in: requestedRegions } : requestedRegions[0] || regiao;
    }

    if (req.query.unidade) {
      where.unidade = req.query.unidade;
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

    res.json({ data: chamados, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const filter = getAccessFilter(req.user);
    const chamado = await prisma.controleChamado.findFirst({ 
      where: { id: req.params.id, ...filter } 
    });
    
    if (!chamado) return res.status(404).json({ error: 'Chamado não encontrado ou acesso negado' });
    res.json(chamado);
  } catch (err) { next(err); }
};

const criar = async (req, res, next) => {
  try {
    const context = getCreationContext(req.user);
    const chamado = await prisma.controleChamado.create({
      data: {
        ...req.body,
        regiao: context.regiao,
        unidade: context.unidade,
        dataAbertura: new Date(req.body.dataAbertura),
        valor: req.body.valor ? parseFloat(req.body.valor) : null,
      },
    });
    res.status(201).json(chamado);
  } catch (err) { next(err); }
};

const atualizar = async (req, res, next) => {
  try {
    const filter = getAccessFilter(req.user);
    const existe = await prisma.controleChamado.findFirst({ 
      where: { id: req.params.id, ...filter } 
    });
    
    if (!existe) return res.status(404).json({ error: 'Chamado não encontrado ou acesso negado' });

    const data = { ...req.body };
    if (data.dataAbertura) data.dataAbertura = new Date(data.dataAbertura);
    if (data.valor !== undefined) data.valor = data.valor ? parseFloat(data.valor) : null;

    const chamado = await prisma.controleChamado.update({ where: { id: req.params.id }, data });
    res.json(chamado);
  } catch (err) { next(err); }
};

const remover = async (req, res, next) => {
  try {
    const filter = getAccessFilter(req.user);
    const existe = await prisma.controleChamado.findFirst({ 
      where: { id: req.params.id, ...filter } 
    });
    
    if (!existe) return res.status(404).json({ error: 'Chamado não encontrado ou acesso negado' });

    await prisma.controleChamado.delete({ where: { id: req.params.id } });
    res.json({ message: 'Chamado removido' });
  } catch (err) { next(err); }
};

const resumoMensal = async (req, res, next) => {
  try {
    const { mes, ano } = req.query;
    const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anoNum = ano ? parseInt(ano) : new Date().getFullYear();
    
    const dataInicio = new Date(anoNum, mesNum - 1, 1);
    const dataFim = new Date(anoNum, mesNum, 1);

    const filter = getAccessFilter(req.user);
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

    res.json({
      periodo: { mes: mesNum, ano: anoNum },
      total: { valor: chamados._sum.valor || 0, quantidade: chamados._count },
      porSegmento: totaisPorSegmento,
      porStatus: totaisPorStatus,
    });
  } catch (err) { next(err); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, resumoMensal };

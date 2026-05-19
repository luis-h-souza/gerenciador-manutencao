const prisma = require('../utils/prisma');
const { getAccessFilter, getUserRegions } = require('../utils/access.utils');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);

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
  const { tipo, mes, ano, page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { ...getAccessFilter(user) };

  // Correção para Gestor: no banco de checklists de rotina infra, unidade é armazenada como string do número da loja
  if (user.role === 'GESTOR' && user.loja?.numero) {
    where.unidade = String(user.loja.numero);
  }

  if (tipo) where.tipo = tipo;
  if (mes) where.mes = parseInt(mes);
  if (ano) where.ano = parseInt(ano);

  const erroHierarquia = aplicarFiltrosHierarquia(user, query, where);
  if (erroHierarquia) throw new Error(erroHierarquia.error);

  const [rotinas, total] = await Promise.all([
    prisma.checklistRotinaInfra.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { semana: 'desc' }],
      skip,
      take: parseInt(limit),
      include: { criadoPor: { select: { id: true, nome: true } } },
    }),
    prisma.checklistRotinaInfra.count({ where }),
  ]);

  return { data: rotinas, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
};

const resolverEscopoCriacao = (user, body) => {
  if (user.role === 'GESTOR') {
    if (!user.loja?.numero || !user.loja?.regiao) {
      throw new Error('Usuário sem loja definida para registrar rotina');
    }

    return {
      unidade: String(user.loja.numero),
      regiao: user.loja.regiao,
    };
  }

  const unidade = body.unidade ? String(body.unidade) : null;
  const regiao = body.regiao ? String(body.regiao) : null;

  if (!unidade || !regiao) {
    throw new Error('Unidade e Região são obrigatórias');
  }

  const podeFiltrarRegiao = ['ADMINISTRADOR', 'DIRETOR'].includes(user.role)
    || getUserRegions(user).includes(regiao);

  if (!podeFiltrarRegiao) {
    throw new Error('Acesso negado: região fora da sua abrangência');
  }

  return { unidade, regiao };
};

const criar = async (user, body) => {
  const { tipo, semana, mes, ano, conforme, descricao, ativoId } = body;
  const { unidade, regiao } = resolverEscopoCriacao(user, body);

  if (!conforme && !descricao) {
    throw new Error('Descrição é obrigatória quando não conforme');
  }

  const now = dayjs();
  let preenchidoComAtraso = false;
  let dataLimite;

  if (tipo === 'GERADOR_SEMANAL') {
    if (!semana) throw new Error('Semana é obrigatória para rotina de gerador');
    // Atraso se preenchido após a segunda-feira da semana correspondente
    const mondayOfRefWeek = dayjs().year(ano).isoWeek(semana).startOf('isoWeek');
    dataLimite = mondayOfRefWeek.endOf('day').toDate();
    preenchidoComAtraso = now.isAfter(mondayOfRefWeek.endOf('day'));
  } else if (tipo.startsWith('INCENDIO')) {
    // Prazo até dia 20 do mês/ano de referência
    dataLimite = dayjs(`${ano}-${String(mes).padStart(2, '0')}-20`).endOf('day').toDate();
    preenchidoComAtraso = now.isAfter(dataLimite);
  } else {
    throw new Error('Tipo de rotina inválido');
  }

  // Verifica unicidade
  const existente = await prisma.checklistRotinaInfra.findFirst({
    where: { tipo, unidade, mes, ano, semana: semana || null }
  });

  if (existente) {
    throw new Error('Já existe um registro para este período e unidade');
  }

  return prisma.checklistRotinaInfra.create({
    data: {
      tipo,
      regiao,
      unidade,
      semana: semana || null,
      mes,
      ano,
      conforme,
      descricao: descricao || null,
      ativoId: ativoId || null,
      criadoPorId: user.id,
      preenchidoComAtraso,
      dataLimite,
      preenchidoEm: now.toDate(),
    },
  });
};

const conformidadeIncendio = async (user, query) => {
  const { ano, mes, dataRef } = query;
  const where = { ...getAccessFilter(user) };
  
  const erroHierarquia = aplicarFiltrosHierarquia(user, query, where);
  if (erroHierarquia) throw new Error(erroHierarquia.error);

  const referenceDate = dataRef ? dayjs(dataRef) : dayjs();
  
  // Filtro de unidade dinâmico para evitar type mismatch com numero (Int) e nome (String)
  const filterUnidade = {};
  if (where.unidade) {
    const parsedNumero = parseInt(where.unidade, 10);
    if (!isNaN(parsedNumero) && String(parsedNumero) === String(where.unidade).trim()) {
      filterUnidade.numero = parsedNumero;
    } else {
      filterUnidade.nome = where.unidade;
    }
  }

  // Pegar todas as unidades que o usuário tem acesso
  const lojas = await prisma.loja.findMany({
    where: { 
      ativo: true,
      ...(where.regiao && { regiao: where.regiao }),
      ...filterUnidade
    },
    select: { numero: true, regiao: true }
  });

  const rotinas = await prisma.checklistRotinaInfra.findMany({
    where: {
      tipo: { in: ['INCENDIO_MENSAL_VISUAL', 'INCENDIO_BIMESTRAL_BOMBA'] },
      mes: parseInt(mes),
      ano: parseInt(ano),
      unidade: { in: lojas.map(l => String(l.numero)) }
    }
  });

  const dataLimite = dayjs(`${ano}-${String(mes).padStart(2, '0')}-20`).endOf('day');
  const isVencido = referenceDate.isAfter(dataLimite);

  return lojas.map(loja => {
    const rotina = rotinas.find(r => r.unidade === String(loja.numero));
    let status = 'PENDENTE';
    
    if (rotina) {
      status = rotina.preenchidoComAtraso ? 'CONCLUIDO_COM_ATRASO' : 'CONCLUIDO_NO_PRAZO';
    } else if (isVencido) {
      status = 'NAO_REALIZADO_VENCIDO';
    }

    return {
      unidade: String(loja.numero),
      regiao: loja.regiao,
      status,
      rotinaId: rotina?.id || null,
      preenchidoEm: rotina?.preenchidoEm || null,
      conforme: rotina?.conforme ?? null
    };
  });
};

const pendenciasGerador = async (user, query) => {
  const { dataRef } = query;
  const where = { ...getAccessFilter(user) };
  
  const erroHierarquia = aplicarFiltrosHierarquia(user, query, where);
  if (erroHierarquia) throw new Error(erroHierarquia.error);

  const referenceDate = dataRef ? dayjs(dataRef) : dayjs();
  const currentWeek = referenceDate.isoWeek();
  const currentYear = referenceDate.year();

  // Calcular as últimas 8 semanas
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const d = referenceDate.subtract(i, 'week');
    weeks.push({ week: d.isoWeek(), year: d.year() });
  }

  // Filtro de unidade dinâmico para evitar type mismatch com numero (Int) e nome (String)
  const filterUnidade = {};
  if (where.unidade) {
    const parsedNumero = parseInt(where.unidade, 10);
    if (!isNaN(parsedNumero) && String(parsedNumero) === String(where.unidade).trim()) {
      filterUnidade.numero = parsedNumero;
    } else {
      filterUnidade.nome = where.unidade;
    }
  }

  const lojas = await prisma.loja.findMany({
    where: { 
      ativo: true,
      ...(where.regiao && { regiao: where.regiao }),
      ...filterUnidade
    },
    select: { numero: true, regiao: true }
  });

  // Buscar todos os registros do gerador nas ultimas semanas
  const rotinas = await prisma.checklistRotinaInfra.findMany({
    where: {
      tipo: 'GERADOR_SEMANAL',
      unidade: { in: lojas.map(l => String(l.numero)) },
      OR: weeks.map(w => ({ semana: w.week, ano: w.year }))
    }
  });

  return lojas.map(loja => {
    const historico = weeks.map(w => {
      const rotina = rotinas.find(r => r.unidade === String(loja.numero) && r.semana === w.week && r.ano === w.year);
      let status = 'PENDENTE';
      
      const isCurrentWeek = w.week === currentWeek && w.year === currentYear;
      
      if (rotina) {
        status = rotina.preenchidoComAtraso ? 'CONCLUIDO_COM_ATRASO' : 'CONCLUIDO_NO_PRAZO';
      } else if (!isCurrentWeek || referenceDate.isAfter(referenceDate.startOf('isoWeek').endOf('day'))) {
        // Atrasado se já não é a semana atual ou já passou a segunda-feira
        status = 'PENDENTE_ATRASADO';
      } else {
        status = 'PENDENTE_ATUAL';
      }

      return {
        semana: w.week,
        ano: w.year,
        status,
        rotinaId: rotina?.id || null,
        preenchidoEm: rotina?.preenchidoEm || null,
        conforme: rotina?.conforme ?? null
      };
    });

    return {
      unidade: String(loja.numero),
      regiao: loja.regiao,
      historico
    };
  });
};

module.exports = {
  listar,
  criar,
  conformidadeIncendio,
  pendenciasGerador
};

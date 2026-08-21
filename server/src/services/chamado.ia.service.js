// src/services/chamado.ia.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../utils/prisma');
const { somenteOperacional } = require('../utils/chamadoFinanceiro');
const logger = require('../utils/logger');

/**
 * Formata valores para Moeda Brasileira (R$)
 */
const fmtBRL = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
};

/**
 * Agrega métricas financeiras detalhadas para alimentar o prompt de IA
 */
const agregarDadosFinanceiros = async ({ regiao, unidade, ano, mes }) => {
  const anoNum = ano ? parseInt(ano) : new Date().getFullYear();
  const mesNum = mes ? parseInt(mes) : new Date().getMonth() + 1;

  const dataInicio = new Date(anoNum, mesNum - 1, 1);
  const dataFim = new Date(anoNum, mesNum, 1);

  const whereBase = {
    dataAbertura: { gte: dataInicio, lt: dataFim },
  };

  if (regiao) whereBase.regiao = regiao;
  if (unidade) whereBase.unidade = unidade;

  // 1. Total Geral e Médias
  const aggTotal = await prisma.controleChamado.aggregate({
    where: whereBase,
    _sum: { valor: true },
    _avg: { valor: true },
    _count: true,
  });

  // 2. Gasto Operacional (Excluindo PCI e Laudos)
  const aggOperacional = await prisma.controleChamado.aggregate({
    where: somenteOperacional(whereBase),
    _sum: { valor: true },
    _count: true,
  });

  // 3. Mau Uso
  const aggMauUso = await prisma.controleChamado.aggregate({
    where: { ...whereBase, mauUso: true },
    _sum: { valor: true },
    _count: true,
  });

  // 4. Por Segmento
  const porSegmento = await prisma.controleChamado.groupBy({
    by: ['segmento'],
    where: whereBase,
    _sum: { valor: true },
    _count: true,
    orderBy: { _sum: { valor: 'desc' } },
  });

  // 5. Por Status
  const porStatus = await prisma.controleChamado.groupBy({
    by: ['status'],
    where: whereBase,
    _sum: { valor: true },
    _count: true,
  });

  // 6. Top Fornecedores / Empresas
  const porEmpresa = await prisma.controleChamado.groupBy({
    by: ['empresa'],
    where: whereBase,
    _sum: { valor: true },
    _count: true,
    orderBy: { _sum: { valor: 'desc' } },
    take: 8,
  });

  // 7. Se for Geral ou Regional, buscar Top Lojas
  let topLojas = [];
  if (!unidade) {
    topLojas = await prisma.controleChamado.groupBy({
      by: ['unidade', 'regiao'],
      where: whereBase,
      _sum: { valor: true },
      _count: true,
      orderBy: { _sum: { valor: 'desc' } },
      take: 8,
    });
  }

  // 8. Meta Orçamentária do Período
  let metaVigente = null;
  if (unidade && regiao) {
    metaVigente = await prisma.metaOrcamentaria.findFirst({
      where: { regiao, unidade, ano: anoNum, mes: mesNum },
    });
  } else if (regiao) {
    metaVigente = await prisma.metaOrcamentaria.findFirst({
      where: { regiao, unidade: null, ano: anoNum, mes: mesNum },
    });
  } else {
    // Meta consolidada de todas as regionais
    const todasMetas = await prisma.metaOrcamentaria.findMany({
      where: { unidade: null, ano: anoNum, mes: mesNum },
    });
    if (todasMetas.length > 0) {
      const somaMetas = todasMetas.reduce((acc, m) => acc + Number(m.valorMeta || 0), 0);
      metaVigente = { valorMeta: somaMetas, consolidada: true };
    }
  }

  return {
    periodo: { mes: mesNum, ano: anoNum },
    escopo: {
      tipo: unidade ? 'LOJA' : regiao ? 'REGIONAL' : 'GERAL',
      regiao: regiao || 'Todas as Regionais',
      unidade: unidade || 'Todas as Unidades',
    },
    totalGeral: {
      valor: Number(aggTotal._sum.valor || 0),
      quantidade: aggTotal._count || 0,
      ticketMedio: Number(aggTotal._avg.valor || 0),
    },
    operacional: {
      valor: Number(aggOperacional._sum.valor || 0),
      quantidade: aggOperacional._count || 0,
    },
    mauUso: {
      valor: Number(aggMauUso._sum.valor || 0),
      quantidade: aggMauUso._count || 0,
      percentualGasto: aggTotal._sum.valor
        ? ((Number(aggMauUso._sum.valor || 0) / Number(aggTotal._sum.valor)) * 100).toFixed(2)
        : '0.00',
    },
    meta: metaVigente
      ? {
          valorMeta: Number(metaVigente.valorMeta),
          gastoOperacional: Number(aggOperacional._sum.valor || 0),
          percentualUtilizado: (
            (Number(aggOperacional._sum.valor || 0) / Number(metaVigente.valorMeta)) * 100
          ).toFixed(1),
          saldo: Number(metaVigente.valorMeta) - Number(aggOperacional._sum.valor || 0),
        }
      : null,
    segmentos: porSegmento.map((s) => ({
      segmento: s.segmento,
      valor: Number(s._sum.valor || 0),
      quantidade: s._count,
      percentual: aggTotal._sum.valor
        ? ((Number(s._sum.valor || 0) / Number(aggTotal._sum.valor)) * 100).toFixed(1)
        : '0.0',
    })),
    status: porStatus.map((st) => ({
      status: st.status,
      quantidade: st._count,
      valor: Number(st._sum.valor || 0),
    })),
    topEmpresas: porEmpresa.map((e) => ({
      empresa: e.empresa,
      valor: Number(e._sum.valor || 0),
      quantidade: e._count,
      percentual: aggTotal._sum.valor
        ? ((Number(e._sum.valor || 0) / Number(aggTotal._sum.valor)) * 100).toFixed(1)
        : '0.0',
    })),
    topLojas: topLojas.map((l) => ({
      unidade: l.unidade,
      regiao: l.regiao,
      valor: Number(l._sum.valor || 0),
      quantidade: l._count,
    })),
  };
};

/**
 * Constrói o prompt analítico estruturado para o Gemini
 */
const construirPromptAnalise = (dados) => {
  const { escopo, periodo, totalGeral, operacional, mauUso, meta, segmentos, status, topEmpresas, topLojas } = dados;

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const nomeMes = mesesNomes[periodo.mes - 1] || `${periodo.mes}`;

  let textoMeta = 'Nenhuma meta orçamentária cadastrada para este escopo/período.';
  if (meta) {
    const statusMeta = Number(meta.percentualUtilizado) > 100 ? '🚨 ESTOURADA' : Number(meta.percentualUtilizado) > 90 ? '⚠️ ATENÇÃO' : '✅ DENTRO DA META';
    textoMeta = `
- Meta Fixada: ${fmtBRL(meta.valorMeta)}
- Gasto Operacional Realizado: ${fmtBRL(meta.gastoOperacional)}
- Percentual de Aderência/Uso: ${meta.percentualUtilizado}% (${statusMeta})
- Saldo Orçamentário: ${fmtBRL(meta.saldo)} ${meta.saldo < 0 ? '(Déficit)' : '(Superávit)'}
`;
  }

  const topSegmentosTexto = segmentos.slice(0, 7).map((s, idx) => 
    `${idx + 1}. **${s.segmento}**: ${fmtBRL(s.valor)} (${s.quantidade} chamados | ${s.percentual}% do total)`
  ).join('\n') || 'Nenhum segmento registrado.';

  const topEmpresasTexto = topEmpresas.slice(0, 5).map((e, idx) => 
    `${idx + 1}. **${e.empresa}**: ${fmtBRL(e.valor)} (${e.quantidade} chamados | ${e.percentual}% do total)`
  ).join('\n') || 'Nenhuma empresa registrada.';

  const statusTexto = status.map((st) => 
    `- **${st.status}**: ${st.quantidade} chamados (${fmtBRL(st.valor)})`
  ).join('\n') || 'Sem chamados.';

  let topLojasTexto = '';
  if (topLojas && topLojas.length > 0) {
    topLojasTexto = `\n### Unidades/Lojas com Maiores Custos:\n` + topLojas.map((l, idx) => 
      `${idx + 1}. **${l.unidade || 'Sem Nome'}** (${l.regiao}): ${fmtBRL(l.valor)} (${l.quantidade} chamados)`
    ).join('\n');
  }

  return `
Você é um Consultor Especialista Sênior em Gestão de Facilities, Engenharia de Manutenção e Controladoria Orçamentária Corporativa.
Sua missão é realizar uma análise analítica, executiva e prática dos custos de manutenção de uma rede de varejo, gerando um relatório em Markdown claro e rico em insights para o Diretor e Administradores.

---
### DADOS DE ENTRADA DO SISTEMA:
- **Escopo**: ${escopo.tipo} (Regional: ${escopo.regiao} | Loja: ${escopo.unidade})
- **Período**: ${nomeMes} de ${periodo.ano}
- **Volume Total**: ${totalGeral.quantidade} chamados registrados
- **Custo Total Bruto**: ${fmtBRL(totalGeral.valor)}
- **Ticket Médio por Chamado**: ${fmtBRL(totalGeral.ticketMedio)}
- **Custo Operacional Líquido (OPEX)**: ${fmtBRL(operacional.valor)} (${operacional.quantidade} chamados)

### Situação do Mau Uso (Danos Evitáveis):
- Quantidade: ${mauUso.quantidade} chamados
- Prejuízo Financeiro: ${fmtBRL(mauUso.valor)} (${mauUso.percentualGasto}% do custo total)

### Situação Orçamentária:
${textoMeta}

### Principais Segmentos por Custo (Pareto):
${topSegmentosTexto}

### Principais Prestadores/Fornecedores por Faturamento:
${topEmpresasTexto}

### Distribuição por Status de Chamado:
${statusTexto}
${topLojasTexto}

---
### DIRETRIZES DA SUA RESPOSTA:
Elabore o relatório estritamente em português do Brasil com a seguinte estrutura em Markdown (utilize emojis, listas, tabelas e negrito para destacar valores e conclusões):

1. 📌 **Sumário Executivo**: Uma síntese de 2 a 3 parágrafos sobre a saúde financeira do período analisado, destacando se o gasto está sob controle ou em alerta crítico.
2. 🔍 **Diagnóstico dos Principais Ofensores**:
   - Analise os 2 a 3 segmentos mais representativos (ex: Refrigeração, Ar Condicionado, Elétrica, etc.) e o impacto do ticket médio.
   - Avalie a concentração em fornecedores (risco de dependência se algum tiver mais de 35-40% do volume).
   - Avalie a gravidade do mau uso identificado.
3. 🎯 **Análise de Aderência Orçamentária**:
   - Compare o gasto realizado com a meta e destaque o desvio.
4. 💡 **Recomendações Práticas e Plano de Ação Imediato**:
   - De 3 a 5 ações corretivas/preventivas claras e prioritárias para a equipe de gestão de manutenção reduzir custos e evitar reincidências.

Mantenha um tom profissional, direto ao ponto, estratégico e fundamentado exatamente nos números fornecidos.
`.trim();
};

/**
 * Executa a chamada à API do Gemini e retorna a análise em texto Markdown
 */
const gerarAnaliseGastosIA = async ({ regiao, unidade, ano, mes }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw {
      status: 500,
      error: 'Configuração ausente',
      message: 'A chave de API do Gemini (GEMINI_API_KEY) não está configurada no servidor.',
    };
  }

  // 1. Agrega todos os dados do banco
  const dados = await agregarDadosFinanceiros({ regiao, unidade, ano, mes });

  // 2. Se não houver chamados no período
  if (dados.totalGeral.quantidade === 0) {
    return {
      analise: `### ℹ️ Sem Dados para o Período\n\nNão foram encontrados chamados registrados para o escopo **${dados.escopo.tipo}** (${dados.escopo.regiao} / ${dados.escopo.unidade}) no período **${dados.periodo.mes}/${dados.periodo.ano}**.\n\nNenhuma despesa foi lançada nesta competência.`,
      dados,
      geradoEm: new Date().toISOString(),
    };
  }

  // 3. Monta o prompt
  const prompt = construirPromptAnalise(dados);

  // 4. Chamada de alta performance à API do Google Generative Language
  // Prioriza modelos flash ultra estáveis e rápidos
  const modelosPadrao = [
    ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemma-4-26b-a4b-it',
    'gemini-pro-latest',
    'gemini-3.1-pro-preview',
  ];

  // 4.1 Tenta descobrir dinamicamente quais modelos suportam generateContent de TEXTO para essa chave
  let modelosDisponiveis = [];
  try {
    const resLista = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (resLista.ok) {
      const dataLista = await resLista.json();
      if (dataLista.models && Array.isArray(dataLista.models)) {
        modelosDisponiveis = dataLista.models
          .filter((m) => {
            const nome = (m.name || '').toLowerCase();
            const suportaGenerate = m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent');
            // Ignora modelos de imagem, áudio, embedding ou não conversacionais
            const isNaoTexto = nome.includes('-tts') || nome.includes('-audio') || nome.includes('image') || nome.includes('imagen') || nome.includes('embedding') || nome.includes('aqa') || nome.includes('clip') || nome.includes('lyria') || nome.includes('robotics');
            return suportaGenerate && !isNaoTexto;
          })
          .map((m) => m.name.replace(/^models\//, ''));
        logger.info(`Modelos de texto ativos descobertos: ${modelosDisponiveis.join(', ')}`);
      }
    }
  } catch (err) {
    logger.warn('Não foi possível listar modelos dinamicamente, usando lista padrão:', err.message);
  }

  // Prioriza modelos flash modernos descobertos ou padrão
  const listaTentativas = [
    ...modelosPadrao,
    ...modelosDisponiveis,
  ].filter((v, i, a) => a.indexOf(v) === i && Boolean(v));

  let ultimoErro = null;

  for (const modeloNome of listaTentativas) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modeloNome}:generateContent?key=${apiKey}`;

    try {
      logger.info(`Chamando Gemini [v1beta/${modeloNome}]...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        const textoGerado = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textoGerado) {
          logger.info(`Sucesso com [v1beta/${modeloNome}]!`);
          return {
            analise: textoGerado,
            modeloUsado: modeloNome,
            dados,
            geradoEm: new Date().toISOString(),
          };
        }
      }

      // Se a API retornou erro específico, registra e segue imediatamente para o próximo modelo
      if (resData.error) {
        ultimoErro = resData.error;
        logger.warn(`Modelo [v1beta/${modeloNome}] indisponível: ${resData.error.message || JSON.stringify(resData.error)}. Tentando próximo imediatamente...`);
      }
    } catch (err) {
      ultimoErro = err;
      logger.warn(`Falha na requisição para [v1beta/${modeloNome}]: ${err.message}`);
    }
  }

  logger.error('Falha em todos os modelos do Gemini:', ultimoErro);
  throw {
    status: 502,
    error: 'Erro na API do Gemini',
    message: ultimoErro?.message || 'Não foi possível obter resposta dos modelos do Gemini. Verifique a chave de API no Google AI Studio.',
  };
};

module.exports = {
  agregarDadosFinanceiros,
  gerarAnaliseGastosIA,
};

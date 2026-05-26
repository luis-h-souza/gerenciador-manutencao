const HORA_MS = 1000 * 60 * 60;

const horasEntre = (inicio, fim) => Math.max(0, (new Date(fim) - new Date(inicio)) / HORA_MS);

const arredondar = (valor, casas = 1) => {
  if (valor === null || valor === undefined) return null;
  const arredondado = Number(valor.toFixed(casas));
  return valor > 0 && arredondado === 0 ? Number((1 / (10 ** casas)).toFixed(casas)) : arredondado;
};

const calcularMetricasConfiabilidade = (ativo, agora = new Date()) => {
  const falhas = [...(ativo.falhas || [])].sort(
    (a, b) => new Date(a.dataDeteccao) - new Date(b.dataDeteccao)
  );

  const tempoTotalHoras = Math.max(0, horasEntre(ativo.criadoEm, agora));
  let downtimeHoras = 0;
  let tempoReparoSoma = 0;
  let falhasResolvidas = 0;
  let falhasAbertas = 0;

  falhas.forEach((falha) => {
    const fim = falha.dataResolucao ? falha.dataResolucao : agora;
    const duracaoFalha = horasEntre(falha.dataDeteccao, fim);

    downtimeHoras += duracaoFalha;

    if (falha.dataResolucao) {
      tempoReparoSoma += duracaoFalha;
      falhasResolvidas++;
    } else {
      falhasAbertas++;
    }
  });

  const uptimeHoras = Math.max(0, tempoTotalHoras - downtimeHoras);
  const totalFalhas = falhas.length;
  const mtbfHoras = totalFalhas > 0 ? uptimeHoras / totalFalhas : null;
  const mttrHoras = falhasResolvidas > 0 ? tempoReparoSoma / falhasResolvidas : null;
  const uptimePercentual = tempoTotalHoras > 0 ? (uptimeHoras / tempoTotalHoras) * 100 : 100;

  return {
    mtbfHoras: arredondar(mtbfHoras),
    mtbfDias: arredondar(mtbfHoras === null ? null : mtbfHoras / 24),
    mttrHoras: arredondar(mttrHoras),
    uptimePercentual: arredondar(uptimePercentual),
    downtimeHoras: arredondar(downtimeHoras),
    tempoTotalHoras: arredondar(tempoTotalHoras),
    totalFalhas,
    falhasResolvidas,
    falhasAbertas,
    possuiHistoricoMtbf: totalFalhas > 0,
    possuiHistoricoMttr: falhasResolvidas > 0,
  };
};

module.exports = { calcularMetricasConfiabilidade };

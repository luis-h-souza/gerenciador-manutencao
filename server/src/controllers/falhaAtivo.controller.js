const { resSucesso, resErroClient, resNaoEncontrado } = require('../utils/retornoHttp');
const falhaAtivoService = require('../services/falhaAtivo.service');

const listarFalhasPorAtivo = async (req, res, next) => {
  try {
    const resultado = await falhaAtivoService.listarFalhasPorAtivo(req.user, req.params.ativoId, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    if (err.message.includes('Acesso negado') || err.message.includes('não encontrado')) {
      return resNaoEncontrado(res, err.message);
    }
    next(err);
  }
};

const marcarResolvido = async (req, res, next) => {
  try {
    const falha = await falhaAtivoService.marcarResolvido(req.user, req.params.id, req.body);
    resSucesso(res, 'Falha marcada como resolvida', 200, falha);
  } catch (err) {
    if (err.message.includes('não encontrado') || err.message.includes('Acesso negado')) {
      return resNaoEncontrado(res, err.message);
    }
    next(err);
  }
};

const calcularConfiabilidade = async (req, res, next) => {
  try {
    const kpis = await falhaAtivoService.calcularConfiabilidade(req.user, req.params.ativoId);
    resSucesso(res, 'Operação realizada com sucesso', 200, kpis);
  } catch (err) {
    if (err.message.includes('não encontrado') || err.message.includes('Acesso negado')) {
      return resNaoEncontrado(res, err.message);
    }
    next(err);
  }
};

module.exports = {
  listarFalhasPorAtivo,
  marcarResolvido,
  calcularConfiabilidade,
};

const { resSucesso, resErroClient, resNaoEncontrado } = require('../utils/retornoHttp');
const rotinaInfraService = require('../services/rotinaInfra.service');

const listar = async (req, res, next) => {
  try {
    const resultado = await rotinaInfraService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    if (err.message.includes('Acesso negado')) return resErroClient(res, err.message, 403);
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const rotina = await rotinaInfraService.criar(req.user, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 201, rotina);
  } catch (err) {
    if (err.message.includes('Já existe um registro') || err.message.includes('obrigatória')) {
      return resErroClient(res, err.message, 400);
    }
    next(err);
  }
};

const conformidadeIncendio = async (req, res, next) => {
  try {
    const resultado = await rotinaInfraService.conformidadeIncendio(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    next(err);
  }
};

const pendenciasGerador = async (req, res, next) => {
  try {
    const resultado = await rotinaInfraService.pendenciasGerador(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, resultado);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listar,
  criar,
  conformidadeIncendio,
  pendenciasGerador
};

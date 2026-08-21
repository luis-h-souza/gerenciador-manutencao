const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao, resErroServer } = require('../utils/retornoHttp');
const chamadoService = require('../services/chamado.service');
const chamadoIaService = require('../services/chamado.ia.service');

const listar = async (req, res, next) => {
  try {
    const data = await chamadoService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const data = await chamadoService.buscarPorId(req.user, req.params.id);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const data = await chamadoService.criar(req.user, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 201, data);
  } catch (err) {
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const data = await chamadoService.atualizar(req.user, req.params.id, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await chamadoService.remover(req.user, req.params.id);
    resSucesso(res, 'Chamado removido');
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const resumoMensal = async (req, res, next) => {
  try {
    const data = await chamadoService.resumoMensal(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const analisarComIA = async (req, res, next) => {
  try {
    const { regiao, unidade, ano, mes } = req.query;
    const resultado = await chamadoIaService.gerarAnaliseGastosIA({ regiao, unidade, ano, mes });
    resSucesso(res, 'Análise gerada com sucesso via Gemini', 200, resultado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ sucesso: false, mensagem: err.message || err.error });
    }
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, resumoMensal, analisarComIA };

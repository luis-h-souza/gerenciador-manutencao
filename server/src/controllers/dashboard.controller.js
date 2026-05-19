const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
// src/controllers/dashboard.controller.js
const dashboardService = require('../services/dashboard.service');

const resumo = async (req, res, next) => {
  try {
    const data = await dashboardService.resumo(req.user, req.query);
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

const gastosPorSegmento = async (req, res, next) => {
  try {
    const data = await dashboardService.gastosPorSegmento(req.user, req.query);
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

const historicoMensal = async (req, res, next) => {
  try {
    const data = await dashboardService.historicoMensal(req.user, req.query);
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

const resumoRegional = async (req, res, next) => {
  try {
    const data = await dashboardService.resumoRegional(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const detalheRegional = async (req, res, next) => {
  try {
    const data = await dashboardService.detalheRegional(req.user, req.params.regiao, req.query);
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

const rankingCoordenadores = async (req, res, next) => {
  try {
    const data = await dashboardService.rankingCoordenadores(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const executivo = async (req, res, next) => {
  try {
    const data = await dashboardService.executivo(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch(err) {
    next(err);
  }
};

const conformidadeMatrix = async (req, res, next) => {
  try {
    const data = await dashboardService.conformidadeMatrix(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const buyVsMaintain = async (req, res, next) => {
  try {
    const data = await dashboardService.buyVsMaintain(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  resumo,
  gastosPorSegmento,
  historicoMensal,
  resumoRegional,
  detalheRegional,
  rankingCoordenadores,
  executivo,
  conformidadeMatrix,
  buyVsMaintain,
};

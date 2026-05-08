const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
// src/controllers/checklist.controller.js
const checklistService = require('../services/checklist.service');

const listarEquipamentos = async (req, res, next) => {
  try {
    const data = await checklistService.listarEquipamentos(req.user, req.query);
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

const buscarEquipamentoPorSemana = async (req, res, next) => {
  try {
    const data = await checklistService.buscarEquipamentoPorSemana(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data || null);
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

const salvarEquipamento = async (req, res, next) => {
  try {
    const data = await checklistService.salvarEquipamento(req.user, req.body);
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

const kpiEquipamentos = async (req, res, next) => {
  try {
    const data = await checklistService.kpiEquipamentos(req.user);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const buscarFrota = async (req, res, next) => {
  try {
    const data = await checklistService.buscarFrota(req.user, req.query);
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

const salvarFrota = async (req, res, next) => {
  try {
    await checklistService.salvarFrota(req.user, req.body.itens);
    resSucesso(res, 'Frota atualizada com sucesso');
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

const listarCarrinhos = async (req, res, next) => {
  try {
    const data = await checklistService.listarCarrinhos(req.user, req.query);
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

const buscarCarrinhoPorSemana = async (req, res, next) => {
  try {
    const data = await checklistService.buscarCarrinhoPorSemana(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data || null);
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

const salvarCarrinho = async (req, res, next) => {
  try {
    const data = await checklistService.salvarCarrinho(req.user, req.body);
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

const kpiCarrinhos = async (req, res, next) => {
  try {
    const data = await checklistService.kpiCarrinhos(req.user);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const kpiMensal = async (req, res, next) => {
  try {
    const data = await checklistService.kpiMensal(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    next(err);
  }
};

const consolidadoRegional = async (req, res, next) => {
  try {
    const data = await checklistService.consolidadoRegional(req.user, req.query);
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

const consolidadoLoja = async (req, res, next) => {
  try {
    const data = await checklistService.consolidadoLoja(req.user, req.query);
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

module.exports = {
  listarEquipamentos, buscarEquipamentoPorSemana, salvarEquipamento, kpiEquipamentos,
  listarCarrinhos,    buscarCarrinhoPorSemana,    salvarCarrinho,    kpiCarrinhos,
  buscarFrota, salvarFrota,
  kpiMensal, consolidadoRegional, consolidadoLoja,
};

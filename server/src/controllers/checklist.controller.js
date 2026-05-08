// src/controllers/checklist.controller.js
const checklistService = require('../services/checklist.service');

const listarEquipamentos = async (req, res, next) => {
  try {
    const data = await checklistService.listarEquipamentos(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const buscarEquipamentoPorSemana = async (req, res, next) => {
  try {
    const data = await checklistService.buscarEquipamentoPorSemana(req.user, req.query);
    res.json(data || null);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const salvarEquipamento = async (req, res, next) => {
  try {
    const data = await checklistService.salvarEquipamento(req.user, req.body);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const kpiEquipamentos = async (req, res, next) => {
  try {
    const data = await checklistService.kpiEquipamentos(req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const buscarFrota = async (req, res, next) => {
  try {
    const data = await checklistService.buscarFrota(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const salvarFrota = async (req, res, next) => {
  try {
    await checklistService.salvarFrota(req.user, req.body.itens);
    res.json({ message: 'Frota atualizada com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const listarCarrinhos = async (req, res, next) => {
  try {
    const data = await checklistService.listarCarrinhos(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const buscarCarrinhoPorSemana = async (req, res, next) => {
  try {
    const data = await checklistService.buscarCarrinhoPorSemana(req.user, req.query);
    res.json(data || null);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const salvarCarrinho = async (req, res, next) => {
  try {
    const data = await checklistService.salvarCarrinho(req.user, req.body);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const kpiCarrinhos = async (req, res, next) => {
  try {
    const data = await checklistService.kpiCarrinhos(req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const kpiMensal = async (req, res, next) => {
  try {
    const data = await checklistService.kpiMensal(req.user, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const consolidadoRegional = async (req, res, next) => {
  try {
    const data = await checklistService.consolidadoRegional(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const consolidadoLoja = async (req, res, next) => {
  try {
    const data = await checklistService.consolidadoLoja(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

module.exports = {
  listarEquipamentos, buscarEquipamentoPorSemana, salvarEquipamento, kpiEquipamentos,
  listarCarrinhos,    buscarCarrinhoPorSemana,    salvarCarrinho,    kpiCarrinhos,
  buscarFrota, salvarFrota,
  kpiMensal, consolidadoRegional, consolidadoLoja,
};

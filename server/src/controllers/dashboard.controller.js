// src/controllers/dashboard.controller.js
const dashboardService = require('../services/dashboard.service');

const resumo = async (req, res, next) => {
  try {
    const data = await dashboardService.resumo(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const gastosPorSegmento = async (req, res, next) => {
  try {
    const data = await dashboardService.gastosPorSegmento(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const historicoMensal = async (req, res, next) => {
  try {
    const data = await dashboardService.historicoMensal(req.user, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const resumoRegional = async (req, res, next) => {
  try {
    const data = await dashboardService.resumoRegional(req.user, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const detalheRegional = async (req, res, next) => {
  try {
    const data = await dashboardService.detalheRegional(req.user, req.params.regiao, req.query);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

const rankingCoordenadores = async (req, res, next) => {
  try {
    const data = await dashboardService.rankingCoordenadores(req.user, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const executivo = async (req, res, next) => {
  try {
    const data = await dashboardService.executivo(req.user, req.query);
    res.json(data);
  } catch(err) {
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
};

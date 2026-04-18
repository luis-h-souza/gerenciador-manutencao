// src/routes/checklist.routes.js
const router = require('express').Router();
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/checklist.controller');

router.use(autenticar);

// ─── Equipamentos ─────────────────────────────────────────────────────────────
// Visualização: todos acima de Técnico
router.get('/equipamentos', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.listarEquipamentos);

router.get('/equipamentos/semana', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.buscarEquipamentoPorSemana);

router.get('/equipamentos/kpi', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.kpiEquipamentos);

// Preenchimento: APENAS Gestores de unidade
router.post('/equipamentos', autorizar(Roles.GESTOR), ctrl.salvarEquipamento);

// ─── Carrinhos ────────────────────────────────────────────────────────────────
router.get('/carrinhos', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.listarCarrinhos);

router.get('/carrinhos/semana', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.buscarCarrinhoPorSemana);

router.get('/carrinhos/kpi', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.kpiCarrinhos);

// Frota (Inventário base da loja)
router.get('/carrinhos/frota', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.buscarFrota);

router.post('/carrinhos/frota', autorizar(Roles.GESTOR), ctrl.salvarFrota);

// Preenchimento: APENAS Gestores de unidade
router.post('/carrinhos', autorizar(Roles.GESTOR), ctrl.salvarCarrinho);

// ─── KPI Mensal (para Dashboard) ─────────────────────────────────────────────
router.get('/kpi-mensal', autorizar(
  Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR
), ctrl.kpiMensal);

module.exports = router;

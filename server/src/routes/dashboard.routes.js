// src/routes/dashboard.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');

router.use(autenticar);
router.use(autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR));

router.get('/resumo', ctrl.resumo);
router.get('/gastos-por-segmento', ctrl.gastosPorSegmento);
router.get('/historico-mensal', ctrl.historicoMensal);

// Visão consolidada para Supervisor/Admin
router.get('/regional', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR), ctrl.resumoRegional);
router.get('/regional/:regiao', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR), ctrl.detalheRegional);

module.exports = router;

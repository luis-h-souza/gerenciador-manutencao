// src/routes/dashboard.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');

router.use(autenticar);
router.use(autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR));

router.get('/resumo', ctrl.resumo);
router.get('/gastos-por-segmento', ctrl.gastosPorSegmento);
router.get('/historico-mensal', ctrl.historicoMensal);

router.get('/regional', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.resumoRegional);
router.get('/regional/:regiao', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.detalheRegional);
router.get('/ranking-coordenadores', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE), ctrl.rankingCoordenadores);

module.exports = router;

// src/routes/dashboard.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');

const GESTORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];
const FINANCEIRO = [...GESTORES, Roles.OPERACAO];

router.use(autenticar);

// Endpoints financeiros básicos — acessíveis para OPERACAO (escopo de loja)
router.get('/resumo', autorizar(...FINANCEIRO), ctrl.resumo);
router.get('/gastos-por-segmento', autorizar(...FINANCEIRO), ctrl.gastosPorSegmento);
router.get('/historico-mensal', autorizar(...FINANCEIRO), ctrl.historicoMensal);
router.get('/executivo', autorizar(...FINANCEIRO), ctrl.executivo);

// Endpoints regionais — requerem visão multi-loja (OPERACAO não tem acesso)
router.get('/regional', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.resumoRegional);
router.get('/regional/:regiao', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.detalheRegional);
router.get('/ranking-coordenadores', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE), ctrl.rankingCoordenadores);
router.get('/conformidade', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.conformidadeMatrix);
router.get('/buy-vs-maintain', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.buyVsMaintain);

module.exports = router;

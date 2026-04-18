// src/routes/estoque.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/estoque.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');

router.use(autenticar);
const GESTORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR];

router.get('/pecas', ctrl.listarPecas);
router.post('/pecas', autorizar(...GESTORES), ctrl.criarPeca);

router.get('/entradas', ctrl.listarEntradas);
router.post('/entradas', autorizar(...GESTORES), ctrl.registrarEntrada);

router.get('/movimentacoes', ctrl.listarMovimentacoes);
router.post('/movimentacoes', autorizar(...GESTORES), ctrl.registrarMovimentacao);

router.get('/saidas', ctrl.listarSaidas);
router.post('/saidas', autorizar(...GESTORES), ctrl.registrarSaida);

module.exports = router;

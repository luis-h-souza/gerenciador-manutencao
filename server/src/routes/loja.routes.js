// src/routes/loja.routes.js
const router = require('express').Router();
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const { listar, listarRegioes, buscarPorId, buscarMinha, criar, atualizar, atualizarMinha, remover } = require('../controllers/loja.controller');

router.use(autenticar);

// Leitura — todos os autenticados (necessário para dropdowns)
router.get('/',          listar);
router.get('/regioes',   listarRegioes);

// Gestor — consulta e atualiza a própria loja (rotas fixas antes de /:id)
router.get('/minha',   autorizar(Roles.GESTOR), buscarMinha);
router.patch('/minha', autorizar(Roles.GESTOR), atualizarMinha);

router.get('/:id',       buscarPorId);

// Escrita — apenas ADMIN e DIRETOR
router.post('/',     autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR), criar);
router.put('/:id',   autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR), atualizar);
router.delete('/:id',autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR), remover);

module.exports = router;

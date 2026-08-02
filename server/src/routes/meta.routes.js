// src/routes/meta.routes.js
const router = require('express').Router();
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const { listar, upsert, remover, cards } = require('../controllers/meta.controller');

router.use(autenticar);

// Cards de situação (gasto vs meta) — visível para gestores e OPERACAO
router.get(
  '/cards',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR, Roles.OPERACAO),
  cards
);

// Listagem de metas — gestores e OPERACAO (escopo controlado no service)
router.get(
  '/',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR, Roles.OPERACAO),
  listar
);

// Escrita — apenas ADMIN, DIRETOR e GERENTE
router.post(
  '/',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE),
  upsert
);

router.delete(
  '/:id',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE),
  remover
);

module.exports = router;

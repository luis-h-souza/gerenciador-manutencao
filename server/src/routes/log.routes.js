// src/routes/log.routes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');

// Somente ADMINISTRADOR acessa os logs de auditoria
router.get('/', autenticar, autorizar(Roles.ADMINISTRADOR), logController.listar);

module.exports = router;

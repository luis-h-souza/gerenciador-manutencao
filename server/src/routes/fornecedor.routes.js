// src/routes/fornecedor.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/fornecedor.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');

router.use(autenticar);
const GESTORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.SUPERVISOR, Roles.COORDENADOR, Roles.GESTOR];

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);

router.post('/', autorizar(...GESTORES), [
  body('nome').notEmpty(),
  body('cnpj').notEmpty().matches(/^\d{14}$/).withMessage('CNPJ deve ter 14 dígitos'),
  body('segmento').notEmpty(),
  body('email').optional().isEmail(),
], validate, ctrl.criar);

router.put('/:id', autorizar(...GESTORES), ctrl.atualizar);
router.delete('/:id', autorizar(Roles.ADMINISTRADOR, Roles.SUPERVISOR), ctrl.remover);

module.exports = router;

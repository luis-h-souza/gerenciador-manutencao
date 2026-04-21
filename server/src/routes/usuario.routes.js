// src/routes/usuario.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/usuario.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');

router.use(autenticar);
router.use(autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR));

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);

router.post('/', autorizar(Roles.ADMINISTRADOR), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').isLength({ min: 8 }).withMessage('Senha min 8 caracteres'),
  body('role').optional().isIn(Object.values(Roles)),
], validate, ctrl.criar);

router.put('/:id', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR), [
  body('email').optional().isEmail(),
  body('senha').optional().isLength({ min: 8 }),
  body('role').optional().isIn(Object.values(Roles)),
], validate, ctrl.atualizar);

router.delete('/:id', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR), ctrl.remover);

module.exports = router;

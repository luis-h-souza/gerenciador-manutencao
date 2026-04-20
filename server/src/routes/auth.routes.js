// src/routes/auth.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const { login, refresh, logout, logoutAll, me, alterarSenha } = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');

router.post('/login', authRateLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('senha').notEmpty().isLength({ min: 6 }).withMessage('Senha obrigatória (min 6 caracteres)'),
], validate, login);

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token obrigatório'),
], validate, refresh);

router.post('/logout', autenticar, logout);
router.post('/logout-all', autenticar, logoutAll);
router.get('/me', autenticar, me);

router.put('/alterar-senha', autenticar, [
  body('senhaAtual').notEmpty().withMessage('Senha atual obrigatória'),
  body('novaSenha').isLength({ min: 8 }).withMessage('Nova senha deve ter no mínimo 8 caracteres'),
], validate, alterarSenha);

module.exports = router;

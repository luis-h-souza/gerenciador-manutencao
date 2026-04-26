// src/routes/tarefa.routes.js
const router = require('express').Router();
const { body, query } = require('express-validator');
const ctrl = require('../controllers/tarefa.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const { createRateLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');

router.use(autenticar);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.listar);

router.get('/:id', ctrl.buscarPorId);

router.post('/', createRateLimiter,
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR),
  [
    body('descricao').notEmpty().isLength({ max: 500 }).withMessage('Descrição obrigatória'),
    body('areResponsavel').notEmpty().withMessage('Área responsável obrigatória'),
    body('prioridade').optional().isIn(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
    body('dataConclusao').optional().isISO8601(),
  ], validate, ctrl.criar);

router.put('/:id',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR),
  [
    body('status').optional().isIn(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']),
    body('prioridade').optional().isIn(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
  ], validate, ctrl.atualizar);

router.delete('/:id',
  autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR),
  ctrl.remover);

module.exports = router;

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/ativo.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');

const VISUALIZADORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];

router.use(autenticar);

router.get('/', autorizar(...VISUALIZADORES), ctrl.listar);
router.get('/:id', autorizar(...VISUALIZADORES), ctrl.buscarPorId);

router.post('/', autorizar(Roles.GESTOR), [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('categoria').notEmpty().withMessage('Categoria é obrigatória'),
  body('quantidade').optional().isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('status').optional().isIn(['ATIVO', 'EM_MANUTENCAO', 'INATIVO']).withMessage('Status inválido'),
], validate, ctrl.criar);

router.put('/:id', autorizar(Roles.GESTOR), [
  body('quantidade').optional().isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('status').optional().isIn(['ATIVO', 'EM_MANUTENCAO', 'INATIVO']).withMessage('Status inválido'),
], validate, ctrl.atualizar);

router.delete('/:id', autorizar(Roles.GESTOR), ctrl.remover);

module.exports = router;

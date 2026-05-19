const router = require('express').Router();
const { body, query } = require('express-validator');
const ctrl = require('../controllers/rotinaInfra.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');

const VISUALIZADORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];
const EXECUTORES = [Roles.ADMINISTRADOR, Roles.COORDENADOR, Roles.GESTOR];

router.use(autenticar);

router.get('/', autorizar(...VISUALIZADORES), ctrl.listar);

router.post('/', autorizar(...EXECUTORES), [
  body('tipo').isIn(['GERADOR_SEMANAL', 'INCENDIO_MENSAL_VISUAL', 'INCENDIO_BIMESTRAL_BOMBA']).withMessage('Tipo inválido'),
  body('unidade').notEmpty().withMessage('Unidade é obrigatória'),
  body('regiao').notEmpty().withMessage('Região é obrigatória'),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('Mês inválido'),
  body('ano').isInt({ min: 2000, max: 2100 }).withMessage('Ano inválido'),
  body('conforme').isBoolean().withMessage('Conforme deve ser booleano'),
], validate, ctrl.criar);

router.get('/conformidade', autorizar(...VISUALIZADORES), [
  query('mes').notEmpty().withMessage('Mês é obrigatório'),
  query('ano').notEmpty().withMessage('Ano é obrigatório')
], validate, ctrl.conformidadeIncendio);

router.get('/gerador/pendencias', autorizar(...VISUALIZADORES), ctrl.pendenciasGerador);

module.exports = router;

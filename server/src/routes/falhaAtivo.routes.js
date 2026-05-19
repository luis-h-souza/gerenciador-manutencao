const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/falhaAtivo.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');

const VISUALIZADORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];
const EXECUTORES = [Roles.ADMINISTRADOR, Roles.COORDENADOR, Roles.GESTOR];

router.use(autenticar);

router.get('/ativo/:ativoId', autorizar(...VISUALIZADORES), ctrl.listarFalhasPorAtivo);
router.get('/ativo/:ativoId/confiabilidade', autorizar(...VISUALIZADORES), ctrl.calcularConfiabilidade);

router.patch('/:id/resolver', autorizar(...EXECUTORES), [
  body('dataResolucao').optional().isISO8601().withMessage('Data de resolução inválida'),
], validate, ctrl.marcarResolvido);

module.exports = router;

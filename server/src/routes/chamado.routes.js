// src/routes/chamado.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/chamado.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const { createRateLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');

const GESTORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];

router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/resumo', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.resumoMensal);
router.get('/:id', ctrl.buscarPorId);

router.post('/', createRateLimiter, autorizar(...GESTORES), [
  body('dataAbertura').isISO8601().withMessage('Data inválida'),
  body('numeroChamado').notEmpty(),
  body('segmento').isIn(['ELETRICA','EMPILHADEIRA','REFRIGERACAO','SERRALHERIA','CIVIL','EQUIPAMENTOS','GERADOR','ELEVADOR','PCI','ALUGUEL','DIVERSOS']),
  body('empresa').notEmpty(),
  body('descricao').notEmpty(),
  body('status').optional().isIn(['CHAMADO_ABERTO','AGUARDANDO_APROVACAO','AGUARDANDO_OM_ENTREGA','FINALIZADO','ALUGUEL_OUTROS']),
], validate, ctrl.criar);

router.put('/:id', autorizar(...GESTORES), ctrl.atualizar);
router.delete('/:id', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE), ctrl.remover);

module.exports = router;

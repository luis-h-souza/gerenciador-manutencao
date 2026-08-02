// src/routes/chamado.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/chamado.controller');
const { autenticar, autorizar, Roles } = require('../middlewares/auth.middleware');
const { createRateLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');

const GESTORES = [Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR, Roles.GESTOR];
const LEITURA_FINANCEIRA = [...GESTORES, Roles.OPERACAO];
const SEGMENTOS_CHAMADO = [
  'AR_CONDICIONADO',
  'CARRINHO_CLIENTE',
  'CARRO_PIPA',
  'LIMPEZA_ESGOTO',
  'CIVIL',
  'COZINHA_REFEITORIO',
  'ELETRICA',
  'TRANSPALETEIRA',
  'EMPILHADEIRA',
  'GERADOR',
  'HIDRAULICA',
  'LAUDOS',
  'NOBREAK',
  'MATERIAL_MANUTENCAO',
  'PINTURA',
  'REFRIGERACAO',
  'REFRIGERACAO_PECAS',
  'SERRALHERIA',
  'SISTEMA_INCENDIO',
  'LOCACAO',
  'LIMPEZA',
  'TRATAMENTO_AGUA',
  'PORTA_PALETES',
  'FERRAMENTAS',
  'COMUNICACAO_VISUAL',
  'ELEVADORES',
  'ESTEIRAS',
  'TELHADO',
  'CHECKOUT',
  'VIDRACARIA',
  'FATIADORA',
  'SERRA_FITA',
  'EMBALADORA',
  'MAQUINA_VACUO',
  'LAVA_LOUCA',
  'CAFETERIA',
  'SISTEMA_SOM',
  'FRENTE_CAIXA',
  'GALERIAS',
  'FRETE',
  'OUTROS',
];
const normalizarTextoEnum = (valor) => String(valor)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ç/gi, 'c')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/^_+|_+$/g, '')
  .toUpperCase();
const normalizarSegmento = (valor) => {
  if (!valor) return valor;

  const normalizado = normalizarTextoEnum(valor);
  const aliases = {
    ARCONDICIONADO: 'AR_CONDICIONADO',
    REFRIGERACAO_PCS: 'REFRIGERACAO_PECAS',
    REFRIGERACAO_PCAS: 'REFRIGERACAO_PECAS',
    ELEVADOR: 'ELEVADORES',
    PCI: 'SISTEMA_INCENDIO',
    ALUGUEL: 'LOCACAO',
    DIVERSOS: 'OUTROS',
    SERVICOS_GERAIS: 'OUTROS',
    EQUIPAMENTOS: 'OUTROS',
  };

  return aliases[normalizado] || normalizado;
};

router.use(autenticar);

router.get('/', autorizar(...LEITURA_FINANCEIRA), ctrl.listar);
router.get('/resumo', autorizar(Roles.ADMINISTRADOR, Roles.DIRETOR, Roles.GERENTE, Roles.COORDENADOR), ctrl.resumoMensal);
router.get('/:id', autorizar(...LEITURA_FINANCEIRA), ctrl.buscarPorId);

router.post('/', createRateLimiter, autorizar(...GESTORES), [
  body('dataAbertura').isISO8601().withMessage('Data inválida'),
  body('numeroChamado').notEmpty(),
  body('segmento').customSanitizer(normalizarSegmento).isIn(SEGMENTOS_CHAMADO),
  body('empresa').notEmpty(),
  body('descricao').notEmpty(),
  body('status').optional().isIn(['AGUARDANDO_APROVACAO', 'AGUARDANDO_OM_ENTREGA', 'FINALIZADO', 'ALUGUEL_OUTROS', 'PCI', 'LAUDOS']),
], validate, ctrl.criar);

router.put('/:id', autorizar(...GESTORES), ctrl.atualizar);
router.delete('/:id', autorizar(Roles.ADMINISTRADOR, Roles.COORDENADOR, Roles.GESTOR), ctrl.remover);

module.exports = router;

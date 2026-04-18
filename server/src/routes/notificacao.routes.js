// src/routes/notificacao.routes.js
const prisma = require('../utils/prisma');
const router = require('express').Router();
const { autenticar } = require('../middlewares/auth.middleware');

router.use(autenticar);

router.get('/', async (req, res, next) => {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      orderBy: { criadoEm: 'desc' }, take: 50,
    });
    res.json(notificacoes);
  } catch (err) { next(err); }
});

router.patch('/:id/lida', async (req, res, next) => {
  try {
    await prisma.notificacao.update({ where: { id: req.params.id }, data: { lida: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/marcar-todas-lidas', async (req, res, next) => {
  try {
    await prisma.notificacao.updateMany({ where: { lida: false }, data: { lida: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

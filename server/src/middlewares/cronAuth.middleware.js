// src/middlewares/cronAuth.middleware.js
/**
 * Middleware de proteção para endpoints acionados por cron externo (ex: cron-job.org).
 * Valida o header 'x-cron-secret' contra a variável de ambiente CRON_SECRET.
 */
const logger = require('../utils/logger');

const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;

  // Se CRON_SECRET não estiver configurado, bloqueia por segurança
  if (!secret) {
    logger.warn('[CRON-AUTH] CRON_SECRET não configurado — acesso bloqueado.');
    return res.status(503).json({ error: 'Endpoint de manutenção não configurado.' });
  }

  const headerSecret = req.headers['x-cron-secret'];

  if (!headerSecret || headerSecret !== secret) {
    logger.warn(`[CRON-AUTH] Tentativa não autorizada de acionar cron — IP: ${req.ip}`);
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  next();
};

module.exports = cronAuth;

// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Handler genérico para quando limite é excedido
const rateLimitHandler = (req, res, next, options) => {
  logger.warn(`Rate limit excedido: ${req.ip} -> ${req.originalUrl}`);
  res.status(429).json({
    error: 'Muitas requisições',
    message: options.message || 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
    retryAfter: Math.ceil(options.windowMs / 1000),
  });
};

// ─── Rate Limiter Global ──────────────────────────────────────────────────────
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // 1000 requisições por minuto
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler,
  skip: (req) => req.url === '/health',
});

// ─── Rate Limiter para Autenticação (mais restritivo) ─────────────────────────
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || ''}`,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit: ${req.ip} tentou login com ${req.body?.email}`);
    res.status(429).json({
      error: 'Muitas tentativas de login',
      message: 'Número de tentativas excedido. Aguarde 15 minutos.',
      retryAfter: 900,
    });
  },
  skipSuccessfulRequests: true, // não conta requisições bem-sucedidas
});

// ─── Rate Limiter para criação de recursos (anti-spam) ────────────────────────
const createRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `create:${req.user?.id || req.ip}`,
  handler: rateLimitHandler,
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  createRateLimiter,
};

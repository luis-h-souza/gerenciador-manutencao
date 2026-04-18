// src/middlewares/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    requestId: req.id,
    user: req.user?.id,
  });

  // Erros do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflito',
      message: 'Registro duplicado. Verifique os dados fornecidos.',
      field: err.meta?.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Não encontrado',
      message: 'Registro não encontrado',
    });
  }

  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: err.message,
      details: err.details,
    });
  }

  // Erros JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
  }

  // Erro genérico
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Erro interno do servidor'
      : err.message;

  res.status(status).json({
    error: status === 500 ? 'Erro interno do servidor' : err.name || 'Erro',
    message,
    requestId: req.id,
  });
};

module.exports = errorHandler;

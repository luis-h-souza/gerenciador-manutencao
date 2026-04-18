// src/server.js
require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} recebido. Encerrando servidor...`);
  server.close(() => {
    logger.info('Servidor encerrado com sucesso.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forçando encerramento após timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('UncaughtException:', error);
  process.exit(1);
});

module.exports = server;

// src/utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL === '1';
const logDir = process.env.LOG_DIR || './logs';

// Somente tenta criar pasta se não estiver na Vercel
if (!isVercel && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [];

// Transports de arquivo apenas se NÃO for Vercel
if (!isVercel) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10,
    })
  );
}

// Console é obrigatório na Vercel para capturar logs no Dashboard
if (process.env.NODE_ENV !== 'production' || isVercel) {
  transports.push(
    new winston.transports.Console({
      format: isVercel 
        ? combine(errors({ stack: true }), timestamp(), json()) // JSON na Vercel é melhor para parsear
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat)
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports
});

// Adiciona nível HTTP
logger.http = (msg) => logger.log('http', msg);

module.exports = logger;

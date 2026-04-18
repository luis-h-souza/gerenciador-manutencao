// src/utils/redis.js
const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const createRedisClient = () => {
  if (redisClient) return redisClient;

  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis: máximo de tentativas atingido. Usando fallback em memória.');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  client.on('connect', () => logger.info('Redis: conectado'));
  client.on('ready', () => logger.info('Redis: pronto'));
  client.on('error', (err) => logger.error('Redis error:', err.message));
  client.on('close', () => logger.warn('Redis: conexão fechada'));

  client.connect().catch(() => {
    logger.warn('Redis indisponível - rate limiting usará memória local');
  });

  redisClient = client;
  return client;
};

const getRedisClient = () => redisClient || createRedisClient();

module.exports = { createRedisClient, getRedisClient };
module.exports.default = getRedisClient();

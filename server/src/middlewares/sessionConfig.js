// src/middlewares/sessionConfig.js
const session = require('express-session');
const { getRedisClient } = require('../utils/redis');
const logger = require('../utils/logger');

let RedisStore;
let sessionStore;

try {
  const connectRedis = require('connect-redis');
  const redisClient = getRedisClient();

  RedisStore = new connectRedis({
    client: redisClient,
    prefix: 'mnt:sess:',
    ttl: parseInt(process.env.SESSION_MAX_AGE || '86400000') / 1000,
  });

  sessionStore = RedisStore;
  logger.info('Session store: Redis');
} catch (err) {
  logger.warn('connect-redis indisponível, usando MemoryStore (não recomendado para produção)');
  sessionStore = undefined; // Express usará MemoryStore
}

module.exports = { sessionStore };

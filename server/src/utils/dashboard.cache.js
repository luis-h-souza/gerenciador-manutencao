// src/utils/dashboard.cache.js
/**
 * Utilitário de cache para o dashboard.
 *
 * Padrão cache-aside com degradação graciosa:
 * se o Redis estiver indisponível, a função computadora é chamada diretamente
 * sem nenhuma exceção propagada ao chamador.
 *
 * TTLs definidos por endpoint:
 *   resumo              → 5 min  (dados do mês atual mudam com frequência)
 *   gastosPorSegmento   → 10 min
 *   historicoMensal     → 60 min (dados históricos não mudam no dia)
 *   resumoRegional      → 10 min
 *   detalheRegional     → 5 min
 *   rankingCoordenadores→ 60 min
 *   conformidadeMatrix  → 30 min
 *   executivo           → 10 min
 *   buyVsMaintain       → 60 min
 */

const { getRedisClient } = require('./redis');
const logger = require('./logger');

/** TTLs em segundos */
const TTL = {
  resumo:               5 * 60,
  gastosPorSegmento:   10 * 60,
  historicoMensal:     60 * 60,
  resumoRegional:      10 * 60,
  detalheRegional:      5 * 60,
  rankingCoordenadores:60 * 60,
  conformidadeMatrix:  30 * 60,
  executivo:           10 * 60,
  buyVsMaintain:       60 * 60,
};

/**
 * Monta a chave de cache de forma determinística.
 * Ex: "dashboard:resumo:user123:5:2025:SP01"
 *
 * @param {string} endpoint - Nome do endpoint (chave do TTL)
 * @param {object} user     - req.user
 * @param {object} params   - parâmetros relevantes (mes, ano, regiao, etc.)
 * @returns {string}
 */
const buildKey = (endpoint, user, params = {}) => {
  const parts = [
    'dashboard',
    endpoint,
    user?.id || 'anon',
    user?.role || 'none',
    params.mes  || '_',
    params.ano  || '_',
    params.regiao  || '_',
    params.unidade || '_',
  ];
  return parts.join(':');
};

/**
 * Executa o padrão cache-aside.
 *
 * @param {string}   key      - Chave de cache já montada
 * @param {number}   ttl      - TTL em segundos
 * @param {Function} compute  - Função assíncrona que computa o dado real
 * @returns {Promise<any>}
 */
const withCache = async (key, ttl, compute) => {
  const redis = getRedisClient();

  // Tenta ler do cache
  try {
    if (redis.status === 'ready') {
      const cached = await redis.get(key);
      if (cached) {
        logger.debug(`Dashboard cache HIT: ${key}`);
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    logger.warn(`Dashboard cache GET falhou (${key}): ${err.message}`);
  }

  // Cache miss → computa
  const data = await compute();

  // Tenta gravar no cache (falha silenciosa)
  try {
    if (redis.status === 'ready') {
      await redis.set(key, JSON.stringify(data), 'EX', ttl);
      logger.debug(`Dashboard cache SET: ${key} (TTL ${ttl}s)`);
    }
  } catch (err) {
    logger.warn(`Dashboard cache SET falhou (${key}): ${err.message}`);
  }

  return data;
};

/**
 * Invalida todas as chaves do dashboard (usado após escritas relevantes).
 * Usa scan para não bloquear o Redis com KEYS *.
 *
 * @returns {Promise<number>} Número de chaves deletadas
 */
const invalidateDashboardCache = async () => {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') return 0;

  let cursor = '0';
  let deletedCount = 0;

  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'dashboard:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    logger.info(`Dashboard cache invalidado: ${deletedCount} chaves removidas`);
  } catch (err) {
    logger.warn(`Falha ao invalidar dashboard cache: ${err.message}`);
  }

  return deletedCount;
};

module.exports = { buildKey, withCache, invalidateDashboardCache, TTL };

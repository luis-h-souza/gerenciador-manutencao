// src/utils/jwt.js
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('JWT_SECRET e JWT_REFRESH_SECRET são obrigatórios!');
  process.exit(1);
}

/**
 * Gera o Access Token (curta duração)
 */
const gerarAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'access', jti: uuidv4() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'manutencao-api' }
  );
};

/**
 * Gera o Refresh Token (longa duração) e persiste no banco
 */
const gerarRefreshToken = async (usuarioId) => {
  const jti = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

  const token = jwt.sign(
    { sub: usuarioId, type: 'refresh', jti },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN, issuer: 'manutencao-api' }
  );

  // Persiste no banco para controle de revogação
  await prisma.refreshToken.create({
    data: { token, usuarioId, expiresAt },
  });

  return token;
};

/**
 * Verifica e decodifica o Access Token
 */
const verificarAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'manutencao-api',
    });
    if (decoded.type !== 'access') throw new Error('Tipo de token inválido');
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

/**
 * Verifica o Refresh Token e valida contra o banco
 */
const verificarRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'manutencao-api',
    });
    if (decoded.type !== 'refresh') throw new Error('Tipo de token inválido');

    // Verifica se não foi revogado
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!storedToken) throw new Error('Refresh token não encontrado');
    if (storedToken.revogado) throw new Error('Refresh token revogado');
    if (new Date() > storedToken.expiresAt) throw new Error('Refresh token expirado');
    if (!storedToken.usuario.ativo) throw new Error('Usuário inativo');

    return { valid: true, decoded, usuario: storedToken.usuario };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

/**
 * Revoga um Refresh Token específico
 */
const revogarRefreshToken = async (token) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revogado: true },
  });
};

/**
 * Revoga todos os Refresh Tokens de um usuário (logout total)
 */
const revogarTodosRefreshTokens = async (usuarioId) => {
  await prisma.refreshToken.updateMany({
    where: { usuarioId, revogado: false },
    data: { revogado: true },
  });
};

/**
 * Limpa tokens expirados (executar via cron job)
 */
const limparTokensExpirados = async () => {
  const resultado = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revogado: true },
      ],
    },
  });
  logger.info(`Tokens expirados removidos: ${resultado.count}`);
  return resultado.count;
};

module.exports = {
  gerarAccessToken,
  gerarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken,
  revogarRefreshToken,
  revogarTodosRefreshTokens,
  limparTokensExpirados,
};

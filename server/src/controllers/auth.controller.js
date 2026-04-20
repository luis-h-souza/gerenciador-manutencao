// src/controllers/auth.controller.js
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const {
  gerarAccessToken,
  gerarRefreshToken,
  verificarRefreshToken,
  revogarRefreshToken,
  revogarTodosRefreshTokens,
} = require('../utils/jwt');
const logger = require('../utils/logger');


/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { loja: { select: { id: true, numero: true, nome: true, regiao: true } } },
    });

    if (!usuario || !await bcrypt.compare(senha, usuario.senha)) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'E-mail ou senha incorretos',
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        error: 'Conta inativa',
        message: 'Sua conta foi desativada. Contate o administrador.',
      });
    }

    // Gerar tokens
    const accessToken = gerarAccessToken({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      nome: usuario.nome,
    });
    const refreshToken = await gerarRefreshToken(usuario.id);

    // Registrar sessão
    await prisma.sessao.create({
      data: {
        sessionId: req.sessionID,
        usuarioId: usuario.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.substring(0, 255),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Salvar userId na session
    req.session.userId = usuario.id;
    req.session.role = usuario.role;

    logger.info(`Login: ${usuario.email} (${usuario.role}) de ${req.ip}`);

    res.json({
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        regiao: usuario.regiao,
        lojaId: usuario.lojaId,
        loja: usuario.loja,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    const { valid, error, usuario } = await verificarRefreshToken(refreshToken);
    if (!valid) {
      return res.status(401).json({ error: 'Refresh token inválido', message: error });
    }

    // Rotação de token: revogar o antigo e emitir novos
    await revogarRefreshToken(refreshToken);
    const novoAccessToken = gerarAccessToken({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      nome: usuario.nome,
    });
    const novoRefreshToken = await gerarRefreshToken(usuario.id);

    res.json({ accessToken: novoAccessToken, refreshToken: novoRefreshToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) await revogarRefreshToken(refreshToken);

    // Invalidar sessão
    await prisma.sessao.updateMany({
      where: { sessionId: req.sessionID },
      data: { ativo: false },
    });

    req.session.destroy((err) => {
      if (err) logger.error('Erro ao destruir sessão:', err);
    });

    logger.info(`Logout: ${req.user?.email}`);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout-all
 * Revoga todos os tokens e sessões do usuário
 */
const logoutAll = async (req, res, next) => {
  try {
    await revogarTodosRefreshTokens(req.user.id);
    await prisma.sessao.updateMany({
      where: { usuarioId: req.user.id },
      data: { ativo: false },
    });
    req.session.destroy(() => {});
    res.json({ message: 'Todas as sessões encerradas' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
const me = async (req, res) => {
  res.json({ usuario: req.user });
};

/**
 * PUT /api/v1/auth/alterar-senha
 */
const alterarSenha = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await prisma.usuario.update({ where: { id: req.user.id }, data: { senha: senhaHash } });

    logger.info(`Senha alterada: ${req.user.email}`);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, logoutAll, me, alterarSenha };

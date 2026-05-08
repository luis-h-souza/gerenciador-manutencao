// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const sessionData = {
      sessionId: req.sessionID,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 255),
    };

    const { accessToken, refreshToken, usuario } = await authService.login(email, senha, sessionData);

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
        regiao: usuario.loja?.regiao || usuario.regiao || null,
        unidade: usuario.loja?.nome || null,
        lojaId: usuario.lojaId,
        loja: usuario.loja,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error, message: err.message });
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error, message: err.message });
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken, req.sessionID);

    req.session.destroy((err) => {
      if (err) logger.error('Erro ao destruir sessão:', err);
    });

    logger.info(`Logout: ${req.user?.email}`);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);
    
    req.session.destroy(() => {});
    
    res.json({ message: 'Todas as sessões encerradas' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ usuario: req.user });
};

const alterarSenha = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    await authService.alterarSenha(req.user.id, senhaAtual, novaSenha);

    logger.info(`Senha alterada: ${req.user.email}`);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.error });
    next(err);
  }
};

module.exports = { login, refresh, logout, logoutAll, me, alterarSenha };

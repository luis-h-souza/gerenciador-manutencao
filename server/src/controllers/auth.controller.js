const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
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
    resSucesso(res, 'Operação realizada com sucesso', 200, result);
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
    resSucesso(res, 'Logout realizado com sucesso');
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);
    
    req.session.destroy(() => {});
    
    resSucesso(res, 'Todas as sessões encerradas');
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  resSucesso(res, 'Operação realizada com sucesso', 200, { usuario: req.user });
};

const alterarSenha = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    await authService.alterarSenha(req.user.id, senhaAtual, novaSenha);

    logger.info(`Senha alterada: ${req.user.email}`);
    resSucesso(res, 'Senha alterada com sucesso');
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

module.exports = { login, refresh, logout, logoutAll, me, alterarSenha };

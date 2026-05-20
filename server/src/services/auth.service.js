const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const logService = require('./log.service');
const {
  gerarAccessToken,
  gerarRefreshToken,
  verificarRefreshToken,
  revogarRefreshToken,
  revogarTodosRefreshTokens,
} = require('../utils/jwt');

const login = async (email, senha, sessionData) => {
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { loja: { select: { id: true, numero: true, nome: true, regiao: true, telefone: true, endereco: true } } },
  });

  if (!usuario || !await bcrypt.compare(senha, usuario.senha)) {
    throw { status: 401, error: 'Credenciais inválidas', message: 'E-mail ou senha incorretos' };
  }

  if (!usuario.ativo) {
    throw { status: 403, error: 'Conta inativa', message: 'Sua conta foi desativada. Contate o administrador.' };
  }

  const accessToken = gerarAccessToken({
    sub: usuario.id,
    email: usuario.email,
    role: usuario.role,
    nome: usuario.nome,
  });
  const refreshToken = await gerarRefreshToken(usuario.id);

  // Registrar ou atualizar sessão
  await prisma.sessao.upsert({
    where: { sessionId: sessionData.sessionId },
    update: {
      usuarioId: usuario.id,
      ipAddress: sessionData.ip,
      userAgent: sessionData.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ativo: true,
    },
    create: {
      sessionId: sessionData.sessionId,
      usuarioId: usuario.id,
      ipAddress: sessionData.ip,
      userAgent: sessionData.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  
  // Auditoria: Registro de Login
  await logService.registrar({
    usuarioId: usuario.id,
    acao: 'LOGIN',
    modulo: 'AUTH',
    detalhes: { email: usuario.email, role: usuario.role },
    ip: sessionData.ip,
    userAgent: sessionData.userAgent
  });

  return { accessToken, refreshToken, usuario };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw { status: 400, error: 'Refresh token não fornecido' };
  }

  const { valid, error, usuario } = await verificarRefreshToken(refreshToken);
  if (!valid) {
    throw { status: 401, error: 'Refresh token inválido', message: error };
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

  return { accessToken: novoAccessToken, refreshToken: novoRefreshToken };
};

const logout = async (refreshToken, sessionId) => {
  if (refreshToken) await revogarRefreshToken(refreshToken);

  await prisma.sessao.updateMany({
    where: { sessionId },
    data: { ativo: false },
  });
};

const logoutAll = async (usuarioId) => {
  await revogarTodosRefreshTokens(usuarioId);
  await prisma.sessao.updateMany({
    where: { usuarioId },
    data: { ativo: false },
  });
};

const alterarSenha = async (usuarioId, senhaAtual, novaSenha) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
  if (!senhaValida) {
    throw { status: 400, error: 'Senha atual incorreta' };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 12);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { senha: senhaHash } });
};

module.exports = { login, refresh, logout, logoutAll, alterarSenha };

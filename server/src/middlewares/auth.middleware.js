// src/middlewares/auth.middleware.js
const prisma = require('../utils/prisma');
const { verificarAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');


/**
 * Middleware de autenticação via JWT Bearer Token
 * Valida o token e popula req.user
 */
const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Token de acesso não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];
    const { valid, decoded, error } = verificarAccessToken(token);

    if (!valid) {
      return res.status(401).json({
        error: 'Token inválido',
        message: error === 'jwt expired' ? 'Token expirado' : 'Token inválido',
        code: error === 'jwt expired' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      });
    }

    // Busca o usuário no banco para verificar se ainda está ativo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        regiao: true,
        lojaId: true,
        loja: { select: { id: true, numero: true, nome: true, regiao: true } },
      },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        error: 'Usuário inativo',
        message: 'Sua conta foi desativada',
      });
    }

    req.user = usuario;
    next();
  } catch (err) {
    logger.error('Erro no middleware de autenticação:', err);
    next(err);
  }
};

/**
 * Middleware de autorização por papel (roles)
 * @param {...string} roles - Roles permitidos
 */
const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Acesso negado: ${req.user.email} (${req.user.role}) tentou acessar recurso restrito a [${roles.join(', ')}]`
      );
      return res.status(403).json({
        error: 'Acesso negado',
        message: `Esta ação requer um dos seguintes perfis: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Roles do sistema
 */
const Roles = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  DIRETOR: 'DIRETOR',
  GERENTE: 'GERENTE',
  SUPERVISOR: 'SUPERVISOR',
  COORDENADOR: 'COORDENADOR',
  GESTOR: 'GESTOR',
  TECNICO: 'TECNICO',
};

module.exports = { autenticar, autorizar, Roles };

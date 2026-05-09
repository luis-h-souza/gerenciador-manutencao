// src/services/log.service.js
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

class LogService {
  /**
   * Registra uma ação na trilha de auditoria
   * @param {Object} params
   * @param {string} params.usuarioId - ID do usuário que realizou a ação
   * @param {string} params.acao - Descrição da ação (ex: 'LOGIN', 'DELETE_USER')
   * @param {string} params.modulo - Módulo da ação (ex: 'AUTH', 'USUARIO', 'CHAMADO')
   * @param {Object} [params.detalhes] - Dados adicionais da ação
   * @param {string} [params.ip] - IP do usuário
   * @param {string} [params.userAgent] - Browser/Device do usuário
   */
  async registrar({ usuarioId, acao, modulo, detalhes, ip, userAgent }) {
    try {
      return await prisma.logAuditoria.create({
        data: {
          usuarioId,
          acao,
          modulo,
          detalhes: detalhes || {},
          ip,
          userAgent,
        },
      });
    } catch (error) {
      logger.error('Erro ao registrar log de auditoria:', error);
      // Não lançamos erro aqui para não travar a operação principal (ex: login) 
      // caso o log falhe por algum motivo
      return null;
    }
  }

  /**
   * Lista logs para o painel administrativo
   */
  async listar(filtros = {}) {
    const p = parseInt(filtros.page) || 1;
    const l = parseInt(filtros.limit) || 50;
    const { modulo, usuarioId, dataInicio, dataFim } = filtros;
    
    const skip = (p - 1) * l;

    const where = {};
    if (modulo) where.modulo = modulo;
    if (usuarioId) where.usuarioId = usuarioId;
    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) where.criadoEm.lte = new Date(dataFim);
    }

    const [total, logs] = await Promise.all([
      prisma.logAuditoria.count({ where }),
      prisma.logAuditoria.findMany({
        where,
        skip,
        take: l,
        orderBy: { criadoEm: 'desc' },
        include: {
          usuario: {
            select: { nome: true, email: true, role: true }
          }
        }
      })
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  }
}

module.exports = new LogService();

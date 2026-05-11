// src/controllers/job.controller.js
const { limparLogsAuditoria, limparRefreshTokens, limparSessoes } = require('../jobs/limpeza.job');
const logger = require('../utils/logger');

class JobController {
  /**
   * Endpoint HTTP para acionar a limpeza via cron externo (cron-job.org).
   * Protegido pelo middleware cronAuth (x-cron-secret).
   */
  async executarLimpeza(req, res) {
    const inicio = Date.now();
    logger.info('[CRON-HTTP] Limpeza acionada via endpoint externo.');

    try {
      await limparSessoes();
      await limparRefreshTokens();
      await limparLogsAuditoria();

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      logger.info(`[CRON-HTTP] Limpeza concluída em ${duracao}s.`);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Limpeza executada com sucesso.',
        duracao: `${duracao}s`,
      });
    } catch (error) {
      logger.error('[CRON-HTTP] Erro na limpeza:', error);
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao executar limpeza.',
      });
    }
  }
}

module.exports = new JobController();

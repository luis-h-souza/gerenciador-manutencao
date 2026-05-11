// src/jobs/limpeza.job.js
const cron = require('node-cron');
const { subDays } = require('date-fns');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

// ─── Regras de retenção por módulo (em dias) ─────────────────────────────────
const RETENCAO_LOGS = {
  AUTH:      90,   // Logins e acessos
  CHECKLIST: 180,  // Preenchimentos operacionais
  TAREFA:    180,  // Ações em tarefas
  USUARIO:   365,  // Criação/edição de usuários — 1 ano
  CHAMADO:   730,  // Financeiro — 2 anos
};

// ─── Funções de limpeza ───────────────────────────────────────────────────────

async function limparLogsAuditoria() {
  logger.info('[CRON] Iniciando limpeza de logs de auditoria...');
  let totalRemovidos = 0;

  for (const [modulo, dias] of Object.entries(RETENCAO_LOGS)) {
    const corte = subDays(new Date(), dias);

    const { count } = await prisma.logAuditoria.deleteMany({
      where: {
        modulo,
        criadoEm: { lt: corte },
      },
    });

    if (count > 0) {
      logger.info(
        `[CRON] Logs removidos — Módulo: ${modulo} | Qtd: ${count} | Corte: ${corte.toLocaleDateString('pt-BR')}`
      );
    }

    totalRemovidos += count;
  }

  logger.info(`[CRON] Limpeza de logs concluída. Total removido: ${totalRemovidos}`);
}

async function limparRefreshTokens() {
  logger.info('[CRON] Limpando refresh tokens expirados/revogados...');

  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revogado: true },
      ],
    },
  });

  logger.info(`[CRON] Refresh tokens removidos: ${count}`);
}

async function limparSessoes() {
  logger.info('[CRON] Limpando sessões expiradas/inativas...');

  const { count } = await prisma.sessao.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { ativo: false },
      ],
    },
  });

  logger.info(`[CRON] Sessões removidas: ${count}`);
}

// ─── Agendamento dos Jobs ─────────────────────────────────────────────────────

function iniciarJobs() {
  // Sessões expiradas — todo dia às 03:00
  cron.schedule('0 3 * * *', async () => {
    try {
      await limparSessoes();
    } catch (err) {
      logger.error('[CRON] Erro ao limpar sessões:', err);
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Refresh tokens expirados — todo dia às 04:00
  cron.schedule('0 4 * * *', async () => {
    try {
      await limparRefreshTokens();
    } catch (err) {
      logger.error('[CRON] Erro ao limpar refresh tokens:', err);
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Logs de auditoria — todo domingo às 03:30 (fora do horário de pico)
  cron.schedule('30 3 * * 0', async () => {
    try {
      await limparLogsAuditoria();
    } catch (err) {
      logger.error('[CRON] Erro ao limpar logs de auditoria:', err);
    }
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('[CRON] Jobs de limpeza automática iniciados.');
}

module.exports = { iniciarJobs, limparLogsAuditoria, limparRefreshTokens, limparSessoes };

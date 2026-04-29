// src/services/dashboard.service.js
import api from './api';

export const dashboardService = {
  resumo: (params) => api.get('/dashboard/resumo', { params }),
  gastosPorSegmento: (params) => api.get('/dashboard/gastos-por-segmento', { params }),
  historicoMensal: (params) => api.get('/dashboard/historico-mensal', { params }),
  regional: (params = {}) => api.get('/dashboard/regional', { params }),
  detalheRegional: (regiao, params = {}) => api.get(`/dashboard/regional/${regiao}`, { params }),
  rankingCoordenadores: (params) => api.get('/dashboard/ranking-coordenadores', { params }),
  executivo: (params) => api.get('/dashboard/executivo', { params }),
};

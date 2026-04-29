// src/services/checklist.service.js
import api from './api';

export const checklistService = {
  listarEquipamentos: (params) => api.get('/checklists/equipamentos', { params }),
  buscarEquipSemana: (params) => api.get('/checklists/equipamentos/semana', { params }),
  salvarEquipamentos: (data) => api.post('/checklists/equipamentos', data),
  kpiEquipamentos: () => api.get('/checklists/equipamentos/kpi'),
  listarCarrinhos: (params) => api.get('/checklists/carrinhos', { params }),
  buscarCarrinhoSemana: (params) => api.get('/checklists/carrinhos/semana', { params }),
  salvarCarrinhos: (data) => api.post('/checklists/carrinhos', data),
  kpiCarrinhos: () => api.get('/checklists/carrinhos/kpi'),
  buscarFrota: (params) => api.get('/checklists/carrinhos/frota', { params }),
  salvarFrota: (data) => api.post('/checklists/carrinhos/frota', data),
  kpiMensal: (params) => api.get('/checklists/kpi-mensal', { params }),
  consolidadoRegional: (params) => api.get('/checklists/consolidado/regional', { params }),
  consolidadoLoja: (params) => api.get('/checklists/consolidado/loja', { params }),
};

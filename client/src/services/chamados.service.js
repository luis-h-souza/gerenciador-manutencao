// src/services/chamados.service.js
import api from './api';

export const chamadosService = {
  listar: (params) => api.get('/chamados', { params }),
  buscar: (id) => api.get(`/chamados/${id}`),
  criar: (data) => api.post('/chamados', data),
  atualizar: (id, data) => api.put(`/chamados/${id}`, data),
  remover: (id) => api.delete(`/chamados/${id}`),
  resumoMensal: (params) => api.get('/chamados/resumo', { params }),
};

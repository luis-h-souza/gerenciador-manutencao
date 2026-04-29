// src/services/tarefas.service.js
import api from './api';

export const tarefasService = {
  listar: (params) => api.get('/tarefas', { params }),
  buscar: (id) => api.get(`/tarefas/${id}`),
  criar: (data) => api.post('/tarefas', data),
  atualizar: (id, data) => api.put(`/tarefas/${id}`, data),
  remover: (id) => api.delete(`/tarefas/${id}`),
};

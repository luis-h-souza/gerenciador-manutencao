// src/services/lojas.service.js
import api from './api';

export const lojasService = {
  listar: (params) => api.get('/lojas', { params }),
  listarRegioes: () => api.get('/lojas/regioes'),
  buscar: (id) => api.get(`/lojas/${id}`),
  criar: (data) => api.post('/lojas', data),
  atualizar: (id, data) => api.put(`/lojas/${id}`, data),
  remover: (id) => api.delete(`/lojas/${id}`),
};

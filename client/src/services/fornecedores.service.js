// src/services/fornecedores.service.js
import api from './api';

export const fornecedoresService = {
  listar: (params) => api.get('/fornecedores', { params }),
  buscar: (id) => api.get(`/fornecedores/${id}`),
  criar: (data) => api.post('/fornecedores', data),
  atualizar: (id, data) => api.put(`/fornecedores/${id}`, data),
  remover: (id) => api.delete(`/fornecedores/${id}`),
};

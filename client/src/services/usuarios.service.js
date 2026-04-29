// src/services/usuarios.service.js
import api from './api';

export const usuariosService = {
  listar: (params) => api.get('/usuarios', { params }),
  buscar: (id) => api.get(`/usuarios/${id}`),
  criar: (data) => api.post('/usuarios', data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  remover: (id) => api.delete(`/usuarios/${id}`),
};

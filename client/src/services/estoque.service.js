// src/services/estoque.service.js
import api from './api';

export const estoqueService = {
  listarPecas: (params) => api.get('/estoque/pecas', { params }),
  criarPeca: (data) => api.post('/estoque/pecas', data),
  listarEntradas: (params) => api.get('/estoque/entradas', { params }),
  registrarEntrada: (data) => api.post('/estoque/entradas', data),
  listarMovimentacoes: (params) => api.get('/estoque/movimentacoes', { params }),
  registrarMovimentacao: (data) => api.post('/estoque/movimentacoes', data),
  listarSaidas: (params) => api.get('/estoque/saidas', { params }),
  registrarSaida: (data) => api.post('/estoque/saidas', data),
};

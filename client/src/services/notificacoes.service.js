// src/services/notificacoes.service.js
import api from './api';

export const notificacoesService = {
  listar: () => api.get('/notificacoes'),
  marcarLida: (id) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () => api.patch('/notificacoes/marcar-todas-lidas'),
};

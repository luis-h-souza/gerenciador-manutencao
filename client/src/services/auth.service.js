// src/services/auth.service.js
import api from './api';

export const authService = {
  alterarSenha: (data) => api.put('/auth/alterar-senha', data),
};

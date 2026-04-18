// src/services/index.js
import api from './api';

// ─── Tarefas ──────────────────────────────────────────────────────────────
export const tarefasService = {
  listar:     (params) => api.get('/tarefas', { params }),
  buscar:     (id)     => api.get(`/tarefas/${id}`),
  criar:      (data)   => api.post('/tarefas', data),
  atualizar:  (id, data) => api.put(`/tarefas/${id}`, data),
  remover:    (id)     => api.delete(`/tarefas/${id}`),
};

// ─── Usuários ─────────────────────────────────────────────────────────────
export const usuariosService = {
  listar:    (params) => api.get('/usuarios', { params }),
  buscar:    (id)     => api.get(`/usuarios/${id}`),
  criar:     (data)   => api.post('/usuarios', data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  remover:   (id)     => api.delete(`/usuarios/${id}`),
};

// ─── Chamados ─────────────────────────────────────────────────────────────
export const chamadosService = {
  listar:       (params) => api.get('/chamados', { params }),
  buscar:       (id)     => api.get(`/chamados/${id}`),
  criar:        (data)   => api.post('/chamados', data),
  atualizar:    (id, data) => api.put(`/chamados/${id}`, data),
  remover:      (id)     => api.delete(`/chamados/${id}`),
  resumoMensal: (params) => api.get('/chamados/resumo', { params }),
};

// ─── Fornecedores ─────────────────────────────────────────────────────────
export const fornecedoresService = {
  listar:    (params) => api.get('/fornecedores', { params }),
  buscar:    (id)     => api.get(`/fornecedores/${id}`),
  criar:     (data)   => api.post('/fornecedores', data),
  atualizar: (id, data) => api.put(`/fornecedores/${id}`, data),
  remover:   (id)     => api.delete(`/fornecedores/${id}`),
};

// ─── Estoque ──────────────────────────────────────────────────────────────
export const estoqueService = {
  listarPecas:         (params) => api.get('/estoque/pecas', { params }),
  criarPeca:           (data)   => api.post('/estoque/pecas', data),
  listarEntradas:      (params) => api.get('/estoque/entradas', { params }),
  registrarEntrada:    (data)   => api.post('/estoque/entradas', data),
  listarMovimentacoes: (params) => api.get('/estoque/movimentacoes', { params }),
  registrarMovimentacao:(data)  => api.post('/estoque/movimentacoes', data),
  listarSaidas:        (params) => api.get('/estoque/saidas', { params }),
  registrarSaida:      (data)   => api.post('/estoque/saidas', data),
};

// ─── Notificações ─────────────────────────────────────────────────────────
export const notificacoesService = {
  listar:           ()   => api.get('/notificacoes'),
  marcarLida:       (id) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasLidas: ()   => api.patch('/notificacoes/marcar-todas-lidas'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardService = {
  resumo:          (params) => api.get('/dashboard/resumo', { params }),
  gastosPorSegmento: (params) => api.get('/dashboard/gastos-por-segmento', { params }),
  historicoMensal: ()       => api.get('/dashboard/historico-mensal'),
  regional:        ()       => api.get('/dashboard/regional'),
  detalheRegional: (regiao) => api.get(`/dashboard/regional/${regiao}`),
};

// ─── Checklists ───────────────────────────────────────────────────────────
export const checklistService = {
  // Equipamentos
  listarEquipamentos:       (params) => api.get('/checklists/equipamentos', { params }),
  buscarEquipSemana:        (params) => api.get('/checklists/equipamentos/semana', { params }),
  salvarEquipamentos:       (data)   => api.post('/checklists/equipamentos', data),
  kpiEquipamentos:          ()       => api.get('/checklists/equipamentos/kpi'),
  // Carrinhos
  listarCarrinhos:          (params) => api.get('/checklists/carrinhos', { params }),
  buscarCarrinhoSemana:     (params) => api.get('/checklists/carrinhos/semana', { params }),
  salvarCarrinhos:          (data)   => api.post('/checklists/carrinhos', data),
  kpiCarrinhos:             ()       => api.get('/checklists/carrinhos/kpi'),
  buscarFrota:              (params) => api.get('/checklists/carrinhos/frota', { params }),
  salvarFrota:              (data)   => api.post('/checklists/carrinhos/frota', data),
  // Dashboard
  kpiMensal:                (params) => api.get('/checklists/kpi-mensal', { params }),
};

// src/services/index.js
import api from './api';

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authService = {
  alterarSenha: (data) => api.put('/auth/alterar-senha', data),
};

// ─── Lojas ────────────────────────────────────────────────────────────────
export const lojasService = {
  listar:        (params) => api.get('/lojas', { params }),
  listarRegioes: ()       => api.get('/lojas/regioes'),
  buscar:        (id)     => api.get(`/lojas/${id}`),
  buscarMinha:   ()       => api.get('/lojas/minha'),
  criar:         (data)   => api.post('/lojas', data),
  atualizar:     (id, data) => api.put(`/lojas/${id}`, data),
  atualizarMinha: (data)   => api.patch('/lojas/minha', data),
  remover:       (id)     => api.delete(`/lojas/${id}`),
};

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
  listarRegioes: ()   => api.get('/fornecedores/regioes'),
  buscar:    (id)     => api.get(`/fornecedores/${id}`),
  criar:     (data)   => api.post('/fornecedores', data),
  atualizar: (id, data) => api.put(`/fornecedores/${id}`, data),
  remover:   (id)     => api.delete(`/fornecedores/${id}`),
};

// ─── Ativos da Loja ───────────────────────────────────────────────────────
export const ativosService = {
  listar:    (params) => api.get('/ativos', { params }),
  buscar:    (id)     => api.get(`/ativos/${id}`),
  criar:     (data)   => api.post('/ativos', data),
  atualizar: (id, data) => api.put(`/ativos/${id}`, data),
  remover:   (id)     => api.delete(`/ativos/${id}`),
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
  historicoMensal: (params) => api.get('/dashboard/historico-mensal', { params }),
  regional:        (params = {}) => api.get('/dashboard/regional', { params }),
  detalheRegional: (regiao, params = {}) => api.get(`/dashboard/regional/${regiao}`, { params }),
  rankingCoordenadores: (params) => api.get('/dashboard/ranking-coordenadores', { params }),
  executivo:       (params) => api.get('/dashboard/executivo', { params }),
  conformidade:    (params) => api.get('/dashboard/conformidade', { params }),
  buyVsMaintain:   (params) => api.get('/dashboard/buy-vs-maintain', { params }),
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
  // Consolidado (Visão em Camadas)
  consolidadoRegional:      (params) => api.get('/checklists/consolidado/regional', { params }),
  consolidadoLoja:          (params) => api.get('/checklists/consolidado/loja', { params }),
};

// ─── Infraestrutura ───────────────────────────────────────────────────────
export const rotinasInfraService = {
  listar:               (params) => api.get('/rotinas-infra', { params }),
  criar:                (data)   => api.post('/rotinas-infra', data),
  conformidadeIncendio: (params) => api.get('/rotinas-infra/conformidade', { params }),
  pendenciasGerador:    (params) => api.get('/rotinas-infra/gerador/pendencias', { params }),
};

export const falhaAtivoService = {
  listarPorAtivo:  (ativoId, params) => api.get(`/falhas-ativo/ativo/${ativoId}`, { params }),
  marcarResolvido: (id, data)        => api.patch(`/falhas-ativo/${id}/resolver`, data),
  calcularConfiabilidade: (ativoId)  => api.get(`/falhas-ativo/ativo/${ativoId}/confiabilidade`),
};

// ─── Metas Orçamentárias ─────────────────────────────────────────────────
export const metasService = {
  listar:  (params) => api.get('/metas', { params }),
  upsert:  (data)   => api.post('/metas', data),
  remover: (id)     => api.delete(`/metas/${id}`),
  cards:   (params) => api.get('/metas/cards', { params }),
};


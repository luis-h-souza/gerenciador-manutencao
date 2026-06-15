Plano de Implementação — Metas Orçamentárias + KPI 1
Visão Geral
Criar o módulo de Metas Orçamentárias dentro da seção Financeiro do sistema. Diretores e Gerentes definem metas fixas por loja/regional. Coordenadores visualizam as metas de sua regional. Gestores visualizam a meta da sua própria loja. O KPI 1 (Gasto Real vs. Meta) é integrado no dashboard seguindo a mesma governança.

Sem alteração de schema — o modelo MetaOrcamentaria já existe no banco. Apenas npx prisma db push (sem migrate dev) se necessário.

Governança por Role
Role	Definir Meta	Escopo de Visualização
ADMINISTRADOR	✅ Todas	Todas as regiões → pode filtrar por região e loja
DIRETOR	✅ Todas	Todas as regiões → pode filtrar por região e loja
GERENTE	✅ Todas	Todas as regiões (separadas) → pode filtrar por loja
COORDENADOR	❌	Suas regionais (separadas) → pode filtrar por loja da regional
GESTOR	❌	Apenas sua loja
TÉCNICO	❌	❌
Regra de prioridade: Meta de loja específica prevalece sobre meta regional (mais granular vence).

Fase 1 — Backend: CRUD de Metas
[NEW] 
meta.service.js
js

// Operações:
listar(user, query)        // Filtra por regiao, ano, mes — respeitando escopo do role
upsert(user, body)         // Cria ou atualiza (upsert por @@unique) — só ADMIN/DIRETOR/GERENTE
remover(user, id)          // Remove meta — só ADMIN/DIRETOR/GERENTE
buscarMetaVigente(regiao, unidade, ano, mes)  // Helper interno para KPI 1
Regras de escopo no listar:

ADMINISTRADOR / DIRETOR / GERENTE → vê tudo, pode filtrar por região/loja
COORDENADOR → filtra automaticamente para user.regiao
GESTOR → filtra automaticamente para user.loja.nome dentro de user.regiao
[NEW] 
meta.controller.js
Controller padrão delegando para o service, com tratamento de erros.

[NEW] 
meta.routes.js

GET    /api/v1/metas       → listar  (ADMIN, DIRETOR, GERENTE, COORDENADOR, GESTOR)
POST   /api/v1/metas       → upsert  (ADMIN, DIRETOR, GERENTE)
DELETE /api/v1/metas/:id   → remover (ADMIN, DIRETOR, GERENTE)
[MODIFY] 
app.js
Registrar metaRoutes em /api/v1/metas.

Fase 2 — Frontend: Página de Metas Orçamentárias
Localização no Menu
Adicionar entrada "Metas Orçamentárias" no Sidebar.jsx logo abaixo de "Controle Financeiro", com ícone Target (lucide-react). Visível para: ADMINISTRADOR, DIRETOR, GERENTE, COORDENADOR, GESTOR.


/chamados      → Controle Financeiro   (já existe)
/metas         → Metas Orçamentárias   ← NOVO  (visível por role conforme tabela)
[NEW] 
MetasOrcamentariasPage.jsx
Layout em duas seções:

Seção 1 — Cards de Situação Atual (topo)
A página tem dois níveis de visualização com filtro progressivo:

Nível 1 — Visão Regional (padrão ao abrir):

Exibe um card por regional dentro do escopo do usuário
Card mostra: gasto total da regional + meta total da regional + % de execução com farol
ADMINISTRADOR/DIRETOR/GERENTE: todas as regiões, um card cada
COORDENADOR: apenas suas regionais (uma ou mais), um card cada — nunca agrupadas em um único valor
GESTOR: pula direto para o Nível 2 (somente sua loja)
Nível 2 — Visão por Loja (ao selecionar uma regional no filtro):

Aparece quando o usuário seleciona uma regional no filtro de região
Exibe um card por loja dentro da regional selecionada
COORDENADOR só consegue entrar em suas próprias regionais (governança aplicada no backend)
Cada card mostra:
Nome da loja
Meta da loja (ou "Sem meta" se não cadastrada)
Gasto real do mês
Barra de progresso com % de execução
Farol: 🟢 ≤ 90% | 🟡 90–110% | 🔴 > 110%
Filtros disponíveis:

Região (dropdown) → ao selecionar, muda para Nível 2
Loja (dropdown dependente da região) → filtra para loja específica
Mês + Ano → sempre visível
Botão "Limpar filtro" → volta para Nível 1 (visão regional)
Seção 2 — Tabela de Gestão de Metas (abaixo)
Visível apenas para ADMINISTRADOR, DIRETOR e GERENTE.

Filtros: Região, Ano, Mês
Tabela com: Região | Loja | Período | Meta (R$) | Ações (Editar/Excluir)
Botão "+ Nova Meta" → abre modal com formulário:
Selecionar Região (dropdown das regiões existentes)
Selecionar Loja (opcional — se vazio = meta vale para toda a regional)
Mês + Ano
Valor da Meta (R$)
Formulário usa upsert → se já existe meta para aquele período/loja, atualiza em vez de criar duplicata
NOTE

COORDENADOR e GESTOR veem apenas os cards de situação (Seção 1). A tabela de gestão + botão "Nova Meta" (Seção 2) é exclusiva para ADMINISTRADOR, DIRETOR e GERENTE.

[MODIFY] 
services/index.js
js

export const metasService = {
  listar:  (params) => api.get('/metas', { params }),
  upsert:  (data)   => api.post('/metas', data),
  remover: (id)     => api.delete(`/metas/${id}`),
};
[MODIFY] 
Sidebar.jsx
Adicionar item { to: '/metas', icon: Target, label: 'Metas Orçamentárias', roles: [...] } logo após /chamados.

[MODIFY] 
App.jsx
Adicionar rota /metas protegida para ADMINISTRADOR, DIRETOR, GERENTE, COORDENADOR, GESTOR.

Fase 3 — KPI 1 no Dashboard
Com as metas cadastradas, integrar o KPI 1 no dashboard para cada perfil:

[MODIFY] 
dashboard.service.js
No endpoint resumo, buscar a meta vigente e retornar:

json

{
  "valorMeta": 20000,
  "percentualExecucao": 87.5,
  "statusMeta": "VERDE",
  "semMeta": false
}
Se não houver meta cadastrada para o período → semMeta: true (sem farol, exibe aviso neutro).

Dashboard por perfil:
View	KPI 1
CorporativoDashboard	Cards por regional com % execução; clica para ver detalhe por loja
GestorDashboard	Card único da loja (sua meta vs. gasto real)
Fase 4 — Demais KPIs (2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15)
Após aprovação e conclusão das Fases 1–3, implementar os KPIs analíticos no serviço centralizado kpi.service.js e na nova aba do dashboard.

Verification Plan
Backend
POST /api/v1/metas como COORDENADOR → deve retornar 403
GET /api/v1/metas como COORDENADOR com duas regionais → retorna metas das duas regiões separadas, nunca misturadas
GET /api/v1/metas como COORDENADOR filtrando regiao=SP7 sendo que ele só tem SP1 → deve retornar 0 resultados (governança)
GET /api/v1/metas como GESTOR → retorna apenas a meta da sua loja
POST /api/v1/metas duas vezes com mesmos região/loja/mês/ano → deve atualizar, não duplicar (upsert)
Frontend
Gestor: page abre diretamente na visão de loja (card único)
Coordenador com 2 regionais: abre com 2 cards separados (um por regional); ao filtrar por SP1 vê as lojas de SP1
Coordenador tenta filtrar por regional que não é sua → backend bloqueia, tela exibe lista vazia
Gerente: abre com cards de todas as regiões; filtros de região e loja funcionam livremente
Diretor: tabela completa com todas as regiões e botão de nova me
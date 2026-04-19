# Sistema de Gerenciamento de Manutenção (SGM)

Sistema completo para gerenciamento de tarefas, controle financeiro, estoque de peças, checklists semanais e fornecedores do setor de manutenção — com **isolamento regional de dados** por perfil de acesso.

---

## Stack (versões atuais — Abril 2026)

| Camada | Tecnologia | Versão |
|---|---|---|
| **Backend** | Node.js | >=22.12.0 |
| **Framework** | Express.js | ^5.1.0 |
| **ORM** | Prisma | ^7.0.0 |
| **Banco de Dados** | PostgreSQL | >= 15 |
| **Cache / Sessões** | Redis | >= 7 |
| **Frontend** | React | ^19.2.5 |
| **Build tool** | Vite | ^6.2.0 |
| **CSS** | Tailwind CSS | ^4.2.2 |
| **Data fetching** | TanStack Query | ^5.99.0 |
| **Roteamento** | React Router | ^7.5.3 |
| **Datas** | date-fns | ^4.1.0 |

---

## Segurança e Controle de Acesso

- **JWT Access Token** (15 min) + **Refresh Token** (7 dias, rotação automática)
- Refresh tokens persistidos no banco com suporte a **revogação individual ou total**
- **Express Sessions** via Redis com cookie `HttpOnly + SameSite`
- **Rate limiting** em 3 camadas: global (100 req/15min), auth (10 tentativas), criação (20/min)
- **Helmet** — headers HTTP de segurança (CSP, HSTS, X-Frame-Options)
- **CORS** configurado por whitelist via variável de ambiente
- **Mass assignment prevenido** — controllers de estoque e fornecedor aceitam apenas campos explícitos do body
- **RBAC** — 7 roles com hierarquia regional:

| Role | Escopo | Permissões |
|---|---|---|
| `ADMINISTRADOR` | Global | Acesso total a todas as regiões e funcionalidades |
| `DIRETOR` | Global | Visão executiva consolidada |
| `GERENTE` | Global | Visão gerencial consolidada |
| `SUPERVISOR` | Global | Acesso total sem gestão de usuários |
| `COORDENADOR` | Regional | Acesso restrito à **sua região** — visualiza checklists e dados |
| `GESTOR` | Unidade | Acesso restrito à **sua loja** — **único** que preenche checklists |
| `TECNICO` | Atribuição | Vê apenas tarefas **atribuídas a ele** |

- **Isolamento regional (RLS de negócio):** filtros automáticos aplicados nos controllers via `getAccessFilter()`. Sem região definida → acesso bloqueado por padrão (fail-secure)
- **Soft delete** para usuários (nunca removidos fisicamente)
- **Notificações por usuário:** cada notificação é vinculada ao `usuarioId` destinatário — um usuário só vê suas próprias notificações
- **Graceful shutdown** com cleanup de conexões (SIGTERM/SIGINT, timeout 10s)

---

## Configuração e execução

### Pré-requisitos
- Node.js >= 22.12
- Docker (recomendado para PostgreSQL + Redis)

### 1. Subir infraestrutura (Docker)

```bash
docker compose up -d
# PostgreSQL em localhost:5433
# Redis em localhost:6379
```

### 2. Configuração do Backend

```bash
cd server
npm install          # já executa prisma generate via postinstall

cp .env.example .env
# Edite o .env com suas chaves

npx prisma db push
npm run prisma:seed

npm run dev
```

### 3. Configuração do Frontend

```bash
cd client
npm install
npm run dev
# URL padrão: http://localhost:3000
```

---

## Variáveis de Ambiente (.env)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL |
| `REDIS_URL` | URL de conexão com o Redis |
| `JWT_SECRET` | Chave secreta para o Access Token |
| `JWT_REFRESH_SECRET` | Chave secreta para o Refresh Token |
| `SESSION_SECRET` | Segredo para as sessões do Express |
| `CORS_ORIGIN` | URL(s) permitida(s) para acessar a API |
| `PORT` | Porta do servidor Express (padrão: 3001) |

> Nunca versione o arquivo `.env` real. Use o `.env.example` para compartilhar a estrutura.

---

## Hierarquia de Acesso Regional

| Role | Escopo | Descrição |
|---|---|---|
| `DIRETOR / GERENTE` | **Global** | Visão consolidada de todas as regionais |
| `ADMIN / SUPERVISOR` | **Global** | Gestão de infraestrutura e usuários |
| `COORDENADOR` | **Regional** | Visualiza dados da **sua região** |
| `GESTOR` | **Unidade** | Visualiza sua loja. Único que preenche checklists |
| `TECNICO` | **Atribuição** | Vê apenas tarefas designadas para ele |

---

## Credenciais de teste (após seed)

| E-mail | Senha | Perfil | Região |
|---|---|---|---|
| admin@manutencao.com | Senha@123 | Administrador | — |
| gerente@manutencao.com | Senha@123 | Gerente | — |
| coordenador@manutencao.com | Senha@123 | Coordenador | SP1 |
| gestor@manutencao.com | Senha@123 | Gestor | SP7 |
| tecnico@manutencao.com | Senha@123 | Técnico | SP1 |

---

## Estrutura do projeto

```
manutencao/
├── docker-compose.yml
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        # 14 modelos + enums
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── tarefa.controller.js
│   │   │   ├── chamado.controller.js
│   │   │   ├── usuario.controller.js
│   │   │   ├── estoque.controller.js
│   │   │   ├── fornecedor.controller.js
│   │   │   ├── checklist.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── sessionConfig.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── tarefa.routes.js
│   │   │   ├── usuario.routes.js
│   │   │   ├── chamado.routes.js
│   │   │   ├── fornecedor.routes.js
│   │   │   ├── estoque.routes.js
│   │   │   ├── notificacao.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── checklist.routes.js
│   │   ├── utils/
│   │   │   ├── access.utils.js  # getAccessFilter + getCreationContext
│   │   │   ├── jwt.js
│   │   │   ├── redis.js
│   │   │   ├── logger.js
│   │   │   └── prisma.js        # singleton
│   │   ├── app.js
│   │   └── server.js
│   ├── vercel.json              # Serverless config
│   └── .env.example
│
└── client/
    ├── index.html               # Anti-flash script de tema
    ├── vercel.json              # SPA routing (rewrite → index.html)
    └── src/
        ├── components/layout/
        │   ├── AppLayout.jsx    # Sidebar fechada por padrão em mobile
        │   ├── Sidebar.jsx
        │   └── Header.jsx       # Toggle de tema claro/escuro
        ├── contexts/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useTheme.js      # Tema persistido + detecção do OS
        ├── pages/
        │   ├── auth/LoginPage.jsx
        │   ├── dashboard/DashboardPage.jsx
        │   ├── tarefas/
        │   ├── chamados/
        │   ├── checklists/
        │   ├── estoque/
        │   ├── fornecedores/
        │   └── usuarios/
        ├── services/
        │   ├── api.js
        │   └── index.js
        ├── App.jsx
        ├── main.jsx
        └── index.css            # Design system: tema escuro + tema claro
```

---

## Endpoints da API

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/auth/login` | Login — retorna access + refresh token |
| POST | `/api/v1/auth/refresh` | Renova tokens |
| POST | `/api/v1/auth/logout` | Logout (revoga refresh token) |
| GET | `/api/v1/auth/me` | Dados do usuário autenticado |

### Tarefas
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/tarefas` | Listar (filtrado por região/técnico) |
| POST | `/api/v1/tarefas` | Criar (herda região do criador; notifica destinatário) |
| PUT | `/api/v1/tarefas/:id` | Editar (notifica ao mudar status) |
| DELETE | `/api/v1/tarefas/:id` | Remover |

### Controle Financeiro (Chamados)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/chamados` | Listar (`?mes=&ano=` + região) |
| POST | `/api/v1/chamados` | Criar |
| GET | `/api/v1/chamados/resumo-mensal` | Resumo por mês |
| PUT/DELETE | `/api/v1/chamados/:id` | Editar / Remover |

### Estoque
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/v1/estoque/pecas` | Peças (global) |
| GET/POST | `/api/v1/estoque/entradas` | Entradas NF (incrementa estoque) |
| GET/POST | `/api/v1/estoque/movimentacoes` | Movimentações (decrementa estoque) |
| GET/POST | `/api/v1/estoque/saidas` | Saídas definitivas (decrementa estoque) |

### Dashboard
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/dashboard/resumo` | KPIs por perfil (peças em alerta apenas para GESTOR) |
| GET | `/api/v1/dashboard/historico-mensal` | Histórico 6 meses |
| GET | `/api/v1/dashboard/gastos-por-segmento` | Gastos agrupados por segmento |
| GET | `/api/v1/dashboard/resumo-regional` | Visão por regional (Corporativo) |

### Checklists Semanais
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/v1/checklists/equipamentos` | Coord+ | Listar checklists de equipamentos |
| GET | `/api/v1/checklists/equipamentos/semana` | Coord+ | Checklist da semana atual |
| POST | `/api/v1/checklists/equipamentos` | **Gestor** | Criar/atualizar checklist |
| GET | `/api/v1/checklists/equipamentos/kpi` | Coord+ | KPI da semana atual |
| GET | `/api/v1/checklists/carrinhos` | Coord+ | Listar checklists de carrinhos |
| GET | `/api/v1/checklists/carrinhos/semana` | Coord+ | Checklist da semana atual |
| POST | `/api/v1/checklists/carrinhos` | **Gestor** | Criar/atualizar checklist |
| GET | `/api/v1/checklists/carrinhos/kpi` | Coord+ | KPI da semana atual |
| GET | `/api/v1/checklists/kpi-mensal` | Coord+ | KPI consolidado do mês |

### Notificações
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/notificacoes` | Listar notificações do usuário logado |
| PATCH | `/api/v1/notificacoes/:id/lida` | Marcar uma como lida |
| PATCH | `/api/v1/notificacoes/marcar-todas-lidas` | Marcar todas como lidas |

### Usuários & Fornecedores
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/v1/usuarios` | Gestão de usuários (Admin/Supervisor) |
| PUT | `/api/v1/usuarios/:id` | Editar (suporta `regiao` e `unidade`) |
| GET/POST | `/api/v1/fornecedores` | Gestão de fornecedores (global) |
| PUT | `/api/v1/fornecedores/:id` | Editar fornecedor |

---

## Checklists Semanais

### Equipamentos verificados
Empilhadeira Elétrica, Empilhadeira a Combustão, Empilhadeira Patolada, Máquina de Moer Carne, Serra Fita, Embaladora a Vácuo, Fatiadora, Fatiadora Grande, Elevadores, Ilhaself, Escada Rolante

### Carrinhos verificados
Maria Gorda, Supercar, Dois Andares, Prancha, Prancha Perecíveis, Carrinhos de Abastecimento, Escadas

### Regras de acesso
- **Quem preenche:** somente `GESTOR`
- **Quem visualiza:** `COORDENADOR`, `SUPERVISOR`, `ADMINISTRADOR`, `DIRETOR`, `GERENTE`
- **Preenchimento:** 1x por semana — o sistema usa _upsert_, o formulário é reeditável na mesma semana
- **Unicidade:** uma entrada por `(semana, ano, unidade)`

---

## Modelos de dados (Prisma)

```
Usuario                  — nome, email, senha, role, ativo, regiao, unidade
RefreshToken             — rotação automática, revogação individual
Sessao                   — controle de sessões + IP tracking
Tarefa                   — prioridade, status, região, unidade, atribuição
ControleChamado          — segmento, valor, status, mês/ano, região, mauUso
Notificacao              — titulo, mensagem, lida, tarefaId, usuarioId (destinatário)
Fornecedor               — CNPJ único, segmento, contato (recurso global)
Peca                     — estoque (recurso global)
EntradaPeca              — NF, fornecedor, quantidade, valor unitário
MovimentacaoPeca         — lojaRequisitante, chamado, status (PENDENTE→RECEBIDO)
SaidaPeca                — destino, nomeRetirou, quantidade
ChecklistEquipamento     — semana, ano, regiao, unidade (unique por semana+ano+unidade)
ChecklistEquipamentoItem — tipo, operacional, qtd, qtdQuebrada, numSerie, chamado, valor
ChecklistCarrinho        — semana, ano, regiao, unidade (unique por semana+ano+unidade)
ChecklistCarrinhoItem    — tipo, total, quebrados, chamado
FrotaCarrinho            — capacidade por tipo/unidade
```

---

## Interface e Temas

- **Tema escuro** (padrão industrial) e **tema claro** disponíveis
- **Detecção automática do OS:** na primeira visita, o sistema respeita `prefers-color-scheme` do sistema operacional
- **Persistência:** após o usuário alternar manualmente via botão no header, a preferência é salva no `localStorage`
- **Anti-flash:** script inline no `index.html` aplica o tema antes do primeiro render do React
- **Sidebar:** aberta por padrão em desktop (≥ 1024px), fechada por padrão em mobile

---

## Deploy (Vercel)

O projeto usa dois projetos separados no Vercel:

**Backend (`server/`):**
- `vercel.json` redireciona todas as rotas para `src/server.js` (serverless)
- `postinstall` no `package.json` executa `prisma generate` automaticamente a cada deploy
- Variáveis de ambiente configuradas no painel do Vercel

**Frontend (`client/`):**
- `vercel.json` usa rewrite `/(.*) → /index.html` para suporte a SPA routing (resolve 404 no F5)
- Variável `VITE_API_URL` deve apontar para a URL do backend em produção

---

## Escalabilidade

- **Redis centralizado** → múltiplas instâncias compartilham sessões e rate limiting
- **Prisma v7 com connection pooling** via `@prisma/adapter-pg`
- **Singleton do Prisma Client** → evita conexões duplicadas por instância
- **Stateless por JWT** → qualquer instância valida tokens sem coordenação

---

## Docker (desenvolvimento local)

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: sgm_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
docker compose up -d   # subir
docker compose down    # parar
```

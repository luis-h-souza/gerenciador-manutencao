# 🔧 Sistema de Gerenciamento de Manutenção (SGM)

Sistema completo para gerenciamento de tarefas, controle financeiro, estoque de peças, checklists semanais e fornecedores do setor de manutenção — com **isolamento regional de dados** por perfil de acesso.

---

## 📦 Stack (versões atuais — Abril 2026)

| Camada | Tecnologia | Versão |
|---|---|---|
| **Backend** | Node.js | >=22.12.0 |
| **Framework** | Express.js | ^5.1.0 |
| **ORM** | Prisma | ^7.0.0 |
| **Banco de Dados** | PostgreSQL | >= 15 |
| **Cache / Sessões** | Redis | >= 7 |
| **Frontend** | React | ^19.2.5 |
| **Build tool** | Vite | ^8.0.8 |
| **CSS** | Tailwind CSS | ^4.2.2 |
| **Data fetching** | TanStack Query | ^5.99.0 |
| **Roteamento** | React Router | ^7.5.3 |
| **Datas** | date-fns | ^4.1.0 |

---

## 🔐 Segurança e Controle de Acesso

- **JWT Access Token** (15 min) + **Refresh Token** (7 dias, rotação automática)
- Refresh tokens persistidos no banco com suporte a **revogação individual ou total**
- **Express Sessions** via Redis com cookie `HttpOnly + SameSite`
- **Rate limiting** em 3 camadas: global (100 req/15min), auth (10 tentativas), criação (20/min)
- **Helmet** — headers HTTP de segurança
- **CORS** configurado por whitelist via variável de ambiente
- **RBAC** — 5 roles com hierarquia regional:

| Role | Permissões |
|---|---|
| `ADMINISTRADOR` | Acesso total a todas as regiões e funcionalidades |
| `SUPERVISOR` | Acesso total a todas as regiões (sem gestão de usuários) |
| `COORDENADOR` | Acesso restrito à **sua região** — visualiza checklists e dados |
| `GESTOR` | Acesso restrito à **sua região** — **único** que preenche checklists |
| `TÉCNICO` | Vê apenas tarefas **atribuídas a ele** |

- **Isolamento regional (RLS de negócio):** campo `regiao` em `Usuario`, `Tarefa`, `ControleChamado`, `ChecklistEquipamento` e `ChecklistCarrinho`. Filtros automáticos aplicados nos controllers — sem região definida → acesso bloqueado por padrão (fail-secure)
- **Soft delete** para usuários (nunca removidos fisicamente)
- **Graceful shutdown** com cleanup de conexões

---

## 🚀 Configuração e execução

O projeto utiliza variáveis de ambiente para gerenciar conexões e segredos. Siga a ordem abaixo para um setup rápido:

### Pré-requisitos
- Node.js >= 22.12
- Docker (recomendado para PostgreSQL + Redis)

### 1. Subir infraestrutura (Docker)
O arquivo `docker-compose.yml` na raiz sobe os serviços de banco e cache necessários.
```bash
docker compose up -d
# PostgreSQL em localhost:5433
# Redis em localhost:6379
```

### 2. Configuração do Backend
```bash
cd server
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves (veja a seção 'Variáveis de Ambiente' abaixo)

# Sincronizar banco e gerar cliente Prisma
npx prisma db push
npx prisma generate
npm run prisma:seed

# Iniciar
npm run dev
```

### 3. Configuração do Frontend (Vite)
O frontend já possui um proxy configurado para redirecionar chamadas `/api` para o backend (porta 3001).
```bash
cd client
npm install
npm run dev
# URL padrão: http://localhost:3000
```

---

## 🔑 Variáveis de Ambiente (.env)

No diretório `server/`, crie um arquivo `.env` baseado no `.env.example`. Abaixo o que cada variável faz:

| Variável | Descrição | Valor Padrão (Exemplo) |
|---|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL | `postgresql://admin:admin123@localhost:5433/sgm_db` |
| `REDIS_URL` | URL de conexão com o cache Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Chave secreta para assinar o Access Token | *Use uma string aleatória longa* |
| `JWT_REFRESH_SECRET`| Chave secreta para assinar the Refresh Token | *Diferente da JWT_SECRET* |
| `SESSION_SECRET` | Segredo para as sessões do Express | *Obrigatório para segurança* |
| `CORS_ORIGIN` | URL permitida para acessar a API | `http://localhost:3000` |
| `PORT` | Porta onde o servidor Express vai rodar | `3001` |

> [!IMPORTANT]
> Nunca versione o arquivo `.env` real no seu repositório. Use o `.env.example` para compartilhar a estrutura das chaves necessárias sem expor senhas.

---

## 🔐 Hierarquia Regional e Acesso

O sistema utiliza um modelo de isolamento de dados regional. Diferentes perfis possuem diferentes níveis de visibilidade:

| Role | Escopo | Descrição |
|---|---|---|
| `DIRETOR / GERENTE` | **Global** | Acesso total a todas as regionais. Navegam via Coordenadores -> Lojas. |
| `ADMIN / SUPERVISOR`| **Global** | Gestão de infraestrutura e usuários. |
| `COORDENADOR` | **Regional** | Visualiza apenas os gestores e dados da **sua região** (ex: SP8). |
| `GESTOR` | **Unidade** | Visualiza apenas sua loja. **Único** perfil que preenche checklists. |
| `TÉCNICO` | **Atribuição**| Vê apenas as tarefas designadas especificamente para ele. |

## 👤 Credenciais de teste (após seed)

| E-mail | Senha | Perfil | Região |
|---|---|---|---|
| admin@manutencao.com | Senha@123 | Administrador | — |
| gerente@manutencao.com | Senha@123 | Gerente | — |
| coordenador@manutencao.com | Senha@123 | Coordenador | SP1 |
| gestor@manutencao.com | Senha@123 | Gestor | SP7 |
| tecnico@manutencao.com | Senha@123 | Técnico | SP1 |

---

## 📁 Estrutura do projeto

```
manutencao/
├── docker-compose.yml           # PostgreSQL + Redis
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        # 14 modelos de dados + enums
│   │   └── seed.js              # Dados de teste com regiões
│   ├── prisma.config.ts         # Configuração Prisma v7
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── tarefa.controller.js      # Filtro regional automático
│   │   │   ├── chamado.controller.js     # Filtro por mês + região
│   │   │   ├── usuario.controller.js     # Expõe campo regiao
│   │   │   ├── estoque.controller.js     # Entradas/Movs/Saídas com transação
│   │   │   ├── fornecedor.controller.js
│   │   │   ├── checklist.controller.js   # Checklists regionais + KPI mensal
│   │   │   └── notificacao.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js        # JWT + popula req.user c/ regiao
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
│   │   │   └── checklist.routes.js       # NOVO
│   │   ├── utils/               # jwt, redis, logger, prisma (singleton)
│   │   ├── app.js               # Express + todas as rotas
│   │   └── server.js            # Entry point + graceful shutdown
│   └── .env.example
│
└── client/
    ├── src/
    │   ├── components/
    │   │   └── layout/          # AppLayout, Sidebar, Header
    │   ├── contexts/
    │   │   └── AuthContext.jsx  # JWT + refresh automático
    │   ├── pages/
    │   │   ├── auth/            # LoginPage
    │   │   ├── dashboard/       # DashboardPage (KPIs + gráficos + card checklist)
    │   │   ├── tarefas/         # CRUD de tarefas (filtro por técnico/região)
    │   │   ├── chamados/        # Controle financeiro (filtro por mês)
    │   │   ├── checklists/      # Checklists semanais (NOVO)
    │   │   ├── estoque/         # Estoque (Estoque/Entradas/Movimentações/Saídas)
    │   │   ├── fornecedores/    # Cards de fornecedores
    │   │   └── usuarios/        # Gestão de usuários (com coluna Região)
    │   ├── services/
    │   │   ├── api.js           # Axios + interceptors JWT
    │   │   └── index.js         # Todos os serviços (+ checklistService)
    │   ├── App.jsx              # Rotas + guards por role
    │   ├── main.jsx             # React 19 + QueryClient
    │   └── index.css            # Design system CSS variables
    └── vite.config.js
```

---

## 🌐 Endpoints da API

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
| POST | `/api/v1/tarefas` | Criar (herda região do criador) |
| PUT/DELETE | `/api/v1/tarefas/:id` | Editar / Remover |

### Controle Financeiro (Chamados)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/chamados` | Listar (suporta `?mes=&ano=` + região) |
| POST | `/api/v1/chamados` | Criar |
| GET | `/api/v1/chamados/resumo-mensal` | Resumo por mês |
| PUT/DELETE | `/api/v1/chamados/:id` | Editar / Remover |

### Estoque
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/v1/estoque/pecas` | Peças |
| GET/POST | `/api/v1/estoque/entradas` | Entradas (incrementa estoque) |
| GET/POST | `/api/v1/estoque/movimentacoes` | Movimentações (decrementa estoque) |
| GET/POST | `/api/v1/estoque/saidas` | Saídas (decrementa estoque) |

### Dashboard
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/dashboard/resumo` | KPIs (tarefas, financeiro, estoque) |
| GET | `/api/v1/dashboard/historico-mensal` | Histórico 6 meses |
| GET | `/api/v1/dashboard/gastos-por-segmento` | Gastos agrupados |

### Checklists Semanais *(NOVO)*
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/v1/checklists/equipamentos` | Coord+ | Listar checklists de equipamentos |
| GET | `/api/v1/checklists/equipamentos/semana` | Coord+ | Checklist da semana atual |
| POST | `/api/v1/checklists/equipamentos` | **Gestor only** | Criar/atualizar checklist de equipamentos |
| GET | `/api/v1/checklists/equipamentos/kpi` | Coord+ | KPI da semana atual |
| GET | `/api/v1/checklists/carrinhos` | Coord+ | Listar checklists de carrinhos |
| GET | `/api/v1/checklists/carrinhos/semana` | Coord+ | Checklist da semana atual |
| POST | `/api/v1/checklists/carrinhos` | **Gestor only** | Criar/atualizar checklist de carrinhos |
| GET | `/api/v1/checklists/carrinhos/kpi` | Coord+ | KPI da semana atual |
| GET | `/api/v1/checklists/kpi-mensal` | Coord+ | KPI consolidado do mês (Dashboard) |

### Usuários & Fornecedores
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/v1/usuarios` | Gestão de usuários (Admin/Supervisor) |
| PUT | `/api/v1/usuarios/:id` | Editar (suporta campo `regiao`) |
| GET/POST | `/api/v1/fornecedores` | Gestão de fornecedores |

---

## 📋 Checklists Semanais

### Equipamentos verificados
Empilhadeira Elétrica, Empilhadeira a Combustão, Empilhadeira Patolada, Máquina de Moer Carne, Serra Fita, Embaladora a Vácuo, Fatiadora, Fatiadora Grande (JetCut), Elevadores, Ilhaself, Escada Rolante

### Carrinhos verificados
Maria Gorda, Supercar, Dois Andares, Prancha, Prancha Perecíveis, Carrinhos de Abastecimento, Escadas

### Regras de acesso
- **Quem preenche:** somente `GESTOR`
- **Quem visualiza:** `COORDENADOR`, `SUPERVISOR`, `ADMINISTRADOR` — cada um dentro da sua região
- **Preenchimento:** 1x por semana. O sistema usa _upsert_ — o formulário é reeditável na mesma semana
- **Unicidade:** uma entrada por `(semana, ano, regiao)`

---

## 🗂️ Modelos de dados (Prisma)

```
Usuario           — nome, email, senha, role, ativo, regiao
RefreshToken      — rotação automática
Sessao            — controle de sessões
Tarefa            — prioridade, status, região, atribuição
ControleChamado   — segmento, valor, status, mês/ano, região
Fornecedor        — CNPJ, segmento, contato
Peca              — estoque, entradas, movimentações, saídas
EntradaPeca       — NF, fornecedor, quantidade, valor
MovimentacaoPeca  — lojaRequisitante, chamado, status
SaidaPeca         — destino, nomeRetirou, quantidade (decrementa estoque)
Notificacao       — sistema de alertas
ChecklistEquipamento     — semana, ano, regiao (unique por tripla)
ChecklistEquipamentoItem — tipo, operacional, qtd, numSerie, chamado, valor
ChecklistCarrinho        — semana, ano, regiao (unique por tripla)
ChecklistCarrinhoItem    — tipo, total, quebrados, chamado
```

---

## 🔄 Escalabilidade

O sistema foi projetado para escalar horizontalmente:

- **Redis centralizado** → múltiplas instâncias da API compartilham sessões e rate limiting
- **Prisma v7 com connection pooling** via `@prisma/adapter-pg`
- **Singleton do Prisma Client** → evita conexões duplicadas por instância
- **Stateless por JWT** → qualquer instância valida tokens sem coordenação
- Para deploy em múltiplos nós, adicione um load balancer (nginx, AWS ALB) na frente

---

## 🐳 Docker

```yaml
# docker-compose.yml (atual)
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
# Subir
docker compose up -d

# Parar
docker compose down
```

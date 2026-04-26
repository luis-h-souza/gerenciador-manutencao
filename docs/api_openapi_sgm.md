# Sistema de Gerenciamento de Manutenção (SGM) - Especificação OpenAPI 3.0

**Versão:** 1.0.0  
**Data:** Abril 2026  
**Status:** Production  
**URL Base:** `https://api.gerenciador-manutencao.com/api/v1`  
**Ambiente de Teste:** `http://localhost:3001/api/v1`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Rate Limiting](#rate-limiting)
4. [Modelos de Dados](#modelos-de-dados)
5. [Endpoints - Autenticação](#endpoints---autenticação)
6. [Endpoints - Tarefas](#endpoints---tarefas)
7. [Endpoints - Controle Financeiro (Chamados)](#endpoints---controle-financeiro-chamados)
8. [Endpoints - Estoque](#endpoints---estoque)
9. [Endpoints - Dashboard](#endpoints---dashboard)
10. [Endpoints - Checklists](#endpoints---checklists)
11. [Endpoints - Notificações](#endpoints---notificações)
12. [Endpoints - Usuários](#endpoints---usuários)
13. [Endpoints - Lojas](#endpoints---lojas)
14. [Endpoints - Fornecedores](#endpoints---fornecedores)
15. [Códigos de Erro](#códigos-de-erro)
16. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O **Sistema de Gerenciamento de Manutenção (SGM)** é uma plataforma completa para:

- Gerenciamento de tarefas de manutenção
- Controle financeiro de chamados técnicos
- Gestão de estoque de peças
- Checklists semanais de equipamentos e carrinhos
- Cadastro de usuários, lojas e fornecedores
- Notificações em tempo real
- Dashboards executivos com KPIs

### Características Principais

| Aspecto | Detalhe |
|---------|---------|
| **Arquitetura** | REST API Stateless com JWT + Refresh Tokens |
| **Autenticação** | JWT (15 min) + Refresh Token (7 dias) + Sessions |
| **Autorização** | RBAC com 6 roles e isolamento regional |
| **Rate Limiting** | 3 camadas: global, auth, creation |
| **Database** | PostgreSQL 15+ via Prisma ORM |
| **Cache** | Redis 7+ para sessions e rate limiting |
| **CORS** | Whitelist configurável por environment |
| **Headers Segurança** | Helmet.js + CSP, HSTS, X-Frame-Options |

---

## 🔐 Autenticação

### Fluxo de Autenticação

```
1. POST /api/v1/auth/login
   └─ Retorna: { accessToken, refreshToken, user }

2. Use accessToken em Authorization header:
   Authorization: Bearer <accessToken>

3. Quando accessToken expirar (15 min):
   POST /api/v1/auth/refresh
   └─ Retorna novo accessToken + novo refreshToken (rotação)

4. Para logout:
   POST /api/v1/auth/logout
   └─ Revoga o refreshToken atual + todos os tokens do usuário (opcional)
```

### JWT Token Structure

**Access Token (15 minutos):**
```json
{
  "sub": "usuario_id",
  "email": "usuario@manutencao.com",
  "role": "GERENTE",
  "regiao": ["SP1", "SP2"],
  "lojaId": null,
  "iat": 1704067200,
  "exp": 1704068100
}
```

**Refresh Token (7 dias):**
```json
{
  "sub": "usuario_id",
  "type": "refresh",
  "iat": 1704067200,
  "exp": 1704672000
}
```

### Headers Obrigatórios

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Refresh Token Rotation

- Cada request com refresh token gera um novo par (access + refresh)
- Tokens antigos são automaticamente revogados
- Máximo de 5 refresh tokens ativos por usuário (para segurança)
- Logout revoga **todos** os tokens do usuário em todos os dispositivos

---

## 🚦 Rate Limiting

### Camadas de Rate Limiting

| Camada | Limite | Janela | Aplicação |
|--------|--------|--------|-----------|
| **Global** | 100 req | 15 min | Todos os usuários |
| **Auth** | 10 tentativas | 15 min | `/api/v1/auth/login` |
| **Creation** | 20 req | 1 min | POST (criar recursos) |

### Headers de Rate Limit (Resposta)

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704068100
X-RateLimit-RetryAfter: 900
```

### Comportamento

- **Limite atingido**: HTTP 429 (Too Many Requests)
- **Retry-After**: Indica quantos segundos esperar antes do próximo request
- **IP-based**: Rastreamento por IP client (pode estar atrás de proxy)

---

## 📊 Modelos de Dados

### Usuario

```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string",
  "role": "ADMINISTRADOR | DIRETOR | GERENTE | COORDENADOR | GESTOR | TECNICO",
  "regiao": ["string"],
  "lojaId": "uuid | null",
  "ativo": "boolean",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime",
  "ultimoAcesso": "ISO 8601 datetime | null"
}
```

### Tarefa

```json
{
  "id": "uuid",
  "titulo": "string",
  "descricao": "string | null",
  "prioridade": "ALTA | MEDIA | BAIXA",
  "status": "ABERTA | EM_EXECUCAO | CONCLUIDA | CANCELADA",
  "regiao": "string",
  "unidade": "uuid",
  "atribuidoA": "uuid | null",
  "criadoPor": "uuid",
  "dataVencimento": "ISO 8601 date",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime"
}
```

### ControleChamado (Controle Financeiro)

```json
{
  "id": "uuid",
  "numero": "string (unique)",
  "dataAbertura": "ISO 8601 date",
  "dataFechamento": "ISO 8601 date | null",
  "valor": "decimal",
  "status": "ABERTO | FECHADO | CANCELADO",
  "segmento": "ELETRICO | MECANICO | HIDRAULICO | OUTRO",
  "fornecedorId": "uuid",
  "lojaId": "uuid",
  "regiao": "string",
  "mauUso": "boolean",
  "observacoes": "string | null",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime"
}
```

### Notificacao

```json
{
  "id": "uuid",
  "titulo": "string",
  "mensagem": "string",
  "tipo": "TAREFA | CHAMADO | CHECKLIST | SISTEMA",
  "lida": "boolean",
  "tarefaId": "uuid | null",
  "usuarioId": "uuid",
  "criadoEm": "ISO 8601 datetime",
  "lidoEm": "ISO 8601 datetime | null"
}
```

### Fornecedor

```json
{
  "id": "uuid",
  "nome": "string",
  "cnpj": "string (unique, 14 dígitos)",
  "segmento": "ELETRICO | MECANICO | HIDRAULICO | OUTRO",
  "contato": "string | null",
  "email": "string | null",
  "telefone": "string | null",
  "ativo": "boolean",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime"
}
```

### Peca

```json
{
  "id": "uuid",
  "descricao": "string",
  "codigo": "string (unique)",
  "estoque": "integer",
  "estoqueMinimo": "integer",
  "valor": "decimal",
  "ativo": "boolean",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime"
}
```

### EntradaPeca

```json
{
  "id": "uuid",
  "pecaId": "uuid",
  "fornecedorId": "uuid",
  "numeroNF": "string",
  "quantidade": "integer",
  "valorUnitario": "decimal",
  "dataEntrada": "ISO 8601 date",
  "criadoEm": "ISO 8601 datetime"
}
```

### MovimentacaoPeca

```json
{
  "id": "uuid",
  "pecaId": "uuid",
  "lojaRequisitante": "uuid",
  "chamadoId": "uuid | null",
  "quantidade": "integer",
  "status": "PENDENTE | RECEBIDO | CANCELADO",
  "criadoEm": "ISO 8601 datetime",
  "recebidoEm": "ISO 8601 datetime | null"
}
```

### SaidaPeca

```json
{
  "id": "uuid",
  "pecaId": "uuid",
  "destino": "string",
  "nomeRetirou": "string",
  "quantidade": "integer",
  "dataRetirada": "ISO 8601 date",
  "criadoEm": "ISO 8601 datetime"
}
```

### ChecklistEquipamento

```json
{
  "id": "uuid",
  "semana": "integer",
  "ano": "integer",
  "regiao": "string",
  "unidade": "uuid",
  "preenchidoPor": "uuid",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime",
  "itens": [
    {
      "id": "uuid",
      "tipo": "string",
      "operacional": "boolean",
      "quantidade": "integer",
      "quantidadeQuebrada": "integer",
      "numeroSerie": "string | null",
      "chamadoId": "uuid | null",
      "valor": "decimal"
    }
  ]
}
```

### ChecklistCarrinho

```json
{
  "id": "uuid",
  "semana": "integer",
  "ano": "integer",
  "regiao": "string",
  "unidade": "uuid",
  "preenchidoPor": "uuid",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime",
  "itens": [
    {
      "id": "uuid",
      "tipo": "string",
      "total": "integer",
      "quebrados": "integer",
      "chamadoId": "uuid | null"
    }
  ]
}
```

### Loja

```json
{
  "id": "uuid",
  "nome": "string",
  "regiao": "string",
  "cidade": "string",
  "estado": "string",
  "endereco": "string",
  "ativa": "boolean",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime"
}
```

---

## 📡 Endpoints - Autenticação

### 1. Login

**POST** `/auth/login`

Autentica um usuário e retorna tokens de acesso e refresh.

#### Request

```json
{
  "email": "usuario@manutencao.com",
  "senha": "Senha@123"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "João Gerente",
      "email": "usuario@manutencao.com",
      "role": "GERENTE",
      "regiao": ["SP1", "SP2"],
      "lojaId": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

#### Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Email ou senha inválidos"
}
```

#### cURL

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gerente@manutencao.com",
    "senha": "Senha@123"
  }'
```

---

### 2. Refresh Token

**POST** `/auth/refresh`

Renova o access token usando o refresh token (com rotação automática).

#### Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

#### Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token inválido ou expirado"
}
```

---

### 3. Logout

**POST** `/auth/logout`

Revoga o refresh token atual (e opcionalmente todos os tokens do usuário).

#### Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "revokeAll": false
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### cURL

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "revokeAll": false
  }'
```

---

### 4. Obter Dados do Usuário Autenticado

**GET** `/auth/me`

Retorna os dados do usuário autenticado.

#### Request Headers

```http
Authorization: Bearer {accessToken}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Gerente",
    "email": "usuario@manutencao.com",
    "role": "GERENTE",
    "regiao": ["SP1", "SP2"],
    "lojaId": null,
    "ativo": true,
    "criadoEm": "2026-01-15T10:30:00Z",
    "ultimoAcesso": "2026-04-26T14:22:15Z"
  }
}
```

#### cURL

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## 📝 Endpoints - Tarefas

### 1. Listar Tarefas

**GET** `/tarefas`

Lista tarefas com filtros. Retorna apenas tarefas acessíveis ao usuário (filtradas por região).

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `status` | string | Não | Filtrar por status: `ABERTA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA` |
| `prioridade` | string | Não | Filtrar por prioridade: `ALTA`, `MEDIA`, `BAIXA` |
| `atribuidoA` | uuid | Não | Filtrar por usuário atribuído |
| `regiao` | string | Não | Filtrar por região (GERENTE+ pode escolher) |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20, máx: 100) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "titulo": "Manutenção preventiva empilhadeira elétrica",
      "descricao": "Verificação de bateria e sistema hidráulico",
      "prioridade": "ALTA",
      "status": "EM_EXECUCAO",
      "regiao": "SP1",
      "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "atribuidoA": "550e8400-e29b-41d4-a716-446655440001",
      "criadoPor": "550e8400-e29b-41d4-a716-446655440002",
      "dataVencimento": "2026-04-30",
      "criadoEm": "2026-04-20T09:00:00Z",
      "atualizadoEm": "2026-04-25T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

#### cURL

```bash
curl -X GET "http://localhost:3001/api/v1/tarefas?status=EM_EXECUCAO&prioridade=ALTA&skip=0&take=20" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2. Criar Tarefa

**POST** `/tarefas`

Cria uma nova tarefa. A região é herdada do criador (exceto ADMINISTRADOR que pode escolher).

#### Request

```json
{
  "titulo": "Manutenção preventiva empilhadeira elétrica",
  "descricao": "Verificação de bateria e sistema hidráulico",
  "prioridade": "ALTA",
  "regiao": "SP1",
  "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
  "atribuidoA": "550e8400-e29b-41d4-a716-446655440001",
  "dataVencimento": "2026-04-30"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Manutenção preventiva empilhadeira elétrica",
    "descricao": "Verificação de bateria e sistema hidráulico",
    "prioridade": "ALTA",
    "status": "ABERTA",
    "regiao": "SP1",
    "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
    "atribuidoA": "550e8400-e29b-41d4-a716-446655440001",
    "criadoPor": "550e8400-e29b-41d4-a716-446655440002",
    "dataVencimento": "2026-04-30",
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  },
  "notification": {
    "usuarioId": "550e8400-e29b-41d4-a716-446655440001",
    "titulo": "Nova tarefa atribuída a você",
    "mensagem": "Manutenção preventiva empilhadeira elétrica"
  }
}
```

#### Response (403 Forbidden)

```json
{
  "success": false,
  "error": "UNAUTHORIZED_REGION",
  "message": "Você não tem permissão para criar tarefas nesta região"
}
```

---

### 3. Obter Tarefa por ID

**GET** `/tarefas/{id}`

Retorna os detalhes de uma tarefa específica (se acessível).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Manutenção preventiva empilhadeira elétrica",
    "descricao": "Verificação de bateria e sistema hidráulico",
    "prioridade": "ALTA",
    "status": "EM_EXECUCAO",
    "regiao": "SP1",
    "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
    "atribuidoA": "550e8400-e29b-41d4-a716-446655440001",
    "criadoPor": "550e8400-e29b-41d4-a716-446655440002",
    "dataVencimento": "2026-04-30",
    "criadoEm": "2026-04-20T09:00:00Z",
    "atualizadoEm": "2026-04-25T15:30:00Z"
  }
}
```

---

### 4. Atualizar Tarefa

**PUT** `/tarefas/{id}`

Atualiza uma tarefa. Notifica o usuário se o status mudar.

#### Request

```json
{
  "titulo": "Manutenção preventiva empilhadeira elétrica (URGENT)",
  "status": "CONCLUIDA",
  "prioridade": "ALTA"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Manutenção preventiva empilhadeira elétrica (URGENT)",
    "status": "CONCLUIDA",
    "prioridade": "ALTA",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  },
  "notification": {
    "usuarioId": "550e8400-e29b-41d4-a716-446655440001",
    "titulo": "Tarefa concluída",
    "mensagem": "Manutenção preventiva empilhadeira elétrica (URGENT)"
  }
}
```

---

### 5. Deletar Tarefa

**DELETE** `/tarefas/{id}`

Remove uma tarefa (soft delete).

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tarefa deletada com sucesso"
}
```

---

## 💰 Endpoints - Controle Financeiro (Chamados)

### 1. Listar Chamados

**GET** `/chamados`

Lista chamados com filtros de período e região.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `mes` | integer | Não | Mês (1-12) |
| `ano` | integer | Não | Ano (ex: 2026) |
| `regiao` | string | Não | Filtrar por região |
| `segmento` | string | Não | Filtrar por segmento: `ELETRICO`, `MECANICO`, `HIDRAULICO`, `OUTRO` |
| `status` | string | Não | Filtrar por status: `ABERTO`, `FECHADO`, `CANCELADO` |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "numero": "CHM-2026-0001",
      "dataAbertura": "2026-04-15",
      "dataFechamento": "2026-04-20",
      "valor": 1500.00,
      "status": "FECHADO",
      "segmento": "ELETRICO",
      "fornecedor": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Elétrica Silva LTDA"
      },
      "loja": {
        "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
        "nome": "Loja SP7"
      },
      "regiao": "SP1",
      "mauUso": false,
      "observacoes": "Troca de motor elétrico",
      "criadoEm": "2026-04-15T08:00:00Z",
      "atualizadoEm": "2026-04-20T17:00:00Z"
    }
  ],
  "pagination": {
    "total": 125,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

#### cURL

```bash
curl -X GET "http://localhost:3001/api/v1/chamados?mes=4&ano=2026&regiao=SP1&skip=0&take=20" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2. Criar Chamado

**POST** `/chamados`

Cria um novo chamado de manutenção/reparo.

#### Request

```json
{
  "numero": "CHM-2026-0045",
  "dataAbertura": "2026-04-26",
  "valor": 2500.00,
  "segmento": "MECANICO",
  "fornecedorId": "770e8400-e29b-41d4-a716-446655440000",
  "lojaId": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
  "mauUso": false,
  "observacoes": "Manutenção preventiva de equipamentos"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "numero": "CHM-2026-0045",
    "dataAbertura": "2026-04-26",
    "dataFechamento": null,
    "valor": 2500.00,
    "status": "ABERTO",
    "segmento": "MECANICO",
    "fornecedor": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "nome": "Mecânica Industrial"
    },
    "loja": {
      "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "nome": "Loja SP7"
    },
    "regiao": "SP1",
    "mauUso": false,
    "observacoes": "Manutenção preventiva de equipamentos",
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 3. Atualizar Chamado

**PUT** `/chamados/{id}`

Atualiza um chamado.

#### Request

```json
{
  "status": "FECHADO",
  "dataFechamento": "2026-04-26",
  "observacoes": "Serviço concluído com sucesso"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "numero": "CHM-2026-0045",
    "status": "FECHADO",
    "dataFechamento": "2026-04-26",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 4. Deletar Chamado

**DELETE** `/chamados/{id}`

Remove um chamado.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Chamado deletado com sucesso"
}
```

---

### 5. Resumo de Chamados por Mês

**GET** `/chamados/resumo`

Retorna resumo consolidado de chamados por mês.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `mes` | integer | Sim | Mês (1-12) |
| `ano` | integer | Sim | Ano (ex: 2026) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "mes": 4,
    "ano": 2026,
    "totalChamados": 45,
    "valorTotal": 125000.00,
    "mediaPorChamado": 2777.78,
    "chamadosMauUso": 3,
    "segmentos": {
      "ELETRICO": {
        "quantidade": 18,
        "valor": 45000.00,
        "percentual": 36.0
      },
      "MECANICO": {
        "quantidade": 15,
        "valor": 50000.00,
        "percentual": 40.0
      },
      "HIDRAULICO": {
        "quantidade": 10,
        "valor": 25000.00,
        "percentual": 20.0
      },
      "OUTRO": {
        "quantidade": 2,
        "valor": 5000.00,
        "percentual": 4.0
      }
    },
    "topFornecedores": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Mecânica Industrial",
        "quantidade": 15,
        "valor": 50000.00,
        "percentual": 40.0
      }
    ]
  }
}
```

---

## 📦 Endpoints - Estoque

### 1. Listar Peças

**GET** `/estoque/pecas`

Lista peças do estoque.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `codigo` | string | Não | Filtrar por código (parcial) |
| `descricao` | string | Não | Filtrar por descrição (parcial) |
| `emAlerta` | boolean | Não | Mostrar apenas peças abaixo do mínimo |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "descricao": "Corrente de transmissão 40mm",
      "codigo": "COR-040-001",
      "estoque": 5,
      "estoqueMinimo": 10,
      "emAlerta": true,
      "valor": 150.00,
      "ativo": true,
      "criadoEm": "2025-06-10T10:00:00Z",
      "atualizadoEm": "2026-04-20T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 2. Criar Peça

**POST** `/estoque/pecas`

Cria uma nova peça no estoque.

#### Request

```json
{
  "descricao": "Corrente de transmissão 40mm",
  "codigo": "COR-040-001",
  "estoqueMinimo": 10,
  "valor": 150.00
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "descricao": "Corrente de transmissão 40mm",
    "codigo": "COR-040-001",
    "estoque": 0,
    "estoqueMinimo": 10,
    "valor": 150.00,
    "ativo": true,
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 3. Listar Entradas (Notas Fiscais)

**GET** `/estoque/entradas`

Lista entradas de peças (aumenta estoque).

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `fornecedorId` | uuid | Não | Filtrar por fornecedor |
| `dataInicio` | date | Não | Filtrar por data (>=) |
| `dataFim` | date | Não | Filtrar por data (<=) |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "peca": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "descricao": "Corrente de transmissão 40mm",
        "codigo": "COR-040-001"
      },
      "fornecedor": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "nome": "Distribuidor Mecânico"
      },
      "numeroNF": "NF-2026-000123",
      "quantidade": 50,
      "valorUnitario": 150.00,
      "valorTotal": 7500.00,
      "dataEntrada": "2026-04-20",
      "criadoEm": "2026-04-20T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 85,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 4. Criar Entrada (Nota Fiscal)

**POST** `/estoque/entradas`

Cria uma entrada de peça (incrementa estoque).

#### Request

```json
{
  "pecaId": "880e8400-e29b-41d4-a716-446655440000",
  "fornecedorId": "770e8400-e29b-41d4-a716-446655440000",
  "numeroNF": "NF-2026-000124",
  "quantidade": 30,
  "valorUnitario": 150.00,
  "dataEntrada": "2026-04-26"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "peca": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "descricao": "Corrente de transmissão 40mm",
      "estoque": 35
    },
    "numeroNF": "NF-2026-000124",
    "quantidade": 30,
    "valorUnitario": 150.00,
    "dataEntrada": "2026-04-26",
    "criadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 5. Listar Movimentações

**GET** `/estoque/movimentacoes`

Lista movimentações de peças entre lojas (status: PENDENTE, RECEBIDO, CANCELADO).

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "peca": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "descricao": "Corrente de transmissão 40mm"
      },
      "lojaRequisitante": {
        "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
        "nome": "Loja SP7"
      },
      "chamado": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "numero": "CHM-2026-0045"
      },
      "quantidade": 5,
      "status": "PENDENTE",
      "criadoEm": "2026-04-25T10:00:00Z",
      "recebidoEm": null
    }
  ],
  "pagination": {
    "total": 42,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 6. Criar Movimentação

**POST** `/estoque/movimentacoes`

Cria uma movimentação de peça para uma loja requisitante.

#### Request

```json
{
  "pecaId": "880e8400-e29b-41d4-a716-446655440000",
  "lojaRequisitanteId": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
  "chamadoId": "660e8400-e29b-41d4-a716-446655440000",
  "quantidade": 5
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "peca": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "descricao": "Corrente de transmissão 40mm"
    },
    "quantidade": 5,
    "status": "PENDENTE",
    "criadoEm": "2026-04-26T14:22:15Z",
    "recebidoEm": null
  }
}
```

---

### 7. Listar Saídas Definitivas

**GET** `/estoque/saidas`

Lista saídas definitivas de peças (sem possibilidade de devolução).

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440000",
      "peca": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "descricao": "Corrente de transmissão 40mm"
      },
      "destino": "Loja SP7",
      "nomeRetirou": "Carlos Silva",
      "quantidade": 10,
      "dataRetirada": "2026-04-25",
      "criadoEm": "2026-04-25T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 127,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 8. Criar Saída Definitiva

**POST** `/estoque/saidas`

Cria uma saída definitiva de peça.

#### Request

```json
{
  "pecaId": "880e8400-e29b-41d4-a716-446655440000",
  "destino": "Loja SP7",
  "nomeRetirou": "Carlos Silva",
  "quantidade": 10,
  "dataRetirada": "2026-04-26"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440000",
    "peca": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "descricao": "Corrente de transmissão 40mm",
      "estoque": 25
    },
    "destino": "Loja SP7",
    "nomeRetirou": "Carlos Silva",
    "quantidade": 10,
    "dataRetirada": "2026-04-26",
    "criadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

## 📊 Endpoints - Dashboard

### 1. Resumo de KPIs

**GET** `/dashboard/resumo`

Retorna KPIs executivos personalizados por role do usuário.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalChamadosAbertos": 12,
      "valorEmAberto": 45000.00,
      "totalTarefas": 28,
      "tarefasVencidas": 2,
      "tarefasEmAtraso": 5,
      "percentualChecklists": 85
    },
    "pecasEmAlerta": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "descricao": "Corrente de transmissão 40mm",
        "codigo": "COR-040-001",
        "estoque": 5,
        "estoqueMinimo": 10,
        "deficit": 5
      }
    ],
    "periodo": {
      "mes": 4,
      "ano": 2026
    }
  }
}
```

---

### 2. Histórico Mensal (6 meses)

**GET** `/dashboard/historico-mensal`

Retorna histórico de gastos dos últimos 6 meses.

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "mes": 11,
      "ano": 2025,
      "totalGasto": 85000.00,
      "chamados": 32,
      "mediaGasto": 2656.25
    },
    {
      "mes": 12,
      "ano": 2025,
      "totalGasto": 92000.00,
      "chamados": 35,
      "mediaGasto": 2628.57
    },
    {
      "mes": 1,
      "ano": 2026,
      "totalGasto": 78000.00,
      "chamados": 28,
      "mediaGasto": 2785.71
    },
    {
      "mes": 2,
      "ano": 2026,
      "totalGasto": 105000.00,
      "chamados": 38,
      "mediaGasto": 2763.16
    },
    {
      "mes": 3,
      "ano": 2026,
      "totalGasto": 98000.00,
      "chamados": 33,
      "mediaGasto": 2969.70
    },
    {
      "mes": 4,
      "ano": 2026,
      "totalGasto": 125000.00,
      "chamados": 45,
      "mediaGasto": 2777.78
    }
  ]
}
```

---

### 3. Gastos por Segmento

**GET** `/dashboard/gastos-por-segmento`

Retorna distribuição de gastos por segmento (ELETRICO, MECANICO, HIDRAULICO, OUTRO).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "mes": 4,
    "ano": 2026,
    "totalGasto": 125000.00,
    "segmentos": [
      {
        "segmento": "MECANICO",
        "valor": 50000.00,
        "percentual": 40.0,
        "quantidade": 15
      },
      {
        "segmento": "ELETRICO",
        "valor": 45000.00,
        "percentual": 36.0,
        "quantidade": 18
      },
      {
        "segmento": "HIDRAULICO",
        "valor": 25000.00,
        "percentual": 20.0,
        "quantidade": 10
      },
      {
        "segmento": "OUTRO",
        "valor": 5000.00,
        "percentual": 4.0,
        "quantidade": 2
      }
    ]
  }
}
```

---

### 4. Visão Regional

**GET** `/dashboard/regional`

Retorna visão consolidada por regional (acesso corporativo).

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `regiao` | string | Não | Filtrar por região específica |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "regionais": [
      {
        "nome": "SP1",
        "totalGasto": 55000.00,
        "chamados": 20,
        "lojas": 4,
        "percentualGasto": 44.0,
        "topLojaCritica": {
          "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
          "nome": "Loja SP7",
          "gasto": 18000.00
        },
        "coordenadorScore": 85
      },
      {
        "nome": "SP2",
        "totalGasto": 70000.00,
        "chamados": 25,
        "lojas": 5,
        "percentualGasto": 56.0,
        "topLojaCritica": {
          "id": "9d6c2b50-4g3e-5f0d-9e6b-2c3d4e5f6g7b",
          "nome": "Loja SP10",
          "gasto": 22000.00
        },
        "coordenadorScore": 72
      }
    ],
    "totalGeral": 125000.00
  }
}
```

---

## ✅ Endpoints - Checklists

### 1. Listar Checklists de Equipamentos

**GET** `/checklists/equipamentos`

Lista checklists semanais de equipamentos.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `regiao` | string | Não | Filtrar por região |
| `unidade` | uuid | Não | Filtrar por unidade/loja |
| `semana` | integer | Não | Filtrar por semana (1-52) |
| `ano` | integer | Não | Filtrar por ano |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "semana": 17,
      "ano": 2026,
      "regiao": "SP1",
      "unidade": {
        "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
        "nome": "Loja SP7"
      },
      "preenchidoPor": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "nome": "Maria Gestora"
      },
      "itens": [
        {
          "id": "dd0e8400-e29b-41d4-a716-446655440000",
          "tipo": "Empilhadeira Elétrica",
          "operacional": true,
          "quantidade": 3,
          "quantidadeQuebrada": 0,
          "numeroSerie": "EMP-001",
          "chamadoId": null,
          "valor": 0.00
        }
      ],
      "criadoEm": "2026-04-21T09:00:00Z",
      "atualizadoEm": "2026-04-21T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 2. Obter Checklist da Semana (Equipamentos)

**GET** `/checklists/equipamentos/semana`

Retorna checklist da semana atual para equipamentos.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "semana": 17,
    "ano": 2026,
    "regiao": "SP1",
    "unidade": {
      "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "nome": "Loja SP7"
    },
    "preenchidoPor": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "nome": "Maria Gestora"
    },
    "itens": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "tipo": "Empilhadeira Elétrica",
        "operacional": true,
        "quantidade": 3,
        "quantidadeQuebrada": 0,
        "numeroSerie": "EMP-001",
        "chamadoId": null,
        "valor": 0.00
      },
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440000",
        "tipo": "Serra Fita",
        "operacional": false,
        "quantidade": 1,
        "quantidadeQuebrada": 1,
        "numeroSerie": "SF-002",
        "chamadoId": "660e8400-e29b-41d4-a716-446655440000",
        "valor": 500.00
      }
    ],
    "criadoEm": "2026-04-21T09:00:00Z",
    "atualizadoEm": "2026-04-21T14:30:00Z"
  }
}
```

---

### 3. Criar/Atualizar Checklist de Equipamentos

**POST** `/checklists/equipamentos`

Cria ou atualiza (upsert) checklist de equipamentos. Apenas GESTOR pode preencher.

#### Request

```json
{
  "semana": 17,
  "ano": 2026,
  "regiao": "SP1",
  "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
  "itens": [
    {
      "tipo": "Empilhadeira Elétrica",
      "operacional": true,
      "quantidade": 3,
      "quantidadeQuebrada": 0,
      "numeroSerie": "EMP-001",
      "chamadoId": null,
      "valor": 0.00
    },
    {
      "tipo": "Serra Fita",
      "operacional": false,
      "quantidade": 1,
      "quantidadeQuebrada": 1,
      "numeroSerie": "SF-002",
      "chamadoId": "660e8400-e29b-41d4-a716-446655440000",
      "valor": 500.00
    }
  ]
}
```

#### Response (201 Created / 200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440000",
    "semana": 17,
    "ano": 2026,
    "regiao": "SP1",
    "unidade": {
      "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "nome": "Loja SP7"
    },
    "preenchidoPor": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "nome": "Maria Gestora"
    },
    "itens": [
      {
        "tipo": "Empilhadeira Elétrica",
        "operacional": true,
        "quantidade": 3,
        "quantidadeQuebrada": 0,
        "numeroSerie": "EMP-001",
        "chamadoId": null,
        "valor": 0.00
      },
      {
        "tipo": "Serra Fita",
        "operacional": false,
        "quantidade": 1,
        "quantidadeQuebrada": 1,
        "numeroSerie": "SF-002",
        "chamadoId": "660e8400-e29b-41d4-a716-446655440000",
        "valor": 500.00
      }
    ],
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

#### Response (403 Forbidden - Não é GESTOR)

```json
{
  "success": false,
  "error": "UNAUTHORIZED_ROLE",
  "message": "Apenas GESTOR pode preencher checklists"
}
```

---

### 4. Obter KPI da Semana (Equipamentos)

**GET** `/checklists/equipamentos/kpi`

Retorna KPI consolidado da semana para equipamentos.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "semana": 17,
    "ano": 2026,
    "totalUnidades": 8,
    "unidadesPreenchidas": 7,
    "percentualCobertura": 87.5,
    "equipamentosQuebrados": 3,
    "valorProvisorio": 1500.00,
    "tendencia": "MELHORANDO"
  }
}
```

---

### 5. Listar Checklists de Carrinhos

**GET** `/checklists/carrinhos`

Lista checklists semanais de carrinhos.

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "semana": 17,
      "ano": 2026,
      "regiao": "SP1",
      "unidade": {
        "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
        "nome": "Loja SP7"
      },
      "preenchidoPor": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "nome": "Maria Gestora"
      },
      "itens": [
        {
          "id": "gg0e8400-e29b-41d4-a716-446655440000",
          "tipo": "Maria Gorda",
          "total": 5,
          "quebrados": 1,
          "chamadoId": "660e8400-e29b-41d4-a716-446655440000"
        }
      ],
      "criadoEm": "2026-04-21T09:00:00Z",
      "atualizadoEm": "2026-04-21T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 6. Criar/Atualizar Checklist de Carrinhos

**POST** `/checklists/carrinhos`

Cria ou atualiza (upsert) checklist de carrinhos. Apenas GESTOR pode preencher.

#### Request

```json
{
  "semana": 17,
  "ano": 2026,
  "regiao": "SP1",
  "unidade": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
  "itens": [
    {
      "tipo": "Maria Gorda",
      "total": 5,
      "quebrados": 1,
      "chamadoId": "660e8400-e29b-41d4-a716-446655440000"
    },
    {
      "tipo": "Supercar",
      "total": 3,
      "quebrados": 0,
      "chamadoId": null
    }
  ]
}
```

#### Response (201 Created / 200 OK)

```json
{
  "success": true,
  "data": {
    "id": "ff0e8400-e29b-41d4-a716-446655440000",
    "semana": 17,
    "ano": 2026,
    "regiao": "SP1",
    "unidade": {
      "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "nome": "Loja SP7"
    },
    "preenchidoPor": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "nome": "Maria Gestora"
    },
    "itens": [
      {
        "tipo": "Maria Gorda",
        "total": 5,
        "quebrados": 1,
        "chamadoId": "660e8400-e29b-41d4-a716-446655440000"
      },
      {
        "tipo": "Supercar",
        "total": 3,
        "quebrados": 0,
        "chamadoId": null
      }
    ],
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 7. Obter KPI da Semana (Carrinhos)

**GET** `/checklists/carrinhos/kpi`

Retorna KPI consolidado da semana para carrinhos.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "semana": 17,
    "ano": 2026,
    "totalUnidades": 8,
    "unidadesPreenchidas": 7,
    "percentualCobertura": 87.5,
    "carrinhosQuebrados": 2,
    "tendencia": "ESTAVEL"
  }
}
```

---

### 8. Obter KPI Mensal Consolidado

**GET** `/checklists/kpi-mensal`

Retorna KPI consolidado do mês atual (equipamentos + carrinhos).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "mes": 4,
    "ano": 2026,
    "equipamentos": {
      "cobertura": 87.5,
      "unidadesPreenchidas": 28,
      "unidadesTotal": 32,
      "equipamentosQuebrados": 12,
      "valorProvisorio": 6000.00
    },
    "carrinhos": {
      "cobertura": 91.0,
      "unidadesPreenchidas": 29,
      "unidadesTotal": 32,
      "carrinhosQuebrados": 8
    },
    "correlacao": {
      "mesAnterior": {
        "mes": 3,
        "ano": 2026,
        "coberturaEquipamentos": 82.0,
        "coberturaCarrinhos": 85.0,
        "gastoManutenção": 95000.00
      },
      "insight": "Cobertura de checklists aumentou 5%, mas gastos também cresceram 31%. Investigar possível correlação com equipamentos que não foram verificados."
    }
  }
}
```

---

## 🔔 Endpoints - Notificações

### 1. Listar Notificações do Usuário

**GET** `/notificacoes`

Lista notificações do usuário autenticado (paginado).

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lida` | boolean | Não | Filtrar por status de leitura |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "hh0e8400-e29b-41d4-a716-446655440000",
      "titulo": "Nova tarefa atribuída a você",
      "mensagem": "Manutenção preventiva empilhadeira elétrica",
      "tipo": "TAREFA",
      "lida": false,
      "tarefaId": "550e8400-e29b-41d4-a716-446655440000",
      "usuarioId": "550e8400-e29b-41d4-a716-446655440001",
      "criadoEm": "2026-04-26T14:00:00Z",
      "lidoEm": null
    },
    {
      "id": "ii0e8400-e29b-41d4-a716-446655440000",
      "titulo": "Chamado aberto",
      "mensagem": "Novo chamado na loja SP7: Reparo de serra fita",
      "tipo": "CHAMADO",
      "lida": true,
      "tarefaId": null,
      "usuarioId": "550e8400-e29b-41d4-a716-446655440001",
      "criadoEm": "2026-04-25T10:30:00Z",
      "lidoEm": "2026-04-25T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "skip": 0,
    "take": 20,
    "hasMore": true,
    "naoLidas": 8
  }
}
```

#### cURL

```bash
curl -X GET "http://localhost:3001/api/v1/notificacoes?lida=false&skip=0&take=20" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2. Marcar Notificação como Lida

**PATCH** `/notificacoes/{id}/lida`

Marca uma notificação específica como lida.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "hh0e8400-e29b-41d4-a716-446655440000",
    "titulo": "Nova tarefa atribuída a você",
    "mensagem": "Manutenção preventiva empilhadeira elétrica",
    "lida": true,
    "lidoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 3. Marcar Todas as Notificações como Lidas

**PATCH** `/notificacoes/marcar-todas-lidas`

Marca todas as notificações do usuário como lidas em uma única requisição.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalAtualizadas": 8,
    "message": "Todas as notificações foram marcadas como lidas"
  }
}
```

#### cURL

```bash
curl -X PATCH http://localhost:3001/api/v1/notificacoes/marcar-todas-lidas \
  -H "Authorization: Bearer <accessToken>"
```

---

## 👥 Endpoints - Usuários

### 1. Listar Usuários

**GET** `/usuarios`

Lista usuários do sistema. Filtragem e visibilidade dependem do role do usuário autenticado.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `role` | string | Não | Filtrar por role |
| `regiao` | string | Não | Filtrar por região |
| `ativo` | boolean | Não | Filtrar por status ativo/inativo |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "João Gerente",
      "email": "gerente@manutencao.com",
      "role": "GERENTE",
      "regiao": ["SP1", "SP2"],
      "lojaId": null,
      "ativo": true,
      "criadoEm": "2026-01-15T10:30:00Z",
      "ultimoAcesso": "2026-04-26T14:22:15Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "nome": "Maria Gestora",
      "email": "gestor@manutencao.com",
      "role": "GESTOR",
      "regiao": ["SP1"],
      "lojaId": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "ativo": true,
      "criadoEm": "2026-02-10T09:15:00Z",
      "ultimoAcesso": "2026-04-26T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 28,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

#### Regras de Acesso

| Role | Pode Listar |
|------|------------|
| ADMINISTRADOR | Todos os usuários |
| DIRETOR | Todos os usuários |
| GERENTE | Usuários de suas regionais |
| COORDENADOR | Usuários de suas regionais |
| GESTOR | Apenas a si mesmo |
| TECNICO | Apenas a si mesmo |

---

### 2. Criar Usuário

**POST** `/usuarios`

Cria um novo usuário. Apenas ADMINISTRADOR pode criar.

#### Request

```json
{
  "nome": "Pedro Coordenador",
  "email": "coordenador.pedro@manutencao.com",
  "senha": "Senha@123",
  "role": "COORDENADOR",
  "regiao": ["SP1", "SP2"],
  "lojaId": null
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "nome": "Pedro Coordenador",
    "email": "coordenador.pedro@manutencao.com",
    "role": "COORDENADOR",
    "regiao": ["SP1", "SP2"],
    "lojaId": null,
    "ativo": true,
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

#### Response (403 Forbidden)

```json
{
  "success": false,
  "error": "UNAUTHORIZED_ROLE",
  "message": "Apenas ADMINISTRADOR pode criar usuários"
}
```

---

### 3. Obter Usuário por ID

**GET** `/usuarios/{id}`

Retorna detalhes de um usuário específico (se acessível).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Gerente",
    "email": "gerente@manutencao.com",
    "role": "GERENTE",
    "regiao": ["SP1", "SP2"],
    "lojaId": null,
    "ativo": true,
    "criadoEm": "2026-01-15T10:30:00Z",
    "ultimoAcesso": "2026-04-26T14:22:15Z"
  }
}
```

---

### 4. Atualizar Usuário

**PUT** `/usuarios/{id}`

Atualiza dados de um usuário. ADMINISTRADOR pode editar qualquer usuário; DIRETOR pode editar usuários de suas regiões.

#### Request

```json
{
  "nome": "João Gerente Silva",
  "regiao": ["SP1", "SP2", "SP3"],
  "ativo": true
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Gerente Silva",
    "email": "gerente@manutencao.com",
    "role": "GERENTE",
    "regiao": ["SP1", "SP2", "SP3"],
    "lojaId": null,
    "ativo": true,
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 5. Deletar (Desativar) Usuário

**DELETE** `/usuarios/{id}`

Desativa um usuário (soft delete). Apenas ADMINISTRADOR pode fazer isso.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Usuário desativado com sucesso"
}
```

---

## 🏪 Endpoints - Lojas

### 1. Listar Lojas

**GET** `/lojas`

Lista lojas do sistema. Acesso filtrado por região para COORDENADOR.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `regiao` | string | Não | Filtrar por região |
| `ativa` | boolean | Não | Filtrar por status |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
      "nome": "Loja SP7",
      "regiao": "SP1",
      "cidade": "São Paulo",
      "estado": "SP",
      "endereco": "Rua das Flores, 123",
      "ativa": true,
      "criadoEm": "2025-06-10T10:00:00Z",
      "atualizadoEm": "2026-04-20T15:30:00Z"
    },
    {
      "id": "9d6c2b50-4g3e-5f0d-9e6b-2c3d4e5f6g7b",
      "nome": "Loja SP10",
      "regiao": "SP2",
      "cidade": "Campinas",
      "estado": "SP",
      "endereco": "Avenida Principal, 456",
      "ativa": true,
      "criadoEm": "2025-06-10T10:00:00Z",
      "atualizadoEm": "2026-04-20T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

---

### 2. Listar Regiões Disponíveis

**GET** `/lojas/regioes`

Retorna lista de regiões para filtros e formulários.

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "codigo": "SP1",
      "nome": "São Paulo - Zona 1",
      "quantidadeLojas": 8
    },
    {
      "codigo": "SP2",
      "nome": "São Paulo - Zona 2",
      "quantidadeLojas": 6
    },
    {
      "codigo": "SP3",
      "nome": "São Paulo - Zona 3",
      "quantidadeLojas": 5
    },
    {
      "codigo": "MG1",
      "nome": "Minas Gerais",
      "quantidadeLojas": 4
    }
  ]
}
```

---

### 3. Obter Loja por ID

**GET** `/lojas/{id}`

Retorna detalhes de uma loja específica (com restrição regional para COORDENADOR).

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
    "nome": "Loja SP7",
    "regiao": "SP1",
    "cidade": "São Paulo",
    "estado": "SP",
    "endereco": "Rua das Flores, 123",
    "ativa": true,
    "criadoEm": "2025-06-10T10:00:00Z",
    "atualizadoEm": "2026-04-20T15:30:00Z"
  }
}
```

---

### 4. Criar Loja

**POST** `/lojas`

Cria uma nova loja. Apenas ADMINISTRADOR e DIRETOR podem criar.

#### Request

```json
{
  "nome": "Loja SP15",
  "regiao": "SP1",
  "cidade": "São Paulo",
  "estado": "SP",
  "endereco": "Avenida Nova, 789"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "nome": "Loja SP15",
    "regiao": "SP1",
    "cidade": "São Paulo",
    "estado": "SP",
    "endereco": "Avenida Nova, 789",
    "ativa": true,
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 5. Atualizar Loja

**PUT** `/lojas/{id}`

Atualiza dados de uma loja. Apenas ADMINISTRADOR e DIRETOR.

#### Request

```json
{
  "nome": "Loja SP7 - Nova Localização",
  "endereco": "Rua das Flores, 999",
  "ativa": true
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
    "nome": "Loja SP7 - Nova Localização",
    "regiao": "SP1",
    "cidade": "São Paulo",
    "estado": "SP",
    "endereco": "Rua das Flores, 999",
    "ativa": true,
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 6. Deletar Loja

**DELETE** `/lojas/{id}`

Remove uma loja. Apenas ADMINISTRADOR e DIRETOR.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Loja deletada com sucesso"
}
```

---

## 🔧 Endpoints - Fornecedores

### 1. Listar Fornecedores

**GET** `/fornecedores`

Lista fornecedores cadastrados.

#### Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `segmento` | string | Não | Filtrar por segmento: `ELETRICO`, `MECANICO`, `HIDRAULICO`, `OUTRO` |
| `ativo` | boolean | Não | Filtrar por status |
| `skip` | integer | Não | Paginação: offset (padrão: 0) |
| `take` | integer | Não | Paginação: limit (padrão: 20) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "nome": "Mecânica Industrial LTDA",
      "cnpj": "12345678000190",
      "segmento": "MECANICO",
      "contato": "João Silva",
      "email": "contato@mecanicaindustrial.com.br",
      "telefone": "(11) 3456-7890",
      "ativo": true,
      "criadoEm": "2025-08-15T10:00:00Z",
      "atualizadoEm": "2026-04-20T15:30:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "nome": "Elétrica Silva LTDA",
      "cnpj": "98765432000180",
      "segmento": "ELETRICO",
      "contato": "Maria Costa",
      "email": "vendas@eletricasilva.com.br",
      "telefone": "(11) 9876-5432",
      "ativo": true,
      "criadoEm": "2025-08-15T10:00:00Z",
      "atualizadoEm": "2026-04-20T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 18,
    "skip": 0,
    "take": 20,
    "hasMore": false
  }
}
```

#### cURL

```bash
curl -X GET "http://localhost:3001/api/v1/fornecedores?segmento=MECANICO&ativo=true" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2. Criar Fornecedor

**POST** `/fornecedores`

Cria um novo fornecedor.

#### Request

```json
{
  "nome": "Hidráulica Premium",
  "cnpj": "55555555000155",
  "segmento": "HIDRAULICO",
  "contato": "Pedro Oliveira",
  "email": "contato@hidraulicapremium.com.br",
  "telefone": "(11) 5555-5555"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "nome": "Hidráulica Premium",
    "cnpj": "55555555000155",
    "segmento": "HIDRAULICO",
    "contato": "Pedro Oliveira",
    "email": "contato@hidraulicapremium.com.br",
    "telefone": "(11) 5555-5555",
    "ativo": true,
    "criadoEm": "2026-04-26T14:22:15Z",
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

#### Response (409 Conflict - CNPJ duplicado)

```json
{
  "success": false,
  "error": "CNPJ_ALREADY_EXISTS",
  "message": "Já existe um fornecedor com este CNPJ"
}
```

---

### 3. Obter Fornecedor por ID

**GET** `/fornecedores/{id}`

Retorna detalhes de um fornecedor específico.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "nome": "Mecânica Industrial LTDA",
    "cnpj": "12345678000190",
    "segmento": "MECANICO",
    "contato": "João Silva",
    "email": "contato@mecanicaindustrial.com.br",
    "telefone": "(11) 3456-7890",
    "ativo": true,
    "criadoEm": "2025-08-15T10:00:00Z",
    "atualizadoEm": "2026-04-20T15:30:00Z"
  }
}
```

---

### 4. Atualizar Fornecedor

**PUT** `/fornecedores/{id}`

Atualiza dados de um fornecedor.

#### Request

```json
{
  "contato": "João Silva Novo",
  "email": "joao.novo@mecanicaindustrial.com.br",
  "telefone": "(11) 9999-9999",
  "ativo": true
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "nome": "Mecânica Industrial LTDA",
    "cnpj": "12345678000190",
    "segmento": "MECANICO",
    "contato": "João Silva Novo",
    "email": "joao.novo@mecanicaindustrial.com.br",
    "telefone": "(11) 9999-9999",
    "ativo": true,
    "atualizadoEm": "2026-04-26T14:22:15Z"
  }
}
```

---

### 5. Deletar Fornecedor

**DELETE** `/fornecedores/{id}`

Remove um fornecedor.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Fornecedor deletado com sucesso"
}
```

---

## ❌ Códigos de Erro

### Padrão de Resposta de Erro

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Mensagem descritiva do erro",
  "details": {
    "campo": "Informação adicional"
  },
  "timestamp": "2026-04-26T14:22:15Z",
  "path": "/api/v1/endpoint"
}
```

### Códigos HTTP Comuns

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| **200** | OK - Request bem-sucedido | GET, PUT, PATCH com sucesso |
| **201** | Created - Recurso criado | POST com sucesso |
| **400** | Bad Request - Dados inválidos | Campos obrigatórios faltando |
| **401** | Unauthorized - Não autenticado | Token faltando ou expirado |
| **403** | Forbidden - Sem permissão | Usuário sem acesso a região |
| **404** | Not Found - Recurso não existe | ID não encontrado |
| **409** | Conflict - Violação de constraint | CNPJ duplicado |
| **422** | Unprocessable Entity - Validação falhou | Email inválido |
| **429** | Too Many Requests - Rate limit atingido | Muitas requisições |
| **500** | Internal Server Error - Erro do servidor | Erro inesperado |
| **503** | Service Unavailable - Serviço indisponível | BD ou Redis down |

### Códigos de Erro Específicos

| Erro | HTTP | Descrição |
|------|------|-----------|
| `INVALID_CREDENTIALS` | 401 | Email/senha incorretos |
| `INVALID_TOKEN` | 401 | Token JWT inválido ou expirado |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token inválido ou expirado |
| `TOKEN_EXPIRED` | 401 | Access token expirou |
| `MISSING_TOKEN` | 401 | Header Authorization ausente |
| `UNAUTHORIZED_ROLE` | 403 | Role não autorizado para ação |
| `UNAUTHORIZED_REGION` | 403 | Usuário sem acesso à região |
| `RESOURCE_NOT_FOUND` | 404 | Recurso (usuario, tarefa, etc) não existe |
| `DUPLICATE_CNPJ` | 409 | CNPJ já cadastrado |
| `DUPLICATE_EMAIL` | 409 | Email já cadastrado |
| `VALIDATION_ERROR` | 422 | Validação de campos falhou |
| `RATE_LIMIT_EXCEEDED` | 429 | Taxa de requisições excedida |
| `INVALID_REFRESH_TOKEN_REVOKED` | 401 | Refresh token foi revogado |
| `SESSION_EXPIRED` | 401 | Sessão expirou |
| `INTERNAL_SERVER_ERROR` | 500 | Erro inesperado no servidor |

### Exemplos de Erros

#### 400 - Validação Falhou

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validação falhou",
  "details": {
    "email": "Email deve ser válido",
    "prioridade": "Prioridade deve ser ALTA, MEDIA ou BAIXA",
    "regiao": "Região é obrigatória para este role"
  },
  "timestamp": "2026-04-26T14:22:15Z",
  "path": "/api/v1/tarefas"
}
```

#### 401 - Token Expirado

```json
{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "Access token expirou. Use o refresh token para renovar.",
  "timestamp": "2026-04-26T14:22:15Z",
  "path": "/api/v1/tarefas"
}
```

#### 403 - Sem Permissão

```json
{
  "success": false,
  "error": "UNAUTHORIZED_REGION",
  "message": "Você não tem permissão para acessar dados desta região",
  "details": {
    "seuAcesso": ["SP1", "SP2"],
    "regiaoRequisitada": "MG1"
  },
  "timestamp": "2026-04-26T14:22:15Z",
  "path": "/api/v1/tarefas"
}
```

#### 429 - Rate Limit

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Limite de requisições excedido. Tente novamente em 900 segundos.",
  "details": {
    "limite": 100,
    "periodo": "15 minutos",
    "tentouNovamenteEm": "2026-04-26T14:37:15Z"
  },
  "timestamp": "2026-04-26T14:22:15Z",
  "path": "/api/v1/tarefas"
}
```

---

## 📚 Exemplos de Uso

### 1. Fluxo Completo de Login

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gerente@manutencao.com",
    "senha": "Senha@123"
  }' \
  -o auth_response.json

# Extrair tokens
ACCESS_TOKEN=$(jq -r '.data.accessToken' auth_response.json)
REFRESH_TOKEN=$(jq -r '.data.refreshToken' auth_response.json)

# 2. Usar accessToken para acessar recursos
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Quando accessToken expirar, renovar
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" \
  -o new_auth_response.json

NEW_ACCESS_TOKEN=$(jq -r '.data.accessToken' new_auth_response.json)
NEW_REFRESH_TOKEN=$(jq -r '.data.refreshToken' new_auth_response.json)

# 4. Logout (opcional)
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"revokeAll\": true}"
```

### 2. Criar e Atualizar uma Tarefa

```javascript
// JavaScript/Fetch API
const accessToken = 'seu_token_aqui';

// Criar tarefa
const tarefaResponse = await fetch('http://localhost:3001/api/v1/tarefas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Manutenção preventiva empilhadeira elétrica',
    descricao: 'Verificação de bateria e sistema hidráulico',
    prioridade: 'ALTA',
    regiao: 'SP1',
    unidade: '8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a',
    atribuidoA: '550e8400-e29b-41d4-a716-446655440001',
    dataVencimento: '2026-04-30'
  })
});

const tarefa = await tarefaResponse.json();
const tarefaId = tarefa.data.id;

// Atualizar tarefa
const updateResponse = await fetch(`http://localhost:3001/api/v1/tarefas/${tarefaId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'CONCLUIDA',
    titulo: 'Manutenção preventiva empilhadeira elétrica (CONCLUÍDA)'
  })
});

const updatedTarefa = await updateResponse.json();
console.log('Tarefa atualizada:', updatedTarefa.data);
```

### 3. Listar Chamados com Filtros

```bash
# Listar chamados de abril/2026, região SP1
curl -X GET "http://localhost:3001/api/v1/chamados?mes=4&ano=2026&regiao=SP1&segmento=MECANICO" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data'

# Com paginação
curl -X GET "http://localhost:3001/api/v1/chamados?skip=0&take=50" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.pagination'
```

### 4. Preencher Checklist Semanal

```javascript
const accessToken = 'seu_token_aqui';

await fetch('http://localhost:3001/api/v1/checklists/equipamentos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    semana: 17,
    ano: 2026,
    regiao: 'SP1',
    unidade: '8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a',
    itens: [
      {
        tipo: 'Empilhadeira Elétrica',
        operacional: true,
        quantidade: 3,
        quantidadeQuebrada: 0,
        numeroSerie: 'EMP-001',
        chamadoId: null,
        valor: 0.00
      },
      {
        tipo: 'Serra Fita',
        operacional: false,
        quantidade: 1,
        quantidadeQuebrada: 1,
        numeroSerie: 'SF-002',
        chamadoId: '660e8400-e29b-41d4-a716-446655440000',
        valor: 500.00
      }
    ]
  })
});
```

### 5. Gerenciar Estoque

```bash
# Listar peças em alerta
curl -X GET "http://localhost:3001/api/v1/estoque/pecas?emAlerta=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Criar entrada (nota fiscal)
curl -X POST http://localhost:3001/api/v1/estoque/entradas \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pecaId": "880e8400-e29b-41d4-a716-446655440000",
    "fornecedorId": "770e8400-e29b-41d4-a716-446655440000",
    "numeroNF": "NF-2026-000124",
    "quantidade": 30,
    "valorUnitario": 150.00,
    "dataEntrada": "2026-04-26"
  }'

# Criar movimentação de peça
curl -X POST http://localhost:3001/api/v1/estoque/movimentacoes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pecaId": "880e8400-e29b-41d4-a716-446655440000",
    "lojaRequisitanteId": "8c5b1a40-3f2d-4e9c-8d5a-1b2c3d4e5f6a",
    "chamadoId": "660e8400-e29b-41d4-a716-446655440000",
    "quantidade": 5
  }'
```

### 6. Monitorar Notificações

```javascript
const accessToken = 'seu_token_aqui';

// Buscar notificações não lidas
const notificacoesResponse = await fetch('http://localhost:3001/api/v1/notificacoes?lida=false', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, pagination } = await notificacoesResponse.json();
console.log(`${pagination.naoLidas} notificações não lidas`);

// Marcar todas como lidas
await fetch('http://localhost:3001/api/v1/notificacoes/marcar-todas-lidas', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 🔍 Validações de Input

### Regras Gerais

- Todos os campos `string` obrigatórios não podem estar vazios
- Emails devem seguir padrão válido (RFC 5322 simplificado)
- Datas devem estar no formato ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`)
- UUIDs devem ser válidos (v4)
- Valores monetários: mínimo 0.01, máximo 9.999.999,99

### Campos Específicos

| Campo | Validação |
|-------|-----------|
| `email` | Formato válido, unique em usuários |
| `senha` | Mín 8 caracteres, 1 maiúscula, 1 número, 1 especial |
| `cnpj` | Formato válido (14 dígitos), unique em fornecedores |
| `role` | Uma das 6 opções: ADMINISTRADOR, DIRETOR, GERENTE, COORDENADOR, GESTOR, TECNICO |
| `regiao` | String não vazia, consistência com lojas |
| `prioridade` | Uma das 3: ALTA, MEDIA, BAIXA |
| `status` | Validar contra estados permitidos do recurso |
| `valor` | Decimal positivo |
| `quantidade` | Integer positivo |

---

## 📞 Suporte e Contato

- **Repositório:** https://github.com/luis-h-souza/gerenciador-manutencao
- **Issues:** Abrir issue no GitHub
- **Email:** luis.h.souza@example.com (exemplo)
- **Ambiente de Teste:** http://localhost:3001 (local) ou URL Vercel (produção)

---

**Última atualização:** Abril 2026
**Especificação OpenAPI:** 3.0.0

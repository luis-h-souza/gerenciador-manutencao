// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');

const logger = require('./utils/logger');
const redisClient = require('./utils/redis');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const { sessionStore } = require('./middlewares/sessionConfig');
const errorHandler = require('./middlewares/errorHandler');
const requestId = require('./middlewares/requestId');

// Rotas
const authRoutes = require('./routes/auth.routes');
const tarefaRoutes = require('./routes/tarefa.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const chamadoRoutes = require('./routes/chamado.routes');
const fornecedorRoutes = require('./routes/fornecedor.routes');
const estoquePecasRoutes = require('./routes/estoque.routes');
const notificacaoRoutes = require('./routes/notificacao.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const checklistRoutes = require('./routes/checklist.routes');

const app = express();

// 1. LOG DE DEPURACÃO (Para ver no painel da Vercel)
app.use((req, res, next) => {
  const origin = req.headers.origin || 'SEM ORIGEM';
  logger.info(`📡 [${req.method}] ${req.url} - Origin: ${origin}`);
  next();
});

// 2. CORS MANUAL (Mais garantido na Vercel)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    // Se quiser ser 100% permissivo para depuração, use apenas res.setHeader('Access-Control-Allow-Origin', origin);
    // Mas vamos manter a lógica de verificação
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, ''));
    const isAllowed = origin.includes('localhost') || origin.includes('vercel.app') || allowed.includes(origin.replace(/\/$/, '')) || allowed.includes('*');

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

  // Resposta instantânea para Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Necessário para cookies seguros na Vercel
app.set('trust proxy', 1);

// ─── Segurança: Headers HTTP ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── Compressão ───────────────────────────────────────────────────────────────
app.use(compression());

// ─── Rate Limiting Global ─────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request ID ──────────────────────────────────────────────────────────────
app.use(requestId);

// ─── Logging HTTP ────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ─── Sessões (Express Session + Redis) ──────────────────────────────────────
app.use(session({
  store: sessionStore,
  proxy: true, // Obrigatório para Vercel
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'mnt.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
  },
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Boas-vindas (Root) ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'SGM API Online',
    version: '1.0.0',
    documentation: 'https://github.com/luis-h-souza/gerenciador-manutencao'
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/tarefas`, tarefaRoutes);
app.use(`${API}/usuarios`, usuarioRoutes);
app.use(`${API}/chamados`, chamadoRoutes);
app.use(`${API}/fornecedores`, fornecedorRoutes);
app.use(`${API}/estoque`, estoquePecasRoutes);
app.use(`${API}/notificacoes`, notificacaoRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/checklists`, checklistRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

// ─── Error Handler Global ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
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

// ─── CORS (Produção Segura) ──────────────────────────────────────────────────
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://gerenciadormanutencaoclient.vercel.app',
  'https://gerenciadormanutencaoclient-git-main-luishsouzas-projects.vercel.app',
  'https://gerenciadormanutencaoclient-9zo5njrjv-luishsouzas-projects.vercel.app',
];

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''))
  : defaultOrigins;

console.log('🔒 CORS configurado para:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    // Verifica se a origem está permitida
    const isAllowed =
      allowedOrigins.includes(origin.replace(/\/$/, '')) ||
      origin.includes('localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`⚠️ CORS bloqueou: ${origin}`);
      logger.warn(`📋 Permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error('CORS: Origem não permitida'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
}));

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
    cors_origins: allowedOrigins.length, // Mostra quantas origens estão configuradas
    allowed_origins: allowedOrigins, // Mostra quais origens (útil para debug)
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
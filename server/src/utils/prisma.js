// Usar singleton para evitar múltiplas conexões em desenvolvimento (hot reload)
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma');

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

prisma = globalForPrisma.prisma;

module.exports = prisma;

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');

const LOJA_MD_PATH = path.resolve(__dirname, '..', '..', 'loja.md');

function parseLojasMarkdown(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\s+-\s+.+\s+-\s+SP\s+\d{2}[AB]?$/i.test(line))
    .map((line) => {
      const match = line.match(/^(\d+)\s+-\s+(.+)\s+-\s+(SP\s+\d{2}[AB]?)$/i);
      if (!match) return null;

      return {
        numero: Number(match[1]),
        nome: match[2].trim(),
        regiao: match[3].trim().toUpperCase(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.numero - b.numero);
}

function loadLojasFromMarkdown() {
  const markdown = fs.readFileSync(LOJA_MD_PATH, 'utf8');
  return parseLojasMarkdown(markdown);
}

async function seedLojas({ reset = false } = {}) {
  const lojas = loadLojasFromMarkdown();

  if (reset) {
    await prisma.loja.deleteMany();
  }

  for (const loja of lojas) {
    await prisma.loja.upsert({
      where: { numero: loja.numero },
      update: {
        nome: loja.nome,
        regiao: loja.regiao,
        ativo: true,
      },
      create: loja,
    });
  }

  return lojas;
}

async function main() {
  const lojas = await seedLojas();
  console.log(`✅ ${lojas.length} lojas inseridas/atualizadas com sucesso`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Erro ao executar seed das lojas:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  LOJA_MD_PATH,
  loadLojasFromMarkdown,
  parseLojasMarkdown,
  seedLojas,
};

require('dotenv').config();
const prisma = require('../src/utils/prisma');

async function main() {
  await prisma.loja.upsert({
    where: { numero: 246 },
    update: { nome: 'LIMEIRA II', regiao: 'SP 07' },
    create: { numero: 246, nome: 'LIMEIRA II', regiao: 'SP 07' },
  });

  console.log('Loja 246 inserida/atualizada com sucesso');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed da loja:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

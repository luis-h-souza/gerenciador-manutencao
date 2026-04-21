require('dotenv').config();
const prisma = require('../src/utils/prisma');
const {
  LOJAS_COM_GESTORES_ATIVOS,
  seedChamadosLojasAtivas,
} = require('./seed-chamados');

async function main() {
  const chamados = await seedChamadosLojasAtivas();
  console.log(
    `✅ ${chamados.length} chamados criados para as lojas com gestores ativos: ${LOJAS_COM_GESTORES_ATIVOS.join(', ')}`
  );
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

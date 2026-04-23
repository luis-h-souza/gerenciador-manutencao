const prisma = require('./src/utils/prisma');

async function test() {
  const c = await prisma.checklistEquipamento.findFirst({
    where: { unidade: 'LIMEIRA II' }
  });
  console.log('Checklist Equipamento:', c);

  const loja = await prisma.loja.findFirst({
    where: { nome: 'LIMEIRA II' }
  });
  console.log('Loja:', loja);
}

test().finally(() => prisma.$disconnect());

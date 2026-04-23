const prisma = require('./src/utils/prisma');

async function run() {
  const checklists = await prisma.checklistEquipamento.findMany({
    include: { itens: true }
  });
  console.log('Equipamentos:', checklists.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade, itensCount: c.itens.length })));
  
  const checklistsCar = await prisma.checklistCarrinho.findMany({
    include: { itens: true }
  });
  console.log('Carrinhos:', checklistsCar.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade, itensCount: c.itens.length })));
}

run().finally(() => prisma.$disconnect());

const prisma = require('./src/utils/prisma');
const { getWeek, startOfMonth, endOfMonth } = require('date-fns');

async function test() {
  const qAno = 2026;
  const qMes = 4;
  const regiao = "SP 07";
  
  const inicioMes = startOfMonth(new Date(qAno, qMes - 1));
  const fimMes    = endOfMonth(new Date(qAno, qMes - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 1 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 1 });

  console.log({ semanaInicio, semanaFim });

  const whereEquip = {
    ano: qAno,
    semana: { gte: semanaInicio, lte: semanaFim },
    regiao: regiao
  };

  const checklistsEquip = await prisma.checklistEquipamento.findMany({
    where: whereEquip,
    include: { itens: true },
  });
  
  console.log('Equipamentos encontrados:', checklistsEquip.length);
  if (checklistsEquip.length > 0) {
    console.log(checklistsEquip[0]);
  }
}

test().finally(() => prisma.$disconnect());

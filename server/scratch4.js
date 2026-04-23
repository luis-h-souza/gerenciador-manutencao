const prisma = require('./src/utils/prisma');

async function checkRegions() {
  const coordenadores = await prisma.usuario.findMany({
    where: { role: 'COORDENADOR' },
    select: { id: true, nome: true, regiao: true, loja: { select: { regiao: true } } }
  });
  console.log('Coordenadores:', coordenadores);

  const lojas = await prisma.loja.findMany({
    select: { regiao: true },
    distinct: ['regiao']
  });
  console.log('Regiões nas Lojas:', lojas);
}

checkRegions().finally(() => prisma.$disconnect());

require('dotenv').config({ path: './server/.env' });
const prisma = require('./server/src/utils/prisma');
const { getWeek, startOfMonth, endOfMonth } = require('date-fns');

async function main() {
  const mesNum = 5; // Maio
  const anoNum = 2026;

  const inicioMes = startOfMonth(new Date(anoNum, mesNum - 1));
  const fimMes    = endOfMonth(new Date(anoNum, mesNum - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });
  const totalSemanasNoMes = Math.max(1, semanaFim - semanaInicio + 1);

  console.log('Datas:', { inicioMes, fimMes, semanaInicio, semanaFim, totalSemanasNoMes });

  const lojas = await prisma.loja.findMany({
    where: { ativo: true }
  });
  console.log('Lojas no banco:', lojas.map(l => ({ id: l.id, numero: l.numero, nome: l.nome, regiao: l.regiao })));

  const lojasNomes = lojas.map(l => l.nome);
  const checklistsEquip = await prisma.checklistEquipamento.findMany();
  console.log('Todos Checklists Equipamento:', checklistsEquip.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade })));

  const checklistsCarrinho = await prisma.checklistCarrinho.findMany();
  console.log('Todos Checklists Carrinho:', checklistsCarrinho.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade })));

  const ativos = await prisma.ativoLoja.findMany({
    where: { ativo: true }
  });
  console.log('Total Ativos:', ativos.length);

  const res = lojas.map(loja => {
    const equipFills = checklistsEquip.filter(c => c.unidade === loja.nome).length;
    const carrFills = checklistsCarrinho.filter(c => c.unidade === loja.nome).length;
    const totalFilled = equipFills + carrFills;
    const totalExpected = totalSemanasNoMes * 2;
    const checklistCoverage = totalExpected > 0 ? Math.min(100, Math.round((totalFilled / totalExpected) * 100)) : 100;

    const lojaAtivos = ativos.filter(a => a.unidade === loja.nome);
    const ativosPreventiva = lojaAtivos.filter(a => a.intervaloPreventiva !== null);
    let preventivasEmDia = 0;
    
    ativosPreventiva.forEach(a => {
      if (a.proximaPreventiva) {
        const proxima = new Date(a.proximaPreventiva);
        if (proxima >= new Date()) {
          preventivasEmDia++;
        }
      }
    });

    const preventivaAdherence = ativosPreventiva.length > 0 
      ? Math.round((preventivasEmDia / ativosPreventiva.length) * 100)
      : 100;

    return {
      unidade: loja.nome,
      numero: loja.numero,
      equipFills,
      carrFills,
      totalFilled,
      checklistCoverage,
      ativosCount: lojaAtivos.length,
      preventivasCount: ativosPreventiva.length,
      preventivaAdherence
    };
  });

  console.log('Resultado Conformidade:', res);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});

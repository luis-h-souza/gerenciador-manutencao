require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { getWeek, startOfMonth, endOfMonth } = require('date-fns');

async function main() {
  const mesNum = 5; // Maio
  const anoNum = 2026;

  const inicioMes = startOfMonth(new Date(anoNum, mesNum - 1));
  const fimMes    = endOfMonth(new Date(anoNum, mesNum - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 5 });
  const totalSemanasNoMes = Math.max(1, semanaFim - semanaInicio + 1);

  const targetNumeros = [21, 246];

  const lojas = await prisma.loja.findMany({
    where: { numero: { in: targetNumeros } }
  });
  console.log('Lojas Target:', lojas.map(l => ({ id: l.id, numero: l.numero, nome: l.nome, regiao: l.regiao })));

  const checklistsEquip = await prisma.checklistEquipamento.findMany({
    where: { unidade: { in: lojas.map(l => l.nome).concat(lojas.map(l => String(l.numero))) } }
  });
  console.log('Checklists Equipamento Target:', checklistsEquip.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade })));

  const checklistsCarrinho = await prisma.checklistCarrinho.findMany({
    where: { unidade: { in: lojas.map(l => l.nome).concat(lojas.map(l => String(l.numero))) } }
  });
  console.log('Checklists Carrinho Target:', checklistsCarrinho.map(c => ({ id: c.id, semana: c.semana, ano: c.ano, regiao: c.regiao, unidade: c.unidade })));

  const rotinas = await prisma.checklistRotinaInfra.findMany({
    where: { unidade: { in: lojas.map(l => l.nome).concat(lojas.map(l => String(l.numero))) } }
  });
  console.log('Rotinas Infra Target:', rotinas.map(c => ({ id: c.id, tipo: c.tipo, semana: c.semana, ano: c.ano, conforme: c.conforme, unidade: c.unidade })));

  const ativos = await prisma.ativoLoja.findMany({
    where: { unidade: { in: lojas.map(l => l.nome).concat(lojas.map(l => String(l.numero))) }, ativo: true }
  });
  console.log('Ativos Target:', ativos.map(a => ({ id: a.id, nome: a.nome, categoria: a.categoria, unidade: a.unidade, conforme: a.status })));

  const res = lojas.map(loja => {
    // 1. Cobertura de Checklist
    const equipFills = checklistsEquip.filter(c => c.unidade === String(loja.numero) || c.unidade === loja.nome).length;
    const carrFills = checklistsCarrinho.filter(c => c.unidade === String(loja.numero) || c.unidade === loja.nome).length;
    const totalFilled = equipFills + carrFills;
    const totalExpected = totalSemanasNoMes * 2;
    const checklistCoverage = totalExpected > 0 ? Math.min(100, Math.round((totalFilled / totalExpected) * 100)) : 100;

    const lojaAtivos = ativos.filter(a => a.unidade === String(loja.numero) || a.unidade === loja.nome);
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

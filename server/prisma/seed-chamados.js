require('dotenv').config();
const prisma = require('../src/utils/prisma');

const SEGMENTO_TO_FORNECEDOR = {
  ELETRICA: ['CAMPOS PECAS E ACESSORIOS DE ELETRONICA E TELECOMUNICACOES LTDA', 'ELETRICA ZUFIR INDUSTRIA E COMERCIO LTDA', 'BRILHO REAL', 'TECSOM TECNOLOGIA EM SISTEMAS SONOROS'],
  EMPILHADEIRA: ['SERGIO APARECIDO CARNEIRO 17234268812'],
  REFRIGERACAO: ['AR CICLO COMERCIO SERV E REFRIGERACAO LT', 'COZITEC REFRIGERACAO LTDA', 'IRMAOS RIOS SERVICOS LTDA', 'TECNOFRI'],
  AR_CONDICIONADO: ['AR CICLO COMERCIO SERV E REFRIGERACAO LT', 'COZITEC REFRIGERACAO LTDA'],
  SERRALHERIA: ['PROMAGE ACESSORIOS E COLOCACAO DE VIDROS LTDA'],
  CIVIL: ['AB5 INDUSTRIA E COMERCIO LTDA', 'ESQUADRIAS METALICAS OLIVEIRA & OLIVEIRA LTDA'],
  EQUIPAMENTOS: ['VMM SERVICOS E INSTALACOES LTDA', 'CHAMAZZUL MANUTENCAO DE EQUIPAMENTOS INDUSTRIAIS LTDA - ME', 'COMAQ'],
  GERADOR: ['DELBRAS'],
  ELEVADOR: ['VMM SERVICOS E INSTALACOES LTDA'],
  PCI: ['TECSOM TECNOLOGIA EM SISTEMAS SONOROS'],
  DIVERSOS: ['COMAQ', 'IRMAOS RIOS SERVICOS LTDA'],
  ALUGUEL: ['PROMAGE ACESSORIOS E COLOCACAO DE VIDROS LTDA'],
};

const SEGMENTOS = Object.keys(SEGMENTO_TO_FORNECEDOR);

const LOJAS_COM_GESTORES_ATIVOS = [144, 2, 156, 60, 16, 9, 68, 130, 326];

function pick(list, index) {
  return list[index % list.length];
}

function createChamadosData(gestores, fornecedoresByNome) {
  const meses = [0, -1, -2, -3, -4];
  const chamadosData = [];
  let sequencia = 1;

  gestores.forEach((gestor, gestorIndex) => {
    const unidade = gestor.loja?.nome;
    const regiao = gestor.loja?.regiao || gestor.regiao || null;

    if (!unidade || !regiao) return;

    meses.forEach((offset, monthIndex) => {
      const base = new Date();
      base.setMonth(base.getMonth() + offset);

      for (let i = 0; i < 5; i += 1) {
        const segmento = SEGMENTOS[(gestorIndex + monthIndex + i) % SEGMENTOS.length];
        const fornecedorNome = pick(SEGMENTO_TO_FORNECEDOR[segmento], gestorIndex + i);
        const fornecedor = fornecedoresByNome.get(fornecedorNome);
        const dia = ((gestorIndex + monthIndex + i) % 24) + 1;
        const valor = Number((650 + gestorIndex * 120 + monthIndex * 80 + i * 95).toFixed(2));

        chamadosData.push({
          dataAbertura: new Date(base.getFullYear(), base.getMonth(), dia),
          numeroChamado: `CSA-${gestor.loja.numero}-${String(sequencia).padStart(4, '0')}`,
          segmento,
          empresa: fornecedor?.nome || fornecedorNome,
          regiao,
          unidade,
          descricao: `Chamado de ${segmento.toLowerCase().replace(/_/g, ' ')} para a unidade ${unidade}`,
          numeroOrcamento: `ORC-${gestor.loja.numero}-${String(sequencia).padStart(4, '0')}`,
          valor,
          status: offset < 0 ? 'FINALIZADO' : i % 3 === 0 ? 'AGUARDANDO_APROVACAO' : 'CHAMADO_ABERTO',
          mauUso: i === 4 && monthIndex === 0,
        });

        sequencia += 1;
      }
    });
  });

  return chamadosData;
}

async function seedChamados({ reset = false, lojaNumeros } = {}) {
  if (reset) {
    await prisma.controleChamado.deleteMany();
  }

  const lojaNumerosFiltrados = Array.isArray(lojaNumeros)
    ? [...new Set(lojaNumeros.map((item) => Number(item)).filter(Number.isInteger))]
    : null;

  const [gestores, fornecedores] = await Promise.all([
    prisma.usuario.findMany({
      where: { role: 'GESTOR', ativo: true },
      include: { loja: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
  ]);

  const fornecedoresByNome = new Map(fornecedores.map((item) => [item.nome, item]));
  const gestoresFiltrados = lojaNumerosFiltrados
    ? gestores.filter((gestor) => lojaNumerosFiltrados.includes(gestor.loja?.numero))
    : gestores;
  const chamadosData = createChamadosData(gestoresFiltrados, fornecedoresByNome);

  if (chamadosData.length) {
    await prisma.controleChamado.createMany({ data: chamadosData });
  }

  return chamadosData;
}

async function seedChamadosLojasAtivas(options = {}) {
  return seedChamados({
    ...options,
    lojaNumeros: LOJAS_COM_GESTORES_ATIVOS,
  });
}

async function main() {
  const chamados = await seedChamados();
  console.log(`✅ ${chamados.length} chamados criados com sucesso`);
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

module.exports = {
  LOJAS_COM_GESTORES_ATIVOS,
  createChamadosData,
  seedChamados,
  seedChamadosLojasAtivas,
};

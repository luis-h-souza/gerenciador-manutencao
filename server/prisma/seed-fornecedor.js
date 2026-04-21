require('dotenv').config();
const prisma = require('../src/utils/prisma');

const fornecedoresData = [
  { nome: 'PROMAGE ACESSORIOS E COLOCACAO DE VIDROS LTDA', email: 'contato@promagevidros.com.br', telefone: '(11) 3223-1087', cnpj: '11365762000108', segmento: 'CIVIL' },
  { nome: 'AB5 INDUSTRIA E COMERCIO LTDA', email: 'financeiro@politekbahia.com.br', telefone: '(19) 3891-1801', cnpj: '03102481000134', segmento: 'CIVIL' },
  { nome: 'ESQUADRIAS METALICAS OLIVEIRA & OLIVEIRA LTDA', email: 'esquadriasoliveiraperes@gmail.com', telefone: '(11) 4035-3546', cnpj: '07458944000156', segmento: 'CIVIL' },
  { nome: 'CAMPOS PECAS E ACESSORIOS DE ELETRONICA E TELECOMUNICACOES LTDA', email: 'camposte@uol.com.br', telefone: '(11) 5016-3331', cnpj: '69096154000125', segmento: 'ELETRICA' },
  { nome: 'VMM SERVICOS E INSTALACOES LTDA', email: 'rm7app@gmail.com', telefone: '(11) 92698-5100', cnpj: '53764505000199', segmento: 'EQUIPAMENTOS' },
  { nome: 'ELETRICA ZUFIR INDUSTRIA E COMERCIO LTDA', email: 'atendimento@fazis.com.br', telefone: '(11) 4508-6601', cnpj: '62946686000165', segmento: 'ELETRICA' },
  { nome: 'AR CICLO COMERCIO SERV E REFRIGERACAO LT', email: 'claudinei.arcilco@terra.com.br', telefone: '(11) 98522-0484', cnpj: '05329543000170', segmento: 'REFRIGERACAO' },
  { nome: 'COZITEC REFRIGERACAO LTDA', email: 'cozitec@hotmail.com', telefone: '(15) 99644-2486', cnpj: '47234487000130', segmento: 'REFRIGERACAO' },
  { nome: 'SERGIO APARECIDO CARNEIRO 17234268812', email: 'speed.empmanutencao@gmail.com', telefone: '(11) 97291-0340', cnpj: '29823654000105', segmento: 'EMPILHADEIRA' },
  { nome: 'DELBRAS', email: 'coordenacaotecnica@delbrasups.com.br', telefone: '(11) 3754-0464', cnpj: '00813955000168', segmento: 'GERADOR' },
  { nome: 'TECSOM TECNOLOGIA EM SISTEMAS SONOROS', email: 'suporte@tecsom.com.br', telefone: '(11) 2334-4735', cnpj: '14466633000102', segmento: 'ELETRICA' },
  { nome: 'J & R MANUTENCAO', email: 'comercial@jrmanutencaoerefrigeracao.com.br', telefone: '(11) 4385-1572', cnpj: '07899749000161', segmento: 'REFRIGERACAO' },
  { nome: 'VERSATIL CONTROLES E REFRIGERACAO ELETRICA LTDA', email: 'versatil@versatilcontroles.com.br', telefone: '(11) 4102-0621', cnpj: '11552523000167', segmento: 'REFRIGERACAO' },
  { nome: 'M. MASTEC', email: 'mmastec@terra.com.br', telefone: '(16) 99171-2892', cnpj: '13412628000146', segmento: 'REFRIGERACAO' },
  { nome: 'CHAMAZZUL MANUTENCAO DE EQUIPAMENTOS INDUSTRIAIS LTDA - ME', email: 'chamazzul@uol.com.br', telefone: '(11) 2741-6006', cnpj: '09369549000122', segmento: 'EQUIPAMENTOS' },
  { nome: 'BRILHO REAL', email: 'contatobrilhoreal@gmail.com', telefone: '(11) 2743-2602', cnpj: '15647913000171', segmento: 'ELETRICA' },
  { nome: 'TECNOFRI', email: 'tecnofri@globomail.com', telefone: '(11) 99117-5160', cnpj: '11935284000124', segmento: 'REFRIGERACAO' },
  { nome: 'COMAQ', email: 'comaqatendimento@gmail.com', telefone: '(11) 3856-8097', cnpj: '01561401000183', segmento: 'EQUIPAMENTOS' },
  { nome: 'IRMAOS RIOS SERVICOS LTDA', email: 'comercial@riosrefrigeracao.com', telefone: '(11) 2724-4115', cnpj: '27499944000101', segmento: 'REFRIGERACAO' },
];

async function seedFornecedores({ reset = false } = {}) {
  if (reset) {
    await prisma.fornecedor.deleteMany();
  }

  for (const fornecedor of fornecedoresData) {
    await prisma.fornecedor.upsert({
      where: { cnpj: fornecedor.cnpj },
      update: fornecedor,
      create: fornecedor,
    });
  }

  return fornecedoresData;
}

async function main() {
  const fornecedores = await seedFornecedores();
  console.log(`✅ ${fornecedores.length} fornecedores inseridos/atualizados com sucesso`);
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
  fornecedoresData,
  seedFornecedores,
};

// prisma/seed.js
require('dotenv').config();
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');

const LOJAS = [
  { numero: 1,   nome: 'VILA CARRÃO',                          regiao: 'SP 05' },
  { numero: 2,   nome: 'CASA VERDE',                           regiao: 'SP 03' },
  { numero: 3,   nome: 'SÃO MIGUEL MAL TITO',                  regiao: 'SP 02A' },
  { numero: 7,   nome: 'SANTOS',                               regiao: 'SP 05' },
  { numero: 8,   nome: 'VILA SÔNIA',                           regiao: 'SP 07' },
  { numero: 9,   nome: 'OSASCO',                               regiao: 'SP 07' },
  { numero: 10,  nome: 'SÃO BERNARDO PIRAPORINHA',             regiao: 'SP 01B' },
  { numero: 12,  nome: 'JUNDIAÍ',                              regiao: 'SP 07' },
  { numero: 14,  nome: 'RIBEIRÃO PARQUE INDUSTRIAL',           regiao: 'SP 07' },
  { numero: 15,  nome: 'COTIA',                                regiao: 'SP 07' },
  { numero: 16,  nome: 'SANTO ANDRÉ',                          regiao: 'SP 01A' },
  { numero: 17,  nome: 'SAPOPEMBA',                            regiao: 'SP 05' },
  { numero: 18,  nome: 'JOÃO DIAS',                            regiao: 'SP 04' },
  { numero: 19,  nome: 'ITAQUERA',                             regiao: 'SP 05' },
  { numero: 20,  nome: 'JAÇANÃ',                               regiao: 'SP 03' },
  { numero: 21,  nome: 'LIMEIRA',                              regiao: 'SP 07' },
  { numero: 22,  nome: 'JAGUARÉ',                              regiao: 'SP 03' },
  { numero: 24,  nome: 'RIO CLARO',                            regiao: 'SP 07' },
  { numero: 25,  nome: 'CARAGUATATUBA',                        regiao: 'SP 05' },
  { numero: 28,  nome: 'JACAREPAGUÁ',                          regiao: 'RJ 01' },
  { numero: 29,  nome: 'ILHA DO GOVERNADOR',                   regiao: 'RJ 01' },
  { numero: 30,  nome: 'NOVA IGUAÇÚ',                          regiao: 'RJ 02A' },
  { numero: 32,  nome: 'NORDESTINA',                           regiao: 'SP 02A' },
  { numero: 35,  nome: 'SÃO GONÇALO ALCANTARA',                regiao: 'RJ 03' },
  { numero: 36,  nome: 'NILÓPOLIS',                            regiao: 'RJ 02A' },
  { numero: 37,  nome: 'CAMPINHO',                             regiao: 'RJ 01' },
  { numero: 38,  nome: 'PRAIA GRANDE KENEDY',                  regiao: 'SP 05' },
  { numero: 39,  nome: 'CAMPINAS AMOREIRAS',                   regiao: 'SP 07' },
  { numero: 41,  nome: 'NITERÓI',                              regiao: 'RJ 02B' },
  { numero: 42,  nome: 'CEASA',                                regiao: 'RJ 01' },
  { numero: 44,  nome: 'JABOATÃO',                             regiao: 'NE' },
  { numero: 45,  nome: 'BARRA FUNDA',                          regiao: 'SP 03' },
  { numero: 46,  nome: 'CARUARU CENTRO',                       regiao: 'NE' },
  { numero: 48,  nome: 'SÃO CAETANO DO SUL',                   regiao: 'SP 01A' },
  { numero: 49,  nome: 'ÁGUIA DE HAIA',                        regiao: 'SP 02A' },
  { numero: 50,  nome: 'SOROCABA (ITAVUVU)',                   regiao: 'SP 07' },
  { numero: 51,  nome: 'BRASÍLIA SUL',                         regiao: 'CO' },
  { numero: 52,  nome: 'CEILÂNDIA',                            regiao: 'CO' },
  { numero: 56,  nome: 'GOIANIA BURITI',                       regiao: 'CO' },
  { numero: 57,  nome: 'CUIABÁ COXIPÓ',                        regiao: 'MT/RO/AC' },
  { numero: 58,  nome: 'RIBEIRÃO PIRES',                       regiao: 'SP 01A' },
  { numero: 60,  nome: 'GUAIANASES',                           regiao: 'SP 02B' },
  { numero: 61,  nome: 'BAURU',                                regiao: 'SP 07' },
  { numero: 63,  nome: 'RIBEIRÃO PRETO ROTATÓRIA',             regiao: 'SP 07' },
  { numero: 64,  nome: 'MARGINAL TIETÊ VILA MARIA',            regiao: 'SP 03' },
  { numero: 65,  nome: 'MENDANHA',                             regiao: 'RJ 02A' },
  { numero: 66,  nome: 'JUAZEIRO DA BAHIA',                    regiao: 'BA/SE' },
  { numero: 67,  nome: 'FEIRA DE SANTANA',                     regiao: 'BA/SE' },
  { numero: 68,  nome: 'SUZANO',                               regiao: 'SP 02B' },
  { numero: 70,  nome: 'VARZEA GRANDE',                        regiao: 'MT/RO/AC' },
  { numero: 71,  nome: 'LONDRINA TIRADENTES',                  regiao: 'SUL' },
  { numero: 73,  nome: 'PRESIDENTE PRUDENTE',                  regiao: 'SP 07' },
  { numero: 74,  nome: 'SANTO ANDRÉ G.PIRELLI',                regiao: 'SP 01A' },
  { numero: 75,  nome: 'ITAQUAQUECETUBA',                      regiao: 'SP 02B' },
  { numero: 76,  nome: 'MACEIO MENINO MARCELO',                regiao: 'NE' },
  { numero: 77,  nome: 'JOÃO PESSOA',                          regiao: 'NE' },
  { numero: 79,  nome: 'MARINGÁ COLOMBO',                      regiao: 'SUL' },
  { numero: 80,  nome: 'CPO GRANDE CEL ANTONINO',              regiao: 'MS' },
  { numero: 81,  nome: 'MOGI DAS CRUZES',                      regiao: 'SP 02B' },
  { numero: 82,  nome: 'CABO FRIO',                            regiao: 'RJ 02B' },
  { numero: 83,  nome: 'CAMPINA GRANDE',                       regiao: 'NE' },
  { numero: 84,  nome: 'GOIANIA INDEPENDÊNCIA',                regiao: 'CO' },
  { numero: 85,  nome: 'TEOTONIO VILELA',                      regiao: 'SP 04' },
  { numero: 86,  nome: 'GUARULHOS JAMIL',                      regiao: 'SP 04' },
  { numero: 87,  nome: 'VITORIA DA CONQUISTA',                 regiao: 'BA/SE' },
  { numero: 89,  nome: 'FERNÃO DIAS',                          regiao: 'SP 05' },
  { numero: 90,  nome: 'PARIPE',                               regiao: 'BA/SE' },
  { numero: 92,  nome: 'CPO GRANDE ACRISSUL',                  regiao: 'MS' },
  { numero: 93,  nome: 'PIRAJUSSARA',                          regiao: 'SP 07' },
  { numero: 94,  nome: 'SANTO ANDRÉ V.LUZITA',                 regiao: 'SP 01A' },
  { numero: 95,  nome: 'JEQUIÉ',                               regiao: 'BA/SE' },
  { numero: 96,  nome: 'CARAPICUIBA',                          regiao: 'SP 07' },
  { numero: 97,  nome: 'CAMPO GRANDE AEROPORTO',               regiao: 'MS' },
  { numero: 99,  nome: 'CURITIBA PINHEIRINHO',                 regiao: 'SUL' },
  { numero: 100, nome: 'DOURADOS',                             regiao: 'MS' },
  { numero: 101, nome: 'TAGUATINGA AREAL',                     regiao: 'CO' },
  { numero: 102, nome: 'RONDONÓPOLIS',                         regiao: 'MT/RO/AC' },
  { numero: 104, nome: 'PRAIA GRANDE GLÓRIA',                  regiao: 'SP 05' },
  { numero: 105, nome: 'GOIÂNIA T9',                           regiao: 'CO' },
  { numero: 108, nome: 'CONTAGEM',                             regiao: 'MG' },
  { numero: 111, nome: 'RIO VERDE',                            regiao: 'CO' },
  { numero: 112, nome: 'TABOÃO DA SERRA',                      regiao: 'SP 07' },
  { numero: 114, nome: 'NATAL',                                regiao: 'NE' },
  { numero: 116, nome: 'ARACAJU',                              regiao: 'BA/SE' },
  { numero: 117, nome: 'VALPARAÍSO',                           regiao: 'CO' },
  { numero: 118, nome: 'BELÉM',                                regiao: 'NO' },
  { numero: 121, nome: 'SÃO JOSÉ DOS CAMPOS',                  regiao: 'SP 07' },
  { numero: 123, nome: 'SANTO ANDRÉ BALA JUQUINHA',            regiao: 'SP 01A' },
  { numero: 124, nome: 'JACU PESSEGO',                         regiao: 'SP 05' },
  { numero: 126, nome: 'JARAGUÁ / TAIPAS',                     regiao: 'SP 03' },
  { numero: 127, nome: 'FRANCO DA ROCHA',                      regiao: 'SP 07' },
  { numero: 129, nome: 'SÃO VICENTE',                          regiao: 'SP 05' },
  { numero: 130, nome: 'TAUBATÉ',                              regiao: 'SP 07' },
  { numero: 131, nome: 'DUQUE DE CAXIAS',                      regiao: 'RJ 02A' },
  { numero: 133, nome: 'AYRTON SENNA',                         regiao: 'SP 05' },
  { numero: 136, nome: 'SABÃO PORTUGUÊS',                      regiao: 'RJ 02A' },
  { numero: 137, nome: 'TANCREDO NEVES',                       regiao: 'SP 03' },
  { numero: 140, nome: 'GOIANIA PERIMETRAL',                   regiao: 'CO' },
  { numero: 142, nome: 'MESQUITA/RIO DUTRA',                   regiao: 'RJ 02A' },
  { numero: 143, nome: 'LAURO DE FEITAS',                      regiao: 'BA/SE' },
  { numero: 144, nome: 'ARICANDUVA',                           regiao: 'SP 05' },
  { numero: 149, nome: 'EMBU DAS ARTES',                       regiao: 'SP 07' },
  { numero: 151, nome: 'JANDIRA',                              regiao: 'SP 07' },
  { numero: 153, nome: 'SÃO MATHEUS',                          regiao: 'SP 05' },
  { numero: 154, nome: 'CAMPINAS CENTRO',                      regiao: 'SP 07' },
  { numero: 155, nome: 'CIDADE DUTRA',                         regiao: 'SP 04' },
  { numero: 156, nome: 'DIADEMA',                              regiao: 'SP 01B' },
  { numero: 157, nome: 'SÃO MIGUEL 2',                         regiao: 'SP 02B' },
  { numero: 158, nome: 'UBERLÂNDIA',                           regiao: 'MG' },
  { numero: 161, nome: 'MAUÁ',                                 regiao: 'SP 01A' },
  { numero: 165, nome: 'BRAS CUBAS',                           regiao: 'SP 02B' },
  { numero: 167, nome: 'PIRACICABA CENTRO',                    regiao: 'SP 07' },
  { numero: 168, nome: 'PAULINIA',                             regiao: 'SP 07' },
  { numero: 173, nome: 'HORTOLÂNDIA',                          regiao: 'SP 07' },
  { numero: 174, nome: 'ARAÇATUBA',                            regiao: 'SP 07' },
  { numero: 175, nome: 'PORTO VELHO',                          regiao: 'MT/RO/AC' },
  { numero: 178, nome: 'INDAIATUBA',                           regiao: 'SP 07' },
  { numero: 180, nome: 'SINOP',                                regiao: 'MT/RO/AC' },
  { numero: 181, nome: 'PETRÓPOLIS',                           regiao: 'RJ 02B' },
  { numero: 188, nome: 'CAMPOS DOS GOYTACAZES',                regiao: 'RJ 03' },
  { numero: 192, nome: 'CUIABÁ JD AMÉRICAS',                   regiao: 'MT/RO/AC' },
  { numero: 199, nome: 'NAÇÕES UNIDAS',                        regiao: 'SP 04' },
  { numero: 200, nome: 'JUNDIAÍ FERROVIÁRIOS',                 regiao: 'SP 07' },
  { numero: 203, nome: 'SÃO BERNARDO AV TABOÃO',               regiao: 'SP 01B' },
  { numero: 205, nome: 'SANTO ANDRÉ PEREIRA BARRETO',          regiao: 'SP 01A' },
  { numero: 208, nome: 'CIDADE TIRADENTES',                    regiao: 'SP 02B' },
  { numero: 209, nome: 'GUARULHOS PIMENTAS',                   regiao: 'SP 04' },
  { numero: 213, nome: 'BETIM',                                regiao: 'MG' },
  { numero: 216, nome: 'RONDONÓPOLIS BANDEIRANTES',            regiao: 'MT/RO/AC' },
  { numero: 217, nome: 'SÃO JOÃO DO MERITI',                   regiao: 'RJ 02A' },
  { numero: 221, nome: 'ARARUAMA',                             regiao: 'RJ 02B' },
  { numero: 232, nome: 'MACAÉ',                                regiao: 'RJ 02B' },
  { numero: 240, nome: 'RIBEIRÃO PRETO CASTELO BRANCO',        regiao: 'SP 07' },
  { numero: 244, nome: 'PIRACICABA NOVA AMÉRICA',              regiao: 'SP 07' },
  { numero: 247, nome: 'IPATINGA',                             regiao: 'MG' },
  { numero: 249, nome: 'SETE LAGOAS',                          regiao: 'MG' },
  { numero: 254, nome: 'MARGINAL TIETÊ TATUAPÉ',               regiao: 'SP 05' },
  { numero: 258, nome: 'GUARULHOS BOSQUE MAIA',                regiao: 'SP 04' },
  { numero: 260, nome: 'MOOCA',                                regiao: 'SP 05' },
  { numero: 261, nome: 'BELO HORIZONTE BELVEDERE',             regiao: 'MG' },
  { numero: 265, nome: 'MOGILAR',                              regiao: 'SP 02B' },
  { numero: 267, nome: 'SÃO JOSÉ DOS CAMPOS COLINAS',          regiao: 'SP 07' },
  { numero: 269, nome: 'INTERLAGOS',                           regiao: 'SP 04' },
  { numero: 271, nome: 'GUARULHOS CENTRO',                     regiao: 'SP 04' },
  { numero: 272, nome: 'ANHANGUERA',                           regiao: 'SP 03' },
  { numero: 274, nome: 'SÃO BERNARDO ANCHIETA',                regiao: 'SP 01B' },
  { numero: 276, nome: 'GUAIANASES ESTAÇÃO',                   regiao: 'SP 02B' },
  { numero: 279, nome: 'AEROPORTO CONGONHAS',                  regiao: 'SP 04' },
  { numero: 280, nome: 'TABOÃO CENTRO',                        regiao: 'SP 07' },
  { numero: 282, nome: 'COTIA CENTRO',                         regiao: 'SP 07' },
  { numero: 283, nome: 'MINAS SHOPPING',                       regiao: 'MG' },
  { numero: 287, nome: 'BH SANTA EFIGÊNIA',                    regiao: 'MG' },
  { numero: 291, nome: 'NOVA IGUAÇU II',                       regiao: 'RJ 02A' },
  { numero: 292, nome: 'NITEROI PONTE',                        regiao: 'RJ 02B' },
  { numero: 293, nome: 'SÃO GONÇALO ALCÂNTARA',                regiao: 'RJ 03' },
  { numero: 295, nome: 'ITATIBA',                              regiao: 'SP 07' },
  { numero: 296, nome: 'BRASÍLIA PARK',                        regiao: 'CO' },
  { numero: 301, nome: 'RIBEIRÃO PRETO VARGAS',                regiao: 'SP 07' },
  { numero: 302, nome: 'GALEÃO',                               regiao: 'RJ 01' },
  { numero: 306, nome: 'TAGUATINGA SHOPPING',                  regiao: 'CO' },
  { numero: 308, nome: 'BRASÍLIA ASA NORTE',                   regiao: 'CO' },
  { numero: 310, nome: 'GOIÂNIA PORTUGAL',                     regiao: 'CO' },
  { numero: 312, nome: 'CAMPINAS ABOLIÇÃO',                    regiao: 'SP 07' },
  { numero: 313, nome: 'SANTOS ANA COSTA',                     regiao: 'SP 05' },
  { numero: 314, nome: 'FOZ DO IGUAÇU',                        regiao: 'SUL' },
  { numero: 320, nome: 'PALMAS CESAMAR',                       regiao: 'CO' },
  { numero: 323, nome: 'JUIZ DE FORA',                         regiao: 'MG' },
  { numero: 326, nome: 'SÃO JOSÉ DO RIO PRETO CLUBE PALESTRA', regiao: 'SP 07' },
  { numero: 327, nome: 'SÃO JOSÉ DO RIO PRETO ANÍSIO HADDAD',  regiao: 'SP 07' },
  { numero: 329, nome: 'SANTA ROSA CUIABÁ',                    regiao: 'MT/RO/AC' },
  { numero: 332, nome: 'BANGU AVENIDA BRASIL',                 regiao: 'RJ 01' },
  { numero: 336, nome: 'GUARUJÁ VICENTE CARVALHO',             regiao: 'SP 05' },
  { numero: 337, nome: 'BARUERI AVENIDA DO CAFÉ',              regiao: 'SP 07' },
  { numero: 338, nome: 'SANTA CRUZ VARANDAS',                  regiao: 'RJ 01' },
  { numero: 339, nome: 'SÃO BERNARDO ALVARENGA',               regiao: 'SP 01B' },
  { numero: 340, nome: 'JACARÉPAGUÁ MERCADÃO',                 regiao: 'RJ 01' },
  { numero: 341, nome: 'VILA VELHA',                           regiao: 'ES' },
  { numero: 347, nome: 'ARAGUAÍNA',                            regiao: 'CO' },
  { numero: 348, nome: 'APARECIDA DE GOIANIA',                 regiao: 'CO' },
  { numero: 349, nome: 'SANTO ANDRE JARDIM UTINGA',            regiao: 'SP 01A' },
  { numero: 350, nome: 'OSASCO VALTER BOVERI',                 regiao: 'SP 07' },
  { numero: 351, nome: 'SUMARÉ',                               regiao: 'SP 07' },
  { numero: 354, nome: 'SÃO JOSE DOS CAMPOS JK',               regiao: 'SP 07' },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpa dados existentes (ordem importa por FK)
  await prisma.notificacao.deleteMany();
  await prisma.tarefa.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.checklistEquipamento.deleteMany();
  await prisma.checklistCarrinho.deleteMany();
  await prisma.saidaPeca.deleteMany();
  await prisma.movimentacaoPeca.deleteMany();
  await prisma.entradaPeca.deleteMany();
  await prisma.peca.deleteMany();
  await prisma.controleChamado.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.loja.deleteMany();

  // ─── Lojas ────────────────────────────────────────────────────────────────
  for (const loja of LOJAS) {
    await prisma.loja.upsert({
      where: { numero: loja.numero },
      update: { nome: loja.nome, regiao: loja.regiao },
      create: loja,
    });
  }
  console.log(`✅ ${LOJAS.length} lojas inseridas`);

  const loja39  = await prisma.loja.findUnique({ where: { numero: 39 } });  // CAMPINAS AMOREIRAS - SP 07
  const loja21  = await prisma.loja.findUnique({ where: { numero: 21 } });  // LIMEIRA - SP 07

  // ─── Usuários ────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('Senha@123', 10);

  const usuarios = await Promise.all([
    prisma.usuario.create({ data: { nome: 'Admin Sistema',              email: 'admin@manutencao.com',    senha: senhaHash, role: 'ADMINISTRADOR' } }),
    prisma.usuario.create({ data: { nome: 'Marco',                      email: 'diretor@manutencao.com',  senha: senhaHash, role: 'DIRETOR' } }),
    prisma.usuario.create({ data: { nome: 'Rodrigo Godoy',              email: 'gerente@manutencao.com',  senha: senhaHash, role: 'GERENTE' } }),
    prisma.usuario.create({ data: { nome: 'Rodnei',                     email: 'gerente2@manutencao.com', senha: senhaHash, role: 'GERENTE' } }),
    prisma.usuario.create({ data: { nome: 'Nathan',                     email: 'nathan@manutencao.com',   senha: senhaHash, role: 'COORDENADOR', regiao: 'SP 07' } }),
    prisma.usuario.create({ data: { nome: 'Luciano',                    email: 'luciano@manutencao.com',  senha: senhaHash, role: 'COORDENADOR', regiao: 'SP 07' } }),
    prisma.usuario.create({ data: { nome: 'Marcos - Campinas Amoreiras',email: 'loja39@manutencao.com',   senha: senhaHash, role: 'GESTOR', regiao: loja39.regiao, lojaId: loja39.id } }),
    prisma.usuario.create({ data: { nome: 'Luis - Limeira',             email: 'loja21@manutencao.com',   senha: senhaHash, role: 'GESTOR', regiao: loja21.regiao, lojaId: loja21.id } }),
    prisma.usuario.create({ data: { nome: 'Maria Técnica',              email: 'tecnico2@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: loja39.regiao, lojaId: loja39.id } }),
    prisma.usuario.create({ data: { nome: 'João Técnico',               email: 'tecnico@manutencao.com',  senha: senhaHash, role: 'TECNICO', regiao: loja21.regiao, lojaId: loja21.id } }),
    prisma.usuario.create({ data: { nome: 'Pedro Técnico',              email: 'tecnico3@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: loja39.regiao, lojaId: loja39.id } }),
    prisma.usuario.create({ data: { nome: 'Julia Técnica',              email: 'tecnico4@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: loja21.regiao, lojaId: loja21.id } }),
  ]);
  console.log(`✅ ${usuarios.length} usuários criados`);

  // ─── Fornecedores ─────────────────────────────────────────────────────────
  const fornecedores = await prisma.fornecedor.createMany({
    data: [
      { nome: 'Rios Refrigeração',            telefone: '(11) 99999-0001', email: 'rios@rios.com.br',                  segmento: 'REFRIGERACAO',  cnpj: '12345678000195' },
      { nome: 'Elétrica Central S/A',          telefone: '(11) 99999-0002', email: 'vendas@eletricacentral.com.br',     segmento: 'ELETRICA',      cnpj: '23456789000186' },
      { nome: 'Indi Empilhadeiras',            telefone: '(11) 99999-0003', email: 'indi@indi.com.br',                  segmento: 'EMPILHADEIRA',  cnpj: '34567890000177' },
      { nome: 'Civil Master Construções',      telefone: '(11) 99999-0004', email: 'obras@civilmaster.com.br',          segmento: 'CIVIL',         cnpj: '45678901000168' },
      { nome: 'Serralheria Ferro & Aço',       telefone: '(11) 99999-0005', email: 'orcamento@ferroeaco.com.br',        segmento: 'SERRALHERIA',   cnpj: '56789012000159' },
      { nome: 'PERFIL REFRIG IND COM',         telefone: '(11) 99999-0006', email: 'contato@perfilrefrig.com.br',       segmento: 'REFRIGERACAO',  cnpj: '09536473000182' },
      { nome: 'Ágil Geradores',                telefone: '(11) 99999-0007', email: 'vendas@agilgeradores.com.br',       segmento: 'GERADOR',       cnpj: '11396273000113' },
      { nome: 'ETS Engenharia e Manutenção',   telefone: '(11) 99999-0008', email: 'suporte@etsengenharia.com.br',      segmento: 'EQUIPAMENTOS',  cnpj: '04697262000108' },
      { nome: 'BASIC ELEVADORES LTDA',         telefone: '(11) 99999-0009', email: 'atendimento@basicelevadores.com.br',segmento: 'ELEVADOR',      cnpj: '02254737000166' },
    ],
  });
  console.log(`✅ ${fornecedores.count} fornecedores criados`);

  // ─── Peças de estoque ─────────────────────────────────────────────────────
  const pecas = await Promise.all([
    prisma.peca.create({ data: { nome: 'Filtro de Ar Condicionado 1T',  descricao: 'Filtro para split 1 tonelada',     quantidadeEstoque: 15 } }),
    prisma.peca.create({ data: { nome: 'Correia Transportadora 3m',     descricao: 'Correia para empilhadeira',         quantidadeEstoque: 4 } }),
    prisma.peca.create({ data: { nome: 'Disjuntor 20A Bifásico',        descricao: 'Disjuntor para painel elétrico',    quantidadeEstoque: 8 } }),
    prisma.peca.create({ data: { nome: 'Rolamento SKF 6205',            descricao: 'Rolamento industrial',              quantidadeEstoque: 2 } }),
    prisma.peca.create({ data: { nome: 'Cabo PP 4mm² 100m',             descricao: 'Cabo elétrico flexível',            quantidadeEstoque: 3 } }),
    prisma.peca.create({ data: { nome: 'Gás Fluido Refrigerante R410A', descricao: 'Botija R410A de Refrigeração',      quantidadeEstoque: 10 } }),
    prisma.peca.create({ data: { nome: 'Gás Fluido Refrigerante R22',   descricao: 'Botija R22 para ACs antigos',       quantidadeEstoque: 5 } }),
  ]);
  console.log(`✅ ${pecas.length} peças criadas`);

  const pR410A = pecas.find(p => p.nome.includes('R410A'));
  const pR22   = pecas.find(p => p.nome.includes('R22'));

  await prisma.entradaPeca.createMany({
    data: [
      { pecaId: pR410A.id, dataEntrada: new Date(Date.now() - 5*86400000), quantidade: 15, valorUnitario: 350.00, fornecedor: 'TechCool Refrigeração LTDA', numeroNotaFiscal: 'NF-888', total: 5250.00 },
      { pecaId: pR22.id,   dataEntrada: new Date(Date.now() - 10*86400000), quantidade: 8, valorUnitario: 420.00, fornecedor: 'TechCool Refrigeração LTDA', numeroNotaFiscal: 'NF-890', total: 3360.00 },
    ],
  });

  await prisma.movimentacaoPeca.create({
    data: { pecaId: pR22.id, dataMovimentacao: new Date(Date.now() - 2*86400000), lojaRequisitante: loja21.nome, quantidade: 3, numeroChamado: 'CSA-1025', status: 'RECEBIDO' },
  });

  await prisma.saidaPeca.create({
    data: { pecaId: pR410A.id, data: new Date(Date.now() - 86400000), quantidade: 5, destino: 'Manutenção Preventiva Câmara Fria', nomeRetirou: 'João Técnico', empresa: 'Uso Interno' },
  });

  // ─── Tarefas ──────────────────────────────────────────────────────────────
  const [, , , , coordenador, , gestor39, gestor21, , tecnico1, , tecnico2] = usuarios;

  await prisma.tarefa.createMany({
    data: [
      { descricao: 'Manutenção preventiva dos sistemas de refrigeração',   prioridade: 'ALTA',    status: 'EM_ANDAMENTO', areResponsavel: 'Refrigeração', regiao: loja39.regiao, unidade: loja39.nome, criadoPorId: gestor39.id, atribuidoParaId: tecnico1.id, dataConclusao: new Date(Date.now() + 2*86400000) },
      { descricao: 'Verificar quadro elétrico principal — Almoxarifado',   prioridade: 'CRITICA', status: 'PENDENTE',     areResponsavel: 'Elétrica',     regiao: loja39.regiao, unidade: loja39.nome, criadoPorId: coordenador.id, atribuidoParaId: tecnico1.id },
      { descricao: 'Troca de bateria da empilhadeira #3',                  prioridade: 'MEDIA',   status: 'PENDENTE',     areResponsavel: 'Empilhadeira', regiao: loja21.regiao, unidade: loja21.nome, criadoPorId: gestor21.id, atribuidoParaId: tecnico2.id },
      { descricao: 'Pintura e reparo de calha na área de carga',           prioridade: 'BAIXA',   status: 'PENDENTE',     areResponsavel: 'Civil',        regiao: loja21.regiao, unidade: loja21.nome, criadoPorId: gestor21.id },
      { descricao: 'Inspeção do sistema de PCI — área de estoque',        prioridade: 'ALTA',    status: 'CONCLUIDA',    areResponsavel: 'PCI',          regiao: loja21.regiao, unidade: loja21.nome, criadoPorId: gestor21.id, atribuidoParaId: tecnico2.id },
    ],
  });
  console.log('✅ 5 tarefas criadas');

  // ─── Chamados financeiros ─────────────────────────────────────────────────
  const gestores = [gestor39, gestor21];
  const lojasPorGestor = { [gestor39.id]: loja39, [gestor21.id]: loja21 };
  const meses = [0, -1, -2, -3, -4];
  const segmentos = ['REFRIGERACAO','ELETRICA','EMPILHADEIRA','CIVIL','SERRALHERIA','GERADOR','ELEVADOR'];
  const empresas  = ['Rios Refrigeração','Elétrica Central','ETS Engenharia','Ágil Geradores','BASIC ELEVADORES'];
  const chamadosData = [];

  for (const g of gestores) {
    const loja = lojasPorGestor[g.id];
    for (const offset of meses) {
      const base = new Date();
      base.setMonth(base.getMonth() + offset);
      for (let i = 1; i <= 5; i++) {
        const valor = parseFloat((Math.random() * 2500 + 400).toFixed(2));
        chamadosData.push({
          dataAbertura:   new Date(base.getFullYear(), base.getMonth(), Math.floor(Math.random()*25)+1),
          numeroChamado:  `CSA-${loja.numero}-${Math.abs(offset)}${i}${Math.floor(Math.random()*100)}`,
          segmento:       segmentos[Math.floor(Math.random()*segmentos.length)],
          empresa:        empresas[Math.floor(Math.random()*empresas.length)],
          regiao:         loja.regiao,
          unidade:        loja.nome,
          descricao:      `Manutenção preventiva/corretiva - Chamado Mensal ${i}`,
          numeroOrcamento:`ORC-${Math.floor(Math.random()*9000)+1000}`,
          valor,
          status: offset < 0 ? 'FINALIZADO' : (i % 3 === 0 ? 'AGUARDANDO_APROVACAO' : 'CHAMADO_ABERTO'),
          mauUso: Math.random() > 0.85,
        });
      }
    }
  }

  await prisma.controleChamado.createMany({ data: chamadosData });
  console.log(`✅ ${chamadosData.length} chamados criados`);

  // ─── Frota e Checklists ───────────────────────────────────────────────────
  const tiposCarrinho = ['MARIA_GORDA','SUPERCAR','DOIS_ANDARES','PRANCHA','ESCADA'];
  const tiposEquip    = ['EMPILHADEIRA_ELETRICA','SERRA_FITA','EMBALADORA_VACUO','ELEVADOR','ILHASELF'];
  const ano = new Date().getFullYear();
  const semanaAtual = 15;

  for (const g of gestores) {
    const loja = lojasPorGestor[g.id];
    for (const tipo of tiposCarrinho) {
      await prisma.frotaCarrinho.create({
        data: { unidade: loja.nome, tipoCarrinho: tipo, total: Math.floor(Math.random()*20)+5 },
      });
    }
    for (let s = semanaAtual - 1; s <= semanaAtual; s++) {
      await prisma.checklistEquipamento.create({
        data: { semana: s, ano, regiao: loja.regiao, unidade: loja.nome, criadoPorId: g.id,
          itens: { create: tiposEquip.map(tipo => ({ tipoEquipamento: tipo, operacional: Math.random()>0.2, quantidade: 1, quantidadeQuebrada: 0 })) },
        },
      });
      await prisma.checklistCarrinho.create({
        data: { semana: s, ano, regiao: loja.regiao, unidade: loja.nome, criadoPorId: g.id,
          itens: { create: tiposCarrinho.map(tipo => ({ tipoCarrinho: tipo, total: 10, quebrados: Math.floor(Math.random()*2) })) },
        },
      });
    }
  }
  console.log('✅ Frotas e checklists criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('  admin@manutencao.com   | Senha@123');
  console.log('  gerente@manutencao.com | Senha@123');
  console.log('  loja39@manutencao.com  | Senha@123  (Gestor - CAMPINAS AMOREIRAS)');
  console.log('  loja21@manutencao.com  | Senha@123  (Gestor - LIMEIRA)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

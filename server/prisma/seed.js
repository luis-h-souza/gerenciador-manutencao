require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');
const { seedLojas } = require('./seed-loja');
const { seedFornecedores } = require('./seed-fornecedor');
const { seedChamados } = require('./seed-chamados');

const SENHA_PADRAO = 'Senha@123';

const PECAS_DATA = [
  { nome: 'Filtro de Ar Condicionado 1T', descricao: 'Filtro para split 1 tonelada', quantidadeEstoque: 15 },
  { nome: 'Correia Transportadora 3m', descricao: 'Correia para empilhadeira', quantidadeEstoque: 4 },
  { nome: 'Disjuntor 20A Bifasico', descricao: 'Disjuntor para painel elétrico', quantidadeEstoque: 8 },
  { nome: 'Rolamento SKF 6205', descricao: 'Rolamento industrial', quantidadeEstoque: 2 },
  { nome: 'Cabo PP 4mm2 100m', descricao: 'Cabo elétrico flexível', quantidadeEstoque: 3 },
  { nome: 'Gas Fluido Refrigerante R410A', descricao: 'Botija R410A de refrigeração', quantidadeEstoque: 10 },
  { nome: 'Gas Fluido Refrigerante R22', descricao: 'Botija R22 para ACs antigos', quantidadeEstoque: 5 },
];

const TIPOS_CARRINHO = ['MARIA_GORDA', 'SUPERCAR', 'DOIS_ANDARES', 'PRANCHA', 'ESCADA'];
const TIPOS_EQUIP = ['EMPILHADEIRA_ELETRICA', 'SERRA_FITA', 'EMBALADORA_VACUO', 'ELEVADOR', 'ILHASELF'];

async function cleanDatabase() {
  await prisma.notificacao.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.checklistEquipamentoItem.deleteMany();
  await prisma.checklistCarrinhoItem.deleteMany();
  await prisma.checklistEquipamento.deleteMany();
  await prisma.checklistCarrinho.deleteMany();
  await prisma.frotaCarrinho.deleteMany();
  await prisma.saidaPeca.deleteMany();
  await prisma.movimentacaoPeca.deleteMany();
  await prisma.entradaPeca.deleteMany();
  await prisma.tarefa.deleteMany();
  await prisma.controleChamado.deleteMany();
  await prisma.peca.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.loja.deleteMany();
}

async function createUsuarios() {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  const lojas = await prisma.loja.findMany({ orderBy: { numero: 'asc' } });
  const lojasByNumero = new Map(lojas.map((loja) => [loja.numero, loja]));

  const usuariosSeed = [
    { nome: 'Admin Sistema', email: 'admin@manutencao.com', role: 'ADMINISTRADOR' },
    { nome: 'Marcos Diretor', email: 'diretor@manutencao.com', role: 'DIRETOR' },
    
    { nome: 'Rodrigo Godoi', email: 'gerente@manutencao.com', role: 'GERENTE', regiao: 'SP 07, SP 08, SP 09, SP 10' },
    { nome: 'Nathan', email: 'nathan@manutencao.com', role: 'COORDENADOR', regiao: 'SP 08, SP 10' },
    { nome: 'Adelito', email: 'luciano@manutencao.com', role: 'COORDENADOR', regiao: 'SP 07, SP 09' },
    { nome: 'Luis Henrique', email: 'loja246@manutencao.com', role: 'GESTOR', lojaNumero: 246 },
    { nome: 'Joao', email: 'loja39@manutencao.com', role: 'GESTOR', lojaNumero: 39 },
    { nome: 'Matheus Lourenco', email: 'loja312@manutencao.com', role: 'GESTOR', lojaNumero: 312 },
    { nome: 'Pedro SP10', email: 'loja130@manutencao.com', role: 'GESTOR', lojaNumero: 130 },
    { nome: 'Maria', email: 'tecnico39@manutencao.com', role: 'TECNICO', lojaNumero: 39 },
    { nome: 'Jose', email: 'tecnico246@manutencao.com', role: 'TECNICO', lojaNumero: 246 },
    { nome: 'Pedro', email: 'tecnico312@manutencao.com', role: 'TECNICO', lojaNumero: 312 },
    { nome: 'Julia Tecnica', email: 'tecnico130@manutencao.com', role: 'TECNICO', lojaNumero: 130 },
  ];

  const usuarios = [];
  for (const item of usuariosSeed) {
    const loja = item.lojaNumero ? lojasByNumero.get(item.lojaNumero) : null;
    const usuario = await prisma.usuario.create({
      data: {
        nome: item.nome,
        email: item.email,
        senha: senhaHash,
        role: item.role,
        regiao: loja?.regiao || item.regiao || null,
        lojaId: loja?.id || null,
      },
      include: { loja: true },
    });
    usuarios.push(usuario);
  }

  return usuarios;
}

async function createPecas() {
  const pecas = [];
  for (const peca of PECAS_DATA) {
    pecas.push(await prisma.peca.create({ data: peca }));
  }
  return pecas;
}

async function createFluxoEstoque(pecas) {
  const pR410A = pecas.find((peca) => peca.nome.includes('R410A'));
  const pR22 = pecas.find((peca) => peca.nome.includes('R22'));

  await prisma.entradaPeca.createMany({
    data: [
      {
        pecaId: pR410A.id,
        dataEntrada: new Date(Date.now() - 5 * 86400000),
        quantidade: 15,
        valorUnitario: 350,
        fornecedor: 'COZITEC REFRIGERACAO LTDA',
        numeroNotaFiscal: 'NF-888',
        total: 5250,
      },
      {
        pecaId: pR22.id,
        dataEntrada: new Date(Date.now() - 10 * 86400000),
        quantidade: 8,
        valorUnitario: 420,
        fornecedor: 'AR CICLO COMERCIO SERV E REFRIGERACAO LT',
        numeroNotaFiscal: 'NF-890',
        total: 3360,
      },
    ],
  });

  await prisma.movimentacaoPeca.create({
    data: {
      pecaId: pR22.id,
      dataMovimentacao: new Date(Date.now() - 2 * 86400000),
      lojaRequisitante: 'LIMEIRA II',
      quantidade: 3,
      numeroChamado: 'CSA-246-0001',
      status: 'RECEBIDO',
    },
  });

  await prisma.saidaPeca.create({
    data: {
      pecaId: pR410A.id,
      data: new Date(Date.now() - 1 * 86400000),
      quantidade: 5,
      destino: 'Manutencao preventiva camara fria',
      nomeRetirou: 'Joao Tecnico',
      empresa: 'Uso Interno',
    },
  });
}

async function createTarefas(usuarios) {
  const byEmail = new Map(usuarios.map((usuario) => [usuario.email, usuario]));
  const gestor246 = byEmail.get('loja246@manutencao.com');
  const gestor39 = byEmail.get('loja39@manutencao.com');
  const coordenador = byEmail.get('nathan@manutencao.com');
  const gerente = byEmail.get('gerente@manutencao.com');
  const tecnico39 = byEmail.get('tecnico39@manutencao.com');
  const tecnico246 = byEmail.get('tecnico246@manutencao.com');
  const tecnico312 = byEmail.get('tecnico312@manutencao.com');

  const tarefas = [
    {
      descricao: 'Manutencao preventiva dos sistemas de refrigeracao - Bloco A',
      prioridade: 'ALTA',
      status: 'EM_ANDAMENTO',
      areResponsavel: 'Refrigeracao',
      regiao: gestor39.loja.regiao,
      unidade: gestor39.loja.nome,
      criadoPorId: gestor39.id,
      atribuidoParaId: tecnico39.id,
      dataConclusao: new Date(Date.now() + 2 * 86400000),
    },
    {
      descricao: 'Verificar quadro eletrico principal - Almoxarifado',
      prioridade: 'CRITICA',
      status: 'PENDENTE',
      areResponsavel: 'Eletrica',
      regiao: gestor39.loja.regiao,
      unidade: gestor39.loja.nome,
      criadoPorId: coordenador.id,
      atribuidoParaId: tecnico39.id,
    },
    {
      descricao: 'Troca de bateria da empilhadeira #3',
      prioridade: 'MEDIA',
      status: 'PENDENTE',
      areResponsavel: 'Empilhadeira',
      regiao: gestor246.loja.regiao,
      unidade: gestor246.loja.nome,
      criadoPorId: gestor246.id,
      atribuidoParaId: tecnico246.id,
    },
    {
      descricao: 'Pintura e reparo de calha na area de carga',
      prioridade: 'BAIXA',
      status: 'PENDENTE',
      areResponsavel: 'Civil',
      regiao: gestor246.loja.regiao,
      unidade: gestor246.loja.nome,
      criadoPorId: gestor246.id,
    },
    {
      descricao: 'Inspecao do sistema de PCI - area de estoque',
      prioridade: 'ALTA',
      status: 'CONCLUIDA',
      areResponsavel: 'PCI',
      regiao: gestor246.loja.regiao,
      unidade: gestor246.loja.nome,
      criadoPorId: gerente.id,
      atribuidoParaId: tecnico246.id,
    },
    {
      descricao: 'Avaliacao termografica em paineis de distribuicao',
      prioridade: 'CRITICA',
      status: 'EM_ANDAMENTO',
      areResponsavel: 'Eletrica',
      regiao: 'SP 09',
      unidade: 'CAMPINAS ABOLICAO',
      criadoPorId: gerente.id,
      atribuidoParaId: tecnico312.id,
    },
  ];

  await prisma.tarefa.createMany({ data: tarefas });
}

async function createFrotaEChecklists(gestores) {
  const ano = new Date().getFullYear();
  const semanaAtual = 15;

  for (const gestor of gestores) {
    const unidade = gestor.loja?.nome;
    const regiao = gestor.loja?.regiao || gestor.regiao;
    if (!unidade || !regiao) continue;

    for (const [index, tipo] of TIPOS_CARRINHO.entries()) {
      await prisma.frotaCarrinho.create({
        data: {
          unidade,
          tipoCarrinho: tipo,
          total: 6 + index,
        },
      });
    }

    for (let semana = semanaAtual - 1; semana <= semanaAtual; semana += 1) {
      await prisma.checklistEquipamento.create({
        data: {
          semana,
          ano,
          regiao,
          unidade,
          criadoPorId: gestor.id,
          itens: {
            create: TIPOS_EQUIP.map((tipo, index) => ({
              tipoEquipamento: tipo,
              operacional: !(semana === semanaAtual && index === 0),
              quantidade: 1,
              quantidadeQuebrada: semana === semanaAtual && index === 0 ? 1 : 0,
            })),
          },
        },
      });

      await prisma.checklistCarrinho.create({
        data: {
          semana,
          ano,
          regiao,
          unidade,
          criadoPorId: gestor.id,
          itens: {
            create: TIPOS_CARRINHO.map((tipo, index) => ({
              tipoCarrinho: tipo,
              total: 8 + index,
              quebrados: semana === semanaAtual && index === 0 ? 1 : 0,
            })),
          },
        },
      });
    }
  }
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  await cleanDatabase();

  const lojas = await seedLojas();
  console.log(`✅ ${lojas.length} lojas carregadas do arquivo loja.md`);

  const usuarios = await createUsuarios();
  console.log(`✅ ${usuarios.length} usuarios criados`);

  const fornecedores = await seedFornecedores();
  console.log(`✅ ${fornecedores.length} fornecedores criados`);

  const pecas = await createPecas();
  console.log(`✅ ${pecas.length} pecas criadas`);

  await createFluxoEstoque(pecas);
  console.log('✅ Fluxo de estoque criado');

  await createTarefas(usuarios);
  console.log('✅ Tarefas criadas');

  const chamados = await seedChamados();
  console.log(`✅ ${chamados.length} chamados financeiros criados`);

  const gestores = usuarios.filter((usuario) => usuario.role === 'GESTOR');
  await createFrotaEChecklists(gestores);
  console.log('✅ Frotas e checklists criados');

  console.log('\n🎉 Seed concluido com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log(`  admin@manutencao.com   | ${SENHA_PADRAO}  (Administrador)`);
  console.log(`  diretor@manutencao.com | ${SENHA_PADRAO}  (Diretor)`);
  console.log(`  gerente@manutencao.com | ${SENHA_PADRAO}  (Gerente)`);
  console.log(`  nathan@manutencao.com  | ${SENHA_PADRAO}  (Coordenador)`);
  console.log(`  loja39@manutencao.com  | ${SENHA_PADRAO}  (Gestor Loja 39)`);
  console.log(`  loja246@manutencao.com | ${SENHA_PADRAO}  (Gestor Loja 246)`);
  console.log(`  tecnico39@manutencao.com | ${SENHA_PADRAO}  (Tecnico Loja 39)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

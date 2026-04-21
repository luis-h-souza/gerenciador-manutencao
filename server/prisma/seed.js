// prisma/seed.js
require('dotenv').config();
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');

const LOJAS = [
  { numero: 246,   nome: 'LIMEIRA II',                          regiao: 'SP 07' },
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

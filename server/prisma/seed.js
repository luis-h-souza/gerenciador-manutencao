require('dotenv').config();
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');
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

  // ─── Usuários ────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('Senha@123', 10);

  const usuarios = await Promise.all([
    prisma.usuario.create({ data: { nome: 'Admin Sistema', email: 'admin@manutencao.com', senha: senhaHash, role: 'ADMINISTRADOR' } }),
    prisma.usuario.create({ data: { nome: 'Marco', email: 'diretor@manutencao.com', senha: senhaHash, role: 'DIRETOR' } }),
    
    prisma.usuario.create({ data: { nome: 'Rodrigo Godoy', email: 'gerente@manutencao.com', senha: senhaHash, role: 'GERENTE' } }),
    prisma.usuario.create({ data: { nome: 'Rodnei', email: 'gerente2@manutencao.com', senha: senhaHash, role: 'GERENTE' } }),

    prisma.usuario.create({ data: { nome: 'Nathan', email: 'nathan@manutencao.com', senha: senhaHash, role: 'COORDENADOR', regiao: 'SP8' } }),
    prisma.usuario.create({ data: { nome: 'Luciano', email: 'luciano@manutencao.com', senha: senhaHash, role: 'COORDENADOR', regiao: 'SP7' } }),

    prisma.usuario.create({ data: { nome: 'Marcos SP8-Loja 39', email: 'loja39@manutencao.com', senha: senhaHash, role: 'GESTOR', regiao: 'SP8', unidade: 'Loja 39' } }),
    prisma.usuario.create({ data: { nome: 'Luis SP7-Loja 246', email: 'loja246@manutencao.com', senha: senhaHash, role: 'GESTOR', regiao: 'SP7', unidade: 'Loja 246' } }),

    prisma.usuario.create({ data: { nome: 'Maria Técnica SP8-Loja 39', email: 'tecnico2@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: 'SP8', unidade: 'Loja 39' } }),
    prisma.usuario.create({ data: { nome: 'João Técnico SP7-Loja 246', email: 'tecnico@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: 'SP7', unidade: 'Loja 246' } }),
    prisma.usuario.create({ data: { nome: 'Pedro Técnico SP8-Loja 39', email: 'tecnico3@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: 'SP8', unidade: 'Loja 39' } }),
    prisma.usuario.create({ data: { nome: 'Julia Técnica SP7-Loja 21', email: 'tecnico4@manutencao.com', senha: senhaHash, role: 'TECNICO', regiao: 'SP7', unidade: 'Loja 21' } }),
  ]);

  console.log(`✅ ${usuarios.length} usuários criados`);

  // ─── Fornecedores ─────────────────────────────────────────────────────────
  const fornecedores = await prisma.fornecedor.createMany({
    data: [
      { nome: 'Rios Refrigeração', telefone: '(11) 99999-0001', email: 'rios@rios.com.br', segmento: 'REFRIGERACAO', cnpj: '12345678000195' },
      { nome: 'Elétrica Central S/A', telefone: '(11) 99999-0002', email: 'vendas@eletricacentral.com.br', segmento: 'ELETRICA', cnpj: '23456789000186' },
      { nome: 'Indi Empilhadeiras', telefone: '(11) 99999-0003', email: 'indi@indi.com.br', segmento: 'EMPILHADEIRA', cnpj: '34567890000177' },
      { nome: 'Civil Master Construções', telefone: '(11) 99999-0004', email: 'obras@civilmaster.com.br', segmento: 'CIVIL', cnpj: '45678901000168' },
      { nome: 'Serralheria Ferro & Aço', telefone: '(11) 99999-0005', email: 'orcamento@ferroeaco.com.br', segmento: 'SERRALHERIA', cnpj: '56789012000159' },
      { nome: 'PERFIL REFRIG IND COM SERVICOS LTDA', telefone: '(11) 99999-0006', email: 'contato@perfilrefrig.com.br', segmento: 'REFRIGERACAO', cnpj: '09536473000182' },
      { nome: 'Ágil Geradores', telefone: '(11) 99999-0007', email: 'vendas@agilgeradores.com.br', segmento: 'GERADOR', cnpj: '11396273000113' },
      { nome: 'ETS Engenharia e Manutenção', telefone: '(11) 99999-0008', email: 'suporte@etsengenharia.com.br', segmento: 'AR_CONDICIONADO', cnpj: '04697262000108' },
      { nome: 'BASIC ELEVADORES LTDA', telefone: '(11) 99999-0009', email: 'atendimento@basicelevadores.com.br', segmento: 'ELEVADOR', cnpj: '02254737000166' },
    ],
  });
  console.log(`✅ ${fornecedores.count} fornecedores criados`);

  // ─── Peças de estoque ─────────────────────────────────────────────────────
  const pecas = await Promise.all([
    prisma.peca.create({ data: { nome: 'Filtro de Ar Condicionado 1T', descricao: 'Filtro para split 1 tonelada', quantidadeEstoque: 15 } }),
    prisma.peca.create({ data: { nome: 'Correia Transportadora 3m', descricao: 'Correia para empilhadeira', quantidadeEstoque: 4 } }),
    prisma.peca.create({ data: { nome: 'Disjuntor 20A Bifásico', descricao: 'Disjuntor para painel elétrico', quantidadeEstoque: 8 } }),
    prisma.peca.create({ data: { nome: 'Rolamento SKF 6205', descricao: 'Rolamento industrial', quantidadeEstoque: 2 } }),
    prisma.peca.create({ data: { nome: 'Cabo PP 4mm² 100m', descricao: 'Cabo elétrico flexível', quantidadeEstoque: 3 } }),
    prisma.peca.create({ data: { nome: 'Gás Fluido Refrigerante R410A', descricao: 'Botija R410A de Refrigeração', quantidadeEstoque: 10 } }),
    prisma.peca.create({ data: { nome: 'Gás Fluido Refrigerante R22', descricao: 'Botija R22 para ACs antigos', quantidadeEstoque: 5 } }),
  ]);
  console.log(`✅ ${pecas.length} peças criadas`);

  // ─── Popular Fluxos de Estoque Reais (Entradas, Movs, Saidas) ───────────────
  const pR410A = pecas.find(p => p.nome.includes('R410A'));
  const pR22 = pecas.find(p => p.nome.includes('R22'));

  // 1. Entrada de ambos (simular que comprei)
  await prisma.entradaPeca.createMany({
    data: [
      { pecaId: pR410A.id, dataEntrada: new Date(Date.now() - 5 * 86400000), quantidade: 15, valorUnitario: 350.00, fornecedor: 'TechCool Refrigeração LTDA', numeroNotaFiscal: 'NF-888', total: 5250.00 },
      { pecaId: pR22.id, dataEntrada: new Date(Date.now() - 10 * 86400000), quantidade: 8, valorUnitario: 420.00, fornecedor: 'TechCool Refrigeração LTDA', numeroNotaFiscal: 'NF-890', total: 3360.00 },
    ]
  });

  // 2. Movimentação (R22) - Transferência entre filiais
  await prisma.movimentacaoPeca.create({
    data: {
      pecaId: pR22.id, dataMovimentacao: new Date(Date.now() - 2 * 86400000), lojaRequisitante: 'Filial SP7', quantidade: 3, numeroChamado: 'CSA-1025', status: 'RECEBIDO'
    }
  });

  // 3. Saída Completa (R410A) - Consumo mecânico/terceiro
  await prisma.saidaPeca.create({
    data: {
      pecaId: pR410A.id, data: new Date(Date.now() - 1 * 86400000), quantidade: 5, destino: 'Manutenção Preventiva Câmara Fria', nomeRetirou: 'João Técnico', empresa: 'Uso Interno'
    }
  });

  // ─── Tarefas ──────────────────────────────────────────────────────────────
  const [, supervisor, coordenador, gestor, tecnico1, tecnico2] = usuarios;
  await prisma.tarefa.createMany({
    data: [
      { descricao: 'Manutenção preventiva dos sistemas de refrigeração — Bloco A', prioridade: 'ALTA', status: 'EM_ANDAMENTO', areResponsavel: 'Refrigeração', regiao: 'SP1', criadoPorId: gestor.id, atribuidoParaId: tecnico1.id, dataConclusao: new Date(Date.now() + 2 * 86400000) },
      { descricao: 'Verificar quadro elétrico principal — Almoxarifado', prioridade: 'CRITICA', status: 'PENDENTE', areResponsavel: 'Elétrica', regiao: 'SP1', criadoPorId: coordenador.id, atribuidoParaId: tecnico1.id },
      { descricao: 'Troca de bateria da empilhadeira #3', prioridade: 'MEDIA', status: 'PENDENTE', areResponsavel: 'Empilhadeira', regiao: 'SP7', criadoPorId: gestor.id, atribuidoParaId: tecnico2.id },
      { descricao: 'Pintura e reparo de calha na área de carga', prioridade: 'BAIXA', status: 'PENDENTE', areResponsavel: 'Civil', regiao: 'SP7', criadoPorId: gestor.id },
      { descricao: 'Inspeção do sistema de PCI — área de estoque', prioridade: 'ALTA', status: 'CONCLUIDA', areResponsavel: 'PCI', regiao: 'SP7', criadoPorId: supervisor.id, atribuidoParaId: tecnico2.id },
      { descricao: 'Substituição de correia de gerador central', prioridade: 'ALTA', status: 'PENDENTE', areResponsavel: 'Equipamentos', regiao: 'RJ1', criadoPorId: supervisor.id },
      { descricao: 'Reparo de bomba de sucção SP2', prioridade: 'MEDIA', status: 'CONCLUIDA', areResponsavel: 'Mecânica', regiao: 'RJ2', criadoPorId: gestor.id },
      { descricao: 'Avaliação termográfica em painéis de distribuição', prioridade: 'CRITICA', status: 'EM_ANDAMENTO', areResponsavel: 'Elétrica', regiao: 'RJ1', criadoPorId: coordenador.id },
    ],
  });
  console.log('✅ 5 tarefas criadas');

  // ─── Chamados financeiros (Massivo para Gestores) ─────────────────────────
  const gestores = usuarios.filter(u => u.role === 'GESTOR');
  const mesesAtras = [0, -1, -2, -3, -4]; // Mês atual e 4 anteriores
  const chamadosData = [];

  const segmentos = ['REFRIGERACAO', 'ELETRICA', 'EMPILHADEIRA', 'CIVIL', 'SERRALHERIA', 'GERADOR', 'ELEVADOR', 'AR_CONDICIONADO'];
  const empresasFicticias = ['Rios Refrigeração', 'Elétrica Central', 'ETS Engenharia', 'Ágil Geradores', 'BASIC ELEVADORES', 'Civil Master'];

  for (const g of gestores) {
    for (const offset of mesesAtras) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + offset);
      
      // Criar pelo menos 5 chamados por mês para cada gestor
      for (let i = 1; i <= 5; i++) {
        const dia = Math.floor(Math.random() * 25) + 1;
        const valor = parseFloat((Math.random() * 2500 + 400).toFixed(2));
        const segmentoVal = segmentos[Math.floor(Math.random() * segmentos.length)];
        
        chamadosData.push({
          dataAbertura: new Date(baseDate.getFullYear(), baseDate.getMonth(), dia),
          numeroChamado: `CSA-${g.unidade.replace('Loja ', '')}-${Math.abs(offset)}${i}${Math.floor(Math.random()*100)}`,
          segmento: segmentoVal,
          empresa: empresasFicticias[Math.floor(Math.random() * empresasFicticias.length)],
          regiao: g.regiao,
          unidade: g.unidade, // Importante para o filtro de Unidade
          descricao: `Manutenção preventiva/corretiva de ${segmentoVal.toLowerCase()} - Chamado Mensal ${i}`,
          numeroOrcamento: `ORC-${Math.floor(Math.random()*9000)+1000}`,
          valor: valor,
          status: offset < 0 ? 'FINALIZADO' : (i % 3 === 0 ? 'AGUARDANDO_APROVACAO' : 'CHAMADO_ABERTO'),
          mauUso: Math.random() > 0.85
        });
      }
    }
  }

  // Adicionar alguns chamados para coordenadores (avulsos)
  const coordenadores = usuarios.filter(u => u.role === 'COORDENADOR');
  for (const c of coordenadores) {
     chamadosData.push({
       dataAbertura: new Date(),
       numeroChamado: `CSA-COORD-${c.regiao}-${Math.floor(Math.random()*1000)}`,
       segmento: 'DIVERSOS',
       empresa: 'Manutenção Global LTDA',
       regiao: c.regiao,
       descricao: 'Chamado de ajuste regional',
       valor: 1500.00,
       status: 'CHAMADO_ABERTO'
     });
  }

  await prisma.controleChamado.createMany({ data: chamadosData });
  console.log(`✅ ${chamadosData.length} chamados financeiros criados`);

  // ─── Frota e Checklists (Novos) ──────────────────────────────────────────
  console.log('🧪 Gerando frotas e checklists de teste...');
  const tiposCarrinho = ['MARIA_GORDA', 'SUPERCAR', 'DOIS_ANDARES', 'PRANCHA', 'ESCADA'];
  const tiposEquip = ['EMPILHADEIRA_ELETRICA', 'SERRA_FITA', 'EMBALADORA_VACUO', 'ELEVADOR', 'ILHASELF'];

  for (const g of gestores) {
    // 1. Criar Frota
    for (const tipo of tiposCarrinho) {
      await prisma.frotaCarrinho.create({
        data: { unidade: g.unidade, tipoCarrinho: tipo, total: Math.floor(Math.random() * 20) + 5 }
      });
    }

    // 2. Criar Checklists para as últimas 2 semanas
    const ano = new Date().getFullYear();
    const semanaAtual = 15; // Simulação

    for (let s = semanaAtual - 1; s <= semanaAtual; s++) {
      await prisma.checklistEquipamento.create({
        data: {
          semana: s, ano, regiao: g.regiao, unidade: g.unidade, criadoPorId: g.id,
          itens: {
            create: tiposEquip.map(tipo => ({
              tipoEquipamento: tipo,
              operacional: Math.random() > 0.2,
              quantidade: 1,
              quantidadeQuebrada: 0
            }))
          }
        }
      });

      await prisma.checklistCarrinho.create({
        data: {
          semana: s, ano, regiao: g.regiao, unidade: g.unidade, criadoPorId: g.id,
          itens: {
            create: tiposCarrinho.map(tipo => ({
              tipoCarrinho: tipo,
              total: 10,
              quebrados: Math.floor(Math.random() * 2)
            }))
          }
        }
      });
    }
  }
  console.log('✅ Frotas e checklists de teste concluídos');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('  admin@manutencao.com      | Senha@123  (DEV / Administração)');
  console.log('  diretor@manutencao.com    | Senha@123  (Diretor - Global)');
  console.log('  gerente@manutencao.com    | Senha@123  (Gerente - Global)');
  console.log('  nathan@manutencao.com     | Senha@123  (Coordenador SP8)');
  console.log('  luciano@manutencao.com    | Senha@123  (Coordenador SP7)');
  console.log('  loja39@manutencao.com     | Senha@123  (Gestor Loja 39 - SP8)');
  console.log('  loja246@manutencao.com    | Senha@123  (Gestor Loja 246 - SP7)');
  console.log('  tecnico@manutencao.com    | Senha@123  (Técnico SP7)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

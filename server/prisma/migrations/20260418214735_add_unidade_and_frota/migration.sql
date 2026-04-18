-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'COORDENADOR', 'GESTOR', 'TECNICO');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SegmentoChamado" AS ENUM ('ELETRICA', 'EMPILHADEIRA', 'REFRIGERACAO', 'SERRALHERIA', 'CIVIL', 'EQUIPAMENTOS', 'GERADOR', 'ELEVADOR', 'PCI', 'ALUGUEL', 'DIVERSOS');

-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('CHAMADO_ABERTO', 'AGUARDANDO_APROVACAO', 'AGUARDANDO_OM_ENTREGA', 'FINALIZADO', 'ALUGUEL_OUTROS');

-- CreateEnum
CREATE TYPE "StatusMovimentacao" AS ENUM ('PENDENTE', 'ENVIADO', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEquipamento" AS ENUM ('EMPILHADEIRA_ELETRICA', 'EMPILHADEIRA_COMBUSTAO', 'EMPILHADEIRA_PATOLADA', 'MAQUINA_MOER_CARNE', 'SERRA_FITA', 'EMBALADORA_VACUO', 'FATIADORA', 'FATIADORA_GRANDE', 'ELEVADOR', 'ILHASELF', 'ESCADA_ROLANTE');

-- CreateEnum
CREATE TYPE "TipoCarrinho" AS ENUM ('MARIA_GORDA', 'SUPERCAR', 'DOIS_ANDARES', 'PRANCHA', 'PRANCHA_PERECIVEIS', 'CARRINHO_ABASTECIMENTO', 'ESCADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TECNICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "regiao" TEXT,
    "unidade" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "areResponsavel" TEXT NOT NULL,
    "regiao" TEXT,
    "unidade" TEXT,
    "dataConclusao" TIMESTAMP(3),
    "criadoPorId" TEXT NOT NULL,
    "atribuidoParaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "tarefaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controle_chamados" (
    "id" TEXT NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "numeroChamado" TEXT NOT NULL,
    "segmento" "SegmentoChamado" NOT NULL,
    "empresa" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "regiao" TEXT,
    "unidade" TEXT,
    "numeroOrcamento" TEXT,
    "valor" DECIMAL(12,2),
    "status" "StatusChamado" NOT NULL DEFAULT 'CHAMADO_ABERTO',
    "mauUso" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controle_chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "segmento" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pecas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "quantidadeEstoque" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas_pecas" (
    "id" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "numeroNotaFiscal" TEXT,
    "total" DECIMAL(12,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entradas_pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_pecas" (
    "id" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "dataMovimentacao" TIMESTAMP(3) NOT NULL,
    "lojaRequisitante" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "numeroChamado" TEXT,
    "status" "StatusMovimentacao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saidas_pecas" (
    "id" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "destino" TEXT NOT NULL,
    "nomeRetirou" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saidas_pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists_equipamento" (
    "id" TEXT NOT NULL,
    "semana" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "regiao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_equipamento_itens" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "tipoEquipamento" "TipoEquipamento" NOT NULL,
    "operacional" BOOLEAN NOT NULL DEFAULT true,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "quantidadeQuebrada" INTEGER NOT NULL DEFAULT 0,
    "numeroSerie" TEXT,
    "numeroChamado" TEXT,
    "descricaoProblema" TEXT,
    "valor" DECIMAL(12,2),

    CONSTRAINT "checklist_equipamento_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists_carrinho" (
    "id" TEXT NOT NULL,
    "semana" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "regiao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_carrinho_itens" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "tipoCarrinho" "TipoCarrinho" NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "quebrados" INTEGER NOT NULL DEFAULT 0,
    "numeroChamado" TEXT,
    "descricaoProblema" TEXT,

    CONSTRAINT "checklist_carrinho_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frota_carrinhos" (
    "id" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "tipoCarrinho" "TipoCarrinho" NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frota_carrinhos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_sessionId_key" ON "sessoes"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "checklists_equipamento_semana_ano_unidade_key" ON "checklists_equipamento"("semana", "ano", "unidade");

-- CreateIndex
CREATE UNIQUE INDEX "checklists_carrinho_semana_ano_unidade_key" ON "checklists_carrinho"("semana", "ano", "unidade");

-- CreateIndex
CREATE UNIQUE INDEX "frota_carrinhos_unidade_tipoCarrinho_key" ON "frota_carrinhos"("unidade", "tipoCarrinho");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_atribuidoParaId_fkey" FOREIGN KEY ("atribuidoParaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "tarefas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas_pecas" ADD CONSTRAINT "entradas_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_pecas" ADD CONSTRAINT "movimentacoes_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saidas_pecas" ADD CONSTRAINT "saidas_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_equipamento" ADD CONSTRAINT "checklists_equipamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_equipamento_itens" ADD CONSTRAINT "checklist_equipamento_itens_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists_equipamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_carrinho" ADD CONSTRAINT "checklists_carrinho_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_carrinho_itens" ADD CONSTRAINT "checklist_carrinho_itens_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists_carrinho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

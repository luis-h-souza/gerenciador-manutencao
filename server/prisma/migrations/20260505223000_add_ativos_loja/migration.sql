CREATE TABLE "ativos_loja" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "tipo" TEXT,
  "fabricante" TEXT,
  "modelo" TEXT,
  "numeroSerie" TEXT,
  "patrimonio" TEXT,
  "quantidade" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'ATIVO',
  "localizacao" TEXT,
  "observacoes" TEXT,
  "regiao" TEXT NOT NULL,
  "unidade" TEXT NOT NULL,
  "criadoPorId" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ativos_loja_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ativos_loja_regiao_idx" ON "ativos_loja"("regiao");
CREATE INDEX "ativos_loja_unidade_idx" ON "ativos_loja"("unidade");
CREATE INDEX "ativos_loja_categoria_idx" ON "ativos_loja"("categoria");
CREATE INDEX "ativos_loja_status_idx" ON "ativos_loja"("status");

ALTER TABLE "ativos_loja" ADD CONSTRAINT "ativos_loja_criadoPorId_fkey"
  FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

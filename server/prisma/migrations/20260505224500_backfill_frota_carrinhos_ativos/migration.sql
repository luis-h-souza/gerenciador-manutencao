DO $$
DECLARE
  has_lojas boolean;
  has_usuario_loja_id boolean;
  has_usuario_unidade boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lojas'
  ) INTO has_lojas;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'lojaId'
  ) INTO has_usuario_loja_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'unidade'
  ) INTO has_usuario_unidade;

  IF has_lojas AND has_usuario_loja_id THEN
    EXECUTE $sql$
      INSERT INTO "ativos_loja" (
        "id", "nome", "categoria", "tipo", "quantidade", "status",
        "regiao", "unidade", "criadoPorId", "ativo", "criadoEm", "atualizadoEm"
      )
      SELECT
        'frota-carrinho-' || f."unidade" || '-' || f."tipoCarrinho"::text,
        'Carrinho - ' ||
          CASE f."tipoCarrinho"::text
            WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
            WHEN 'SUPERCAR' THEN 'Supercar'
            WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
            WHEN 'PRANCHA' THEN 'Prancha'
            WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
            WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
            WHEN 'ESCADA' THEN 'Escada'
            ELSE f."tipoCarrinho"::text
          END,
        'Carrinhos',
        CASE f."tipoCarrinho"::text
          WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
          WHEN 'SUPERCAR' THEN 'Supercar'
          WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
          WHEN 'PRANCHA' THEN 'Prancha'
          WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
          WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
          WHEN 'ESCADA' THEN 'Escada'
          ELSE f."tipoCarrinho"::text
        END,
        f."total",
        'ATIVO',
        l."regiao",
        f."unidade",
        u."id",
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "frota_carrinhos" f
      JOIN "lojas" l ON l."nome" = f."unidade"
      JOIN LATERAL (
        SELECT "id"
        FROM (
          SELECT "id", 0 AS ordem, "criadoEm"
          FROM "usuarios"
          WHERE "lojaId" = l."id" AND "ativo" = true
          UNION ALL
          SELECT "id", 1 AS ordem, "criadoEm"
          FROM "usuarios"
          WHERE "ativo" = true
        ) candidatos
        ORDER BY ordem, "criadoEm" ASC
        LIMIT 1
      ) u ON true
      WHERE f."total" > 0
        AND NOT EXISTS (
          SELECT 1
          FROM "ativos_loja" a
          WHERE a."unidade" = f."unidade"
            AND a."categoria" = 'Carrinhos'
            AND a."tipo" =
              CASE f."tipoCarrinho"::text
                WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
                WHEN 'SUPERCAR' THEN 'Supercar'
                WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
                WHEN 'PRANCHA' THEN 'Prancha'
                WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
                WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
                WHEN 'ESCADA' THEN 'Escada'
                ELSE f."tipoCarrinho"::text
              END
        );
    $sql$;
  ELSIF has_usuario_unidade THEN
    EXECUTE $sql$
      INSERT INTO "ativos_loja" (
        "id", "nome", "categoria", "tipo", "quantidade", "status",
        "regiao", "unidade", "criadoPorId", "ativo", "criadoEm", "atualizadoEm"
      )
      SELECT
        'frota-carrinho-' || f."unidade" || '-' || f."tipoCarrinho"::text,
        'Carrinho - ' ||
          CASE f."tipoCarrinho"::text
            WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
            WHEN 'SUPERCAR' THEN 'Supercar'
            WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
            WHEN 'PRANCHA' THEN 'Prancha'
            WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
            WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
            WHEN 'ESCADA' THEN 'Escada'
            ELSE f."tipoCarrinho"::text
          END,
        'Carrinhos',
        CASE f."tipoCarrinho"::text
          WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
          WHEN 'SUPERCAR' THEN 'Supercar'
          WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
          WHEN 'PRANCHA' THEN 'Prancha'
          WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
          WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
          WHEN 'ESCADA' THEN 'Escada'
          ELSE f."tipoCarrinho"::text
        END,
        f."total",
        'ATIVO',
        COALESCE(u."regiao", 'SEM_REGIAO'),
        f."unidade",
        u."id",
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "frota_carrinhos" f
      JOIN LATERAL (
        SELECT "id", "regiao"
        FROM (
          SELECT "id", "regiao", 0 AS ordem, "criadoEm"
          FROM "usuarios"
          WHERE "unidade" = f."unidade" AND "ativo" = true
          UNION ALL
          SELECT "id", "regiao", 1 AS ordem, "criadoEm"
          FROM "usuarios"
          WHERE "ativo" = true
        ) candidatos
        ORDER BY ordem, "criadoEm" ASC
        LIMIT 1
      ) u ON true
      WHERE f."total" > 0
        AND NOT EXISTS (
          SELECT 1
          FROM "ativos_loja" a
          WHERE a."unidade" = f."unidade"
            AND a."categoria" = 'Carrinhos'
            AND a."tipo" =
              CASE f."tipoCarrinho"::text
                WHEN 'MARIA_GORDA' THEN 'Maria Gorda'
                WHEN 'SUPERCAR' THEN 'Supercar'
                WHEN 'DOIS_ANDARES' THEN 'Dois Andares'
                WHEN 'PRANCHA' THEN 'Prancha'
                WHEN 'PRANCHA_PERECIVEIS' THEN 'Prancha Perecíveis'
                WHEN 'CARRINHO_ABASTECIMENTO' THEN 'Carrinho de Abastecimento'
                WHEN 'ESCADA' THEN 'Escada'
                ELSE f."tipoCarrinho"::text
              END
        );
    $sql$;
  END IF;
END $$;

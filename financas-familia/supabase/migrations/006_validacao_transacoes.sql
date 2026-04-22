-- =============================================================
-- Migration 006 — Validação obrigatória: categoria e centro de custo
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

-- Função de validação chamada antes de INSERT ou UPDATE em transacoes
CREATE OR REPLACE FUNCTION validar_transacao()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Categoria obrigatória para despesas
  IF NEW.tipo = 'despesa' AND NEW.categoria_id IS NULL THEN
    RAISE EXCEPTION 'categoria_id é obrigatório para despesas';
  END IF;

  -- Centro de custo obrigatório apenas se a família possui ao menos um centro ativo
  IF NEW.tipo = 'despesa' AND NEW.centro_custo_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM centros_custo
      WHERE familia_id = NEW.familia_id AND ativo = true
      LIMIT 1
    ) THEN
      RAISE EXCEPTION 'centro_custo_id é obrigatório quando a família possui centros de custo ativos';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger que dispara a validação em todo INSERT e UPDATE
DROP TRIGGER IF EXISTS trg_validar_transacao ON transacoes;
CREATE TRIGGER trg_validar_transacao
  BEFORE INSERT OR UPDATE ON transacoes
  FOR EACH ROW EXECUTE FUNCTION validar_transacao();

-- Ciclo de cobrança do cartão de crédito
ALTER TABLE cartoes_credito
  ADD COLUMN IF NOT EXISTS dia_fechamento int CHECK (dia_fechamento BETWEEN 1 AND 28),
  ADD COLUMN IF NOT EXISTS dia_vencimento int CHECK (dia_vencimento BETWEEN 1 AND 31);

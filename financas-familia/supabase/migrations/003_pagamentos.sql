-- Novos campos de controle de pagamento em transacoes
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'pago'
    CHECK (status_pagamento IN ('pago', 'pendente')),
  ADD COLUMN IF NOT EXISTS data_pagamento date,
  ADD COLUMN IF NOT EXISTS mes_fatura date; -- primeiro dia do mês da fatura (para cartões)

-- Índice para facilitar consultas de pendentes por vencimento
CREATE INDEX IF NOT EXISTS idx_transacoes_vencimento
  ON transacoes (familia_id, data_vencimento, status_pagamento)
  WHERE data_vencimento IS NOT NULL;

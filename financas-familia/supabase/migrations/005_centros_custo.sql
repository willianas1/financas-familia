CREATE TABLE centros_custo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid REFERENCES familias(id) NOT NULL,
  nome       text NOT NULL,
  cor        text DEFAULT '#6366f1',
  ativo      boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_select" ON centros_custo FOR SELECT USING (familia_id = minha_familia_id());
CREATE POLICY "cc_insert" ON centros_custo FOR INSERT WITH CHECK (familia_id = minha_familia_id());
CREATE POLICY "cc_update" ON centros_custo FOR UPDATE USING (familia_id = minha_familia_id());
CREATE POLICY "cc_delete" ON centros_custo FOR DELETE USING (familia_id = minha_familia_id());

ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES centros_custo(id);

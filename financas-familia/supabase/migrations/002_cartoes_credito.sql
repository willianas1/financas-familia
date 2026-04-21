-- Tabela de cartões de crédito
create table cartoes_credito (
  id              uuid primary key default gen_random_uuid(),
  familia_id      uuid references familias(id) not null,
  nome            text not null,
  bandeira        text,
  ultimos_digitos text,
  cor             text default '#6366f1',
  ativo           boolean default true,
  created_at      timestamptz default now()
);

alter table cartoes_credito enable row level security;
create policy "cartoes_select" on cartoes_credito for select using (familia_id = minha_familia_id());
create policy "cartoes_insert" on cartoes_credito for insert with check (familia_id = minha_familia_id());
create policy "cartoes_update" on cartoes_credito for update using (familia_id = minha_familia_id());
create policy "cartoes_delete" on cartoes_credito for delete using (familia_id = minha_familia_id());

-- Vincular transações a cartões
alter table transacoes add column cartao_id uuid references cartoes_credito(id);

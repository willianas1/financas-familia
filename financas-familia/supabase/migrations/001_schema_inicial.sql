-- =============================================================
-- CONTROLE FINANCEIRO FAMILIAR — Schema Inicial
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

-- ---------------------------------------------------------------
-- FAMILIAS
-- ---------------------------------------------------------------
create table if not exists familias (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  codigo_convite  text unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------
-- PROFILES (estende auth.users com dados adicionais)
-- ---------------------------------------------------------------
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  nome        text,
  avatar_url  text,
  familia_id  uuid references familias(id) on delete set null,
  created_at  timestamptz default now()
);

-- Cria profile automaticamente quando um usuário se registra
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, nome, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------
-- CATEGORIAS
-- ---------------------------------------------------------------
create table if not exists categorias (
  id          uuid primary key default gen_random_uuid(),
  familia_id  uuid references familias(id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('receita', 'despesa')),
  icone       text,
  cor         text default '#6366f1',
  padrao      boolean default false,
  ativa       boolean default true,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------
-- PARCELAMENTOS
-- ---------------------------------------------------------------
create table if not exists parcelamentos (
  id              uuid primary key default gen_random_uuid(),
  familia_id      uuid references familias(id) on delete cascade,
  descricao       text not null,
  valor_total     numeric(10,2),
  num_parcelas    int not null,
  valor_parcela   numeric(10,2) not null,
  data_inicio     date not null,
  tipo_calculo    text check (tipo_calculo in ('total', 'parcela_manual')),
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------
-- TRANSACOES
-- ---------------------------------------------------------------
create table if not exists transacoes (
  id                uuid primary key default gen_random_uuid(),
  familia_id        uuid references familias(id) on delete cascade,
  membro_id         uuid references auth.users(id) on delete set null,
  tipo              text not null check (tipo in ('receita', 'despesa')),
  valor             numeric(10,2) not null,
  data              date not null,
  descricao         text,
  categoria_id      uuid references categorias(id) on delete set null,
  parcelamento_id   uuid references parcelamentos(id) on delete cascade,
  num_parcela       int,
  created_at        timestamptz default now()
);

-- ---------------------------------------------------------------
-- ORCAMENTOS (limite mensal por categoria)
-- ---------------------------------------------------------------
create table if not exists orcamentos (
  id              uuid primary key default gen_random_uuid(),
  familia_id      uuid references familias(id) on delete cascade,
  categoria_id    uuid references categorias(id) on delete cascade,
  valor_limite    numeric(10,2) not null,
  mes             int not null check (mes between 1 and 12),
  ano             int not null,
  created_at      timestamptz default now(),
  unique(familia_id, categoria_id, mes, ano)
);

-- ---------------------------------------------------------------
-- NOTIFICACOES in-app
-- ---------------------------------------------------------------
create table if not exists notificacoes (
  id          uuid primary key default gen_random_uuid(),
  familia_id  uuid references familias(id) on delete cascade,
  tipo        text not null,
  mensagem    text not null,
  lida        boolean default false,
  created_at  timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

alter table familias      enable row level security;
alter table profiles      enable row level security;
alter table categorias    enable row level security;
alter table parcelamentos enable row level security;
alter table transacoes    enable row level security;
alter table orcamentos    enable row level security;
alter table notificacoes  enable row level security;

-- Helper: retorna o familia_id do usuário autenticado
create or replace function minha_familia_id()
returns uuid language sql security definer stable as $$
  select familia_id from profiles where id = auth.uid();
$$;

-- FAMILIAS: usuário vê/edita somente sua família
create policy "familia_select" on familias for select using (id = minha_familia_id());
create policy "familia_update" on familias for update using (id = minha_familia_id());

-- PROFILES: usuário vê perfis da mesma família
create policy "profiles_select" on profiles for select using (familia_id = minha_familia_id() or id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- CATEGORIAS
create policy "categorias_select" on categorias for select using (familia_id = minha_familia_id());
create policy "categorias_insert" on categorias for insert with check (familia_id = minha_familia_id());
create policy "categorias_update" on categorias for update using (familia_id = minha_familia_id());
create policy "categorias_delete" on categorias for delete using (familia_id = minha_familia_id());

-- PARCELAMENTOS
create policy "parcelamentos_select" on parcelamentos for select using (familia_id = minha_familia_id());
create policy "parcelamentos_insert" on parcelamentos for insert with check (familia_id = minha_familia_id());
create policy "parcelamentos_update" on parcelamentos for update using (familia_id = minha_familia_id());
create policy "parcelamentos_delete" on parcelamentos for delete using (familia_id = minha_familia_id());

-- TRANSACOES
create policy "transacoes_select" on transacoes for select using (familia_id = minha_familia_id());
create policy "transacoes_insert" on transacoes for insert with check (familia_id = minha_familia_id());
create policy "transacoes_update" on transacoes for update using (familia_id = minha_familia_id());
create policy "transacoes_delete" on transacoes for delete using (familia_id = minha_familia_id());

-- ORCAMENTOS
create policy "orcamentos_select" on orcamentos for select using (familia_id = minha_familia_id());
create policy "orcamentos_insert" on orcamentos for insert with check (familia_id = minha_familia_id());
create policy "orcamentos_update" on orcamentos for update using (familia_id = minha_familia_id());
create policy "orcamentos_delete" on orcamentos for delete using (familia_id = minha_familia_id());

-- NOTIFICACOES
create policy "notificacoes_select" on notificacoes for select using (familia_id = minha_familia_id());
create policy "notificacoes_update" on notificacoes for update using (familia_id = minha_familia_id());
create policy "notificacoes_delete" on notificacoes for delete using (familia_id = minha_familia_id());

-- =============================================================
-- CATEGORIAS PADRÃO (inseridas pela aplicação via função)
-- Esta função é chamada pelo app no onboarding
-- =============================================================
create or replace function seed_categorias_padrao(p_familia_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into categorias (familia_id, nome, tipo, icone, cor, padrao) values
    -- Receitas
    (p_familia_id, 'Salário',               'receita', 'briefcase',     '#22c55e', true),
    (p_familia_id, 'Rendimento de Aplicação','receita', 'trending-up',   '#10b981', true),
    (p_familia_id, 'Trabalho Extra',         'receita', 'star',          '#34d399', true),
    (p_familia_id, 'Outros',                 'receita', 'plus-circle',   '#6ee7b7', true),
    -- Despesas
    (p_familia_id, 'Alimentação',    'despesa', 'shopping-cart', '#ef4444', true),
    (p_familia_id, 'Contas',         'despesa', 'zap',           '#f97316', true),
    (p_familia_id, 'Escola',         'despesa', 'book-open',     '#eab308', true),
    (p_familia_id, 'Lazer',          'despesa', 'smile',         '#8b5cf6', true),
    (p_familia_id, 'Saúde',          'despesa', 'heart',         '#ec4899', true),
    (p_familia_id, 'Transporte',     'despesa', 'car',           '#06b6d4', true),
    (p_familia_id, 'Vestuário',      'despesa', 'shirt',         '#a78bfa', true),
    (p_familia_id, 'Assinaturas',    'despesa', 'credit-card',   '#64748b', true),
    (p_familia_id, 'Outros',         'despesa', 'more-horizontal','#9ca3af', true);
end;
$$;

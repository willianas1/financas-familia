-- =============================================================
-- Migration 007 — Alterar FK membro_id: auth.users → profiles
-- Necessário para o PostgREST conseguir fazer join com profiles
-- (profiles.id = auth.users.id — os dados são os mesmos)
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

ALTER TABLE transacoes
  DROP CONSTRAINT IF EXISTS transacoes_membro_id_fkey;

ALTER TABLE transacoes
  ADD CONSTRAINT transacoes_membro_id_fkey
  FOREIGN KEY (membro_id) REFERENCES profiles(id) ON DELETE SET NULL;

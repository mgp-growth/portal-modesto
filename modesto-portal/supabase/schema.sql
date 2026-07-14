-- =====================================================================
-- Modesto Growth — Portal | Schema + Row Level Security
-- Cole isto no Supabase: Dashboard -> SQL Editor -> New query -> Run
-- Idempotente o suficiente para rodar em um projeto novo.
-- =====================================================================

-- ---------- Extensões ----------
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------- Tipos ----------
do $$ begin
  create type public.user_role as enum ('admin', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum ('apresentacao', 'concorrencia', 'proposta');
exception when duplicate_object then null; end $$;

-- ---------- Tabelas ----------

-- Cada cliente da agência (uma "pasta")
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text unique,
  created_at  timestamptz not null default now()
);

-- Liga o usuário do Auth a um papel e (se client) ao seu client_id
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'client',
  client_id   uuid references public.clients(id) on delete set null,
  full_name   text,
  created_at  timestamptz not null default now(),
  -- Um client PRECISA ter client_id; admin não precisa.
  constraint client_needs_client_id check (role = 'admin' or client_id is not null)
);

-- Entregas / documentos. metadata alimenta o dashboard.
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  titulo       text not null,
  tipo         public.document_type not null,
  storage_path text not null,
  metadata     jsonb not null default '{}'::jsonb,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_tipo_idx       on public.documents (tipo);

-- =====================================================================
-- Funções auxiliares (SECURITY DEFINER evita recursão nas policies de
-- profiles: rodam como owner e não reaplicam RLS em profiles).
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.clients   enable row level security;
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ( id = auth.uid() or public.is_admin() );

drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ---------- clients ----------
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select using ( public.is_admin() or id = public.current_client_id() );

drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ---------- documents ----------
-- CORAÇÃO DO PROJETO: um usuário só enxerga docs do próprio client_id;
-- admin vê tudo. Vale para listar E para gerar o link do arquivo.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select using (
    public.is_admin() or client_id = public.current_client_id()
  );

drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- =====================================================================
-- STORAGE: bucket privado 'documents'
-- Convenção de caminho: {client_id}/{document_id}.html
-- A pasta raiz do objeto = client_id, e é isso que a policy checa.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Admin: acesso total aos objetos do bucket
drop policy if exists storage_documents_admin on storage.objects;
create policy storage_documents_admin on storage.objects
  for all
  using ( bucket_id = 'documents' and public.is_admin() )
  with check ( bucket_id = 'documents' and public.is_admin() );

-- Client: só lê objetos cuja primeira pasta = seu client_id
drop policy if exists storage_documents_client_read on storage.objects;
create policy storage_documents_client_read on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_client_id()::text
  );

-- =====================================================================
-- SEED — primeiro admin (rode DEPOIS de criar o usuário no Auth)
-- 1) Authentication -> Users -> Add user (email + senha)
-- 2) Copie o UUID do usuário e rode:
--
-- insert into public.profiles (id, role, full_name)
-- values ('COLE-O-UUID-AQUI', 'admin', 'Seu Nome')
-- on conflict (id) do update set role = 'admin';
-- =====================================================================

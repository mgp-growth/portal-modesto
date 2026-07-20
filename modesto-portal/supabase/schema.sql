-- =====================================================================
-- Modesto Growth — Portal de Clientes
-- Schema + RLS (Row Level Security) para Supabase / Postgres
-- Cole tudo isto no SQL Editor do Supabase e rode uma vez.
-- É idempotente: pode rodar de novo sem quebrar.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Tipos ----------
do $$ begin
  create type public.user_role as enum ('admin', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum ('apresentacao', 'concorrencia', 'proposta');
exception when duplicate_object then null; end $$;

-- ---------- Tabelas ----------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  created_at timestamptz not null default now()
);

-- profiles liga o usuário do Auth a um papel (admin/client) e, se client, ao client_id.
-- Vários profiles podem apontar pro mesmo client_id => já cobre "várias pessoas por cliente"
-- (por isso a tabela client_users do pedido é opcional e não foi criada).
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       public.user_role not null default 'client',
  client_id  uuid references public.clients(id) on delete set null,
  nome       text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  titulo       text not null,
  tipo         public.document_type not null,
  storage_path text not null,
  metadata     jsonb not null default '{}'::jsonb,  -- números/análises que alimentam o dashboard
  created_at   timestamptz not null default now()
);

create index if not exists documents_client_id_idx on public.documents(client_id);
create index if not exists profiles_client_id_idx  on public.profiles(client_id);

-- ---------- Funções auxiliares ----------
-- SECURITY DEFINER: leem profiles sem passar pela RLS, evitando recursão nas policies.
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_client_id()
returns uuid language sql security definer set search_path = public stable as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- ---------- Trigger: cria profile ao criar usuário no Auth ----------
-- Lê role/client_id/nome do user_metadata (o admin passa isso ao criar o usuário).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, client_id, nome)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'),
    (new.raw_user_meta_data->>'client_id')::uuid,
    new.raw_user_meta_data->>'nome'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Habilitar RLS ----------
alter table public.clients   enable row level security;
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

-- ---------- Policies: clients ----------
drop policy if exists clients_select       on public.clients;
drop policy if exists clients_admin_insert on public.clients;
drop policy if exists clients_admin_update on public.clients;
drop policy if exists clients_admin_delete on public.clients;

create policy clients_select on public.clients for select
  using (public.is_admin() or id = public.current_client_id());
create policy clients_admin_insert on public.clients for insert
  with check (public.is_admin());
create policy clients_admin_update on public.clients for update
  using (public.is_admin()) with check (public.is_admin());
create policy clients_admin_delete on public.clients for delete
  using (public.is_admin());

-- ---------- Policies: profiles ----------
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_admin_insert on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_admin_delete on public.profiles;

create policy profiles_select_own on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_insert on public.profiles for insert
  with check (public.is_admin());
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy profiles_admin_delete on public.profiles for delete
  using (public.is_admin());

-- ---------- Policies: documents (o coração) ----------
-- Um usuário só enxerga documents do próprio client_id. Admin vê tudo.
drop policy if exists documents_select       on public.documents;
drop policy if exists documents_admin_insert on public.documents;
drop policy if exists documents_admin_update on public.documents;
drop policy if exists documents_admin_delete on public.documents;

create policy documents_select on public.documents for select
  using (public.is_admin() or client_id = public.current_client_id());
create policy documents_admin_insert on public.documents for insert
  with check (public.is_admin());
create policy documents_admin_update on public.documents for update
  using (public.is_admin()) with check (public.is_admin());
create policy documents_admin_delete on public.documents for delete
  using (public.is_admin());

-- ---------- Storage: bucket privado + policies ----------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Caminho dos arquivos: {client_id}/{uuid}.html
-- A primeira "pasta" do path é o client_id => a policy compara com o client do usuário.
drop policy if exists storage_documents_select       on storage.objects;
drop policy if exists storage_documents_admin_insert on storage.objects;
drop policy if exists storage_documents_admin_update on storage.objects;
drop policy if exists storage_documents_admin_delete on storage.objects;

create policy storage_documents_select on storage.objects for select
  using (
    bucket_id = 'documents' and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_client_id()::text
    )
  );
create policy storage_documents_admin_insert on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin());
create policy storage_documents_admin_update on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin());
create policy storage_documents_admin_delete on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());

-- =====================================================================
-- PRIMEIRO ADMIN
-- Depois de criar sua conta (pelo painel Auth do Supabase ou pelo /login
-- do portal), rode UMA VEZ trocando o email para te promover a admin:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'voce@modestogrowth.com.br');
-- =====================================================================

-- =====================================================================
-- Modesto — verificação do schema real (rode no Supabase → SQL Editor)
-- =====================================================================
-- O schema.sql do Portal cobre: clients, profiles, documents,
-- client_accounts + helpers is_admin()/current_client_id().
-- As tabelas tasks e task_notes foram criadas à parte para o Modesto
-- Tasks. Rode as queries abaixo para CONFIRMAR os nomes exatos das
-- colunas — é isso que garante que o supabase-data.js mapeia certo.
-- Nada aqui altera dados; são só consultas de leitura.

-- 1) Colunas de tasks (nome + tipo)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'tasks'
order by ordinal_position;

-- 2) Colunas de task_notes
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'task_notes'
order by ordinal_position;

-- 3) Colunas de clients e profiles (para o cadastro de cliente/pessoa)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name in ('clients','profiles')
order by table_name, ordinal_position;

-- 4) Quantos registros existem hoje (só contagem)
select 'clients' as tabela, count(*) from public.clients
union all select 'profiles', count(*) from public.profiles
union all select 'tasks', count(*) from public.tasks
union all select 'task_notes', count(*) from public.task_notes;

-- 5) Valores DISTINTOS de status e prioridade que existem de fato nas tasks
--    (confirma se são 'Em Andamento'/'Concluído Atendimento' etc.)
select status, count(*) from public.tasks group by status order by 2 desc;
select prioridade, count(*) from public.tasks group by prioridade order by 2 desc;


-- =====================================================================
-- Referência: formato esperado pelo código atual do Modesto Tasks
-- (NÃO execute como está sem conferir com as queries acima; serve de mapa)
-- =====================================================================
-- create table public.tasks (
--   id           uuid primary key default gen_random_uuid(),
--   client_id    uuid references public.clients(id) on delete set null,
--   title        text not null,
--   description  text,
--   status       text not null default 'Não iniciado',
--   prioridade   text default 'Média',           -- Alta | Média | Baixa
--   assignees    text[] not null default '{}',   -- nomes dos responsáveis
--   subtasks     jsonb  not null default '[]',    -- [{ "t": "...", "done": false }]
--   prazo        date,
--   recorrencia  text default 'Nenhuma',
--   time_spent   integer not null default 0,      -- segundos acumulados
--   timer_start  timestamptz,                     -- != null enquanto roda
--   timer_by     uuid,                            -- quem iniciou o cronômetro
--   position     integer not null default 0,      -- ordem no drag-and-drop
--   created_at   timestamptz not null default now()
-- );
--
-- create table public.task_notes (
--   id          uuid primary key default gen_random_uuid(),
--   task_id     uuid not null references public.tasks(id) on delete cascade,
--   author_id   uuid references public.profiles(id),
--   author_name text,
--   body        text not null,
--   visibility  text not null default 'public',   -- public | internal
--   created_at  timestamptz not null default now()
-- );

-- =====================================================================
-- Correção da FOTO de perfil (Fase 3) — só rode quando formos tratar disso
-- =====================================================================
-- As colunas abaixo são chamadas pelo front mas podem não existir ainda.
-- alter table public.profiles add column if not exists avatar_url text;
-- alter table public.clients  add column if not exists logo_url  text;
-- alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
--
-- Permitir que a pessoa edite o PRÓPRIO perfil (nome/foto) sem poder
-- trocar o próprio papel nem o client_id:
-- create policy profiles_update_own on public.profiles
--   for update using ( id = auth.uid() )
--   with check ( id = auth.uid() and role = (select role from public.profiles where id = auth.uid())
--                and client_id is not distinct from (select client_id from public.profiles where id = auth.uid()) );

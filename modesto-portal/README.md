# Portal — Modesto Growth

Repositório central de entregas + painel de gestão. Cada cliente entra e vê
somente a pasta dele; a equipe (admin) gerencia tudo. Segurança no banco (RLS).

Stack: Next.js (App Router) · Supabase (Auth + Postgres + Storage) · Vercel.

---

## 1. Pré-requisitos
- Node.js 20+
- Uma conta no Supabase (plano free serve pro MVP)
- Uma conta na Vercel (plano free serve pro MVP)

## 2. Instalar
```bash
npm install
```

## 3. Criar o projeto no Supabase
1. Crie um projeto novo em supabase.com.
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de
   `supabase/schema.sql` e rode. Isso cria tabelas, RLS, o bucket privado
   `documents` e as políticas de storage.
3. Crie o primeiro admin:
   - **Authentication → Users → Add user** (e-mail + senha).
   - Copie o UUID do usuário criado e rode no SQL Editor:
     ```sql
     insert into public.profiles (id, role, full_name)
     values ('COLE-O-UUID', 'admin', 'Seu Nome')
     on conflict (id) do update set role = 'admin';
     ```

## 4. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha
(**Project Settings → API**):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # SÓ no servidor. Nunca com prefixo NEXT_PUBLIC.
```

## 5. Rodar local
```bash
npm run dev
```
Acesse http://localhost:3000 e entre com o usuário admin.

## 6. Fluxo de uso
- **Admin** (`/admin`): cria cliente, cria acesso (e-mail+senha) para a pessoa
  do cliente, sobe o HTML e associa à pasta. Dashboard lê `documents.metadata`.
- **Cliente** (`/portal`): loga e vê só as entregas dele. "Abrir" passa pela
  rota `/api/documents/[id]/view`, que confere a sessão + RLS e só então gera
  um signed URL temporário (5 min) no domínio do Storage.

## 7. Deploy na Vercel
1. Suba o repositório no GitHub e importe na Vercel.
2. Em **Settings → Environment Variables**, adicione as 3 variáveis do passo 4.
3. Deploy.

## 8. Domínio (portal.modestogrowth.com.br)
1. Vercel → **Settings → Domains** → adicionar `portal.modestogrowth.com.br`.
2. A Vercel mostra um valor CNAME (algo como `cname.vercel-dns.com`).
3. Na Locaweb (**Consulte e altere zona de DNS**), adicione:
   - Tipo `CNAME` · Host `portal` · Destino = valor da Vercel · TTL automático.
   - **Não** mexa nos nameservers da Locaweb nem no site principal.
4. Propaga em 1–3h. SSL a Vercel emite sozinha.

## 9. Fase 2 — VTEX (depois)
Rota no backend usando `appKey`/`appToken` guardados como env vars no servidor
(nunca no navegador). Chamar Master Data/CRM server-side e mesclar no dashboard.

---

## Notas de segurança
- A regra de acesso vive na RLS (`documents_select`): cliente só vê docs do
  próprio `client_id`; admin vê tudo. Vale para listar E para gerar o link.
- Bucket `documents` é privado; nada é público. Links são signed URLs curtos.
- `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS — usado só em server actions, e só
  depois de confirmar que quem chama é admin.

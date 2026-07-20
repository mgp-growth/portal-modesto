# Portal Modesto Growth

Portal web com login onde a equipe organiza entregas por cliente, e cada cliente
vê **somente a pasta dele**. Repositório central de entregas + painel de gestão.

- **Stack:** Next.js (App Router) + Supabase (Auth, Postgres, Storage) + Vercel
- **Acesso:** `admin` (equipe) vê e gerencia tudo · `client` acessa só seus docs
- **Segurança:** Row Level Security (RLS) no banco — a regra vive no Postgres,
  não no front. Arquivos ficam em bucket **privado**; o acesso passa por
  signed URL temporário gerado só depois de checar a sessão.

---

## 1. Supabase

1. Crie um projeto em https://supabase.com (plano free serve pro MVP).
2. Em **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e rode.
   Isso cria tabelas, funções, RLS, o trigger de profile e o bucket `documents`.
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secreta, só no servidor)

### Criar o primeiro admin
Crie sua conta (pelo painel **Authentication → Users → Add user**, ou pelo
`/login` do portal depois de rodar local) e então, no SQL Editor, rode uma vez:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'voce@modestogrowth.com.br');
```

---

## 2. Rodar local

```bash
cp .env.example .env.local   # e preencha as 3 variáveis
npm install
npm run dev                  # http://localhost:3000
```

Fluxo: você entra como admin → cria um **cliente** → cria um **usuário** pra esse
cliente → sobe um **HTML** e associa ao cliente. O cliente loga e vê só o que é dele.

---

## 3. Deploy na Vercel

1. Suba este repositório no GitHub da empresa (comandos abaixo).
2. Em https://vercel.com → **Add New → Project** → importe o repo.
3. Em **Environment Variables**, adicione as 3 variáveis do `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`).
4. **Deploy.**

### Subir pro GitHub

```bash
git init
git add .
git commit -m "MVP portal Modesto Growth"
git branch -M main
git remote add origin git@github.com:SUA-ORG/modesto-portal.git
git push -u origin main
```

---

## 4. Domínio (portal.modestogrowth.com.br)

O DNS fica na Locaweb (nameservers da Locaweb continuam ativos — **não mexer neles**).

1. Na Vercel: **Settings → Domains → Add** → `portal.modestogrowth.com.br`.
2. A Vercel vai exibir um registro **CNAME** de destino (algo como
   `cname.vercel-dns.com`). **Esse valor é gerado pela Vercel neste passo.**
3. Na Locaweb (**Registro de Domínio → Administrar → Consulte e altere zona de DNS**):
   - Tipo: `CNAME`
   - Host: `portal`
   - Destino: o valor que a Vercel mostrou
   - TTL: automático
4. Propaga em ~1 a 3 horas. O SSL (https) a Vercel emite sozinha.

O site principal (`modestogrowth.com.br`) continua intocado — só adiciona o
subdomínio `portal`.

---

## Modelo de dados

- `clients` — cada cliente da agência.
- `profiles` — liga o usuário do Auth a um papel (`admin`/`client`) e, se client,
  ao `client_id`. Vários profiles podem apontar pro mesmo `client_id`, então
  **várias pessoas por cliente** já funciona sem tabela extra.
- `documents` — `client_id`, `titulo`, `tipo` (`apresentacao`/`concorrencia`/
  `proposta`), `storage_path`, `metadata` (JSON com os números do dashboard),
  `created_at`.

## Como o acesso é travado (RLS)

`documents_select`: um usuário só enxerga linhas cujo `client_id` é o dele —
exceto admin, que vê tudo. Vale pra listar **e** pra gerar o link do arquivo
(a policy de `storage.objects` compara a primeira pasta do path, que é o
`client_id`, com o cliente do usuário). Mesmo mexendo no navegador, não dá pra
ver dado de outro cliente.

## Fase 2 — VTEX

Integração com Master Data/CRM da VTEX fica pra fase 2: uma rota no backend
usando `appKey`/`appToken` da conta VTEX. Essas credenciais ficam **no servidor**
(variáveis de ambiente), nunca no navegador. Não está incluída neste MVP.

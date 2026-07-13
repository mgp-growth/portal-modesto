import { createClient } from "@/lib/supabase/server";
import { createClientAction, createClientUserAction } from "../actions";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, nome, slug, created_at")
    .order("created_at", { ascending: false });

  const list = clients ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Novo cliente */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-medium">Novo cliente (pasta)</h2>
          <form action={createClientAction} className="mt-4 space-y-3">
            <input
              name="nome"
              placeholder="Nome do cliente"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Criar cliente
            </button>
          </form>
        </section>

        {/* Novo usuário de cliente */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-medium">Dar acesso a uma pessoa</h2>
          <form action={createClientUserAction} className="mt-4 space-y-3">
            <select
              name="client_id"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione o cliente…</option>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <input
              name="full_name"
              placeholder="Nome da pessoa (opcional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail de acesso"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="text"
              placeholder="Senha inicial"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Criar acesso
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-medium">Todos os clientes</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {list.map((c) => (
            <li key={c.id} className="px-5 py-3 text-sm">
              {c.nome}
              <span className="ml-2 text-xs text-gray-400">{c.slug}</span>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-5 py-6 text-sm text-gray-500">
              Nenhum cliente cadastrado.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { uploadDocumentAction } from "../actions";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: docs }] = await Promise.all([
    supabase.from("clients").select("id, nome").order("nome"),
    supabase
      .from("documents")
      .select("id, titulo, tipo, client_id, created_at, clients(nome)")
      .order("created_at", { ascending: false }),
  ]);

  const list = docs ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Entregas</h1>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-medium">Subir HTML e associar à pasta</h2>
        <form action={uploadDocumentAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            name="client_id"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Cliente…</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            name="tipo"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tipo…</option>
            <option value="apresentacao">Apresentação</option>
            <option value="concorrencia">Concorrência</option>
            <option value="proposta">Proposta</option>
          </select>

          <input
            name="titulo"
            placeholder="Título da entrega"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />

          <input
            name="file"
            type="file"
            accept=".html,text/html"
            required
            className="text-sm md:col-span-2"
          />

          <button className="justify-self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 md:col-span-2">
            Subir entrega
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-medium">Todas as entregas</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {list.map((d) => {
            const cliente = Array.isArray(d.clients)
              ? d.clients[0]?.nome
              : (d.clients as { nome?: string } | null)?.nome;
            return (
              <li
                key={d.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span>
                  {d.titulo}
                  <span className="ml-2 text-xs text-gray-400">{cliente}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {d.tipo}
                  </span>
                  <a
                    href={`/api/documents/${d.id}/view`}
                    target="_blank"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    abrir
                  </a>
                </div>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="px-5 py-6 text-sm text-gray-500">
              Nenhuma entrega ainda.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

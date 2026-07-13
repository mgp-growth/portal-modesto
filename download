import { createClient } from "@/lib/supabase/server";

const LABEL: Record<string, string> = {
  apresentacao: "Apresentação",
  concorrencia: "Concorrência",
  proposta: "Proposta",
};

export default async function PortalHome() {
  const supabase = await createClient();

  // RLS garante que só voltam os docs DESTE cliente.
  const { data: docs } = await supabase
    .from("documents")
    .select("id, titulo, tipo, created_at")
    .order("created_at", { ascending: false });

  const list = docs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suas entregas</h1>
        <p className="text-sm text-gray-500">
          Documentos disponibilizados pela equipe.
        </p>
      </div>

      <ul className="space-y-3">
        {list.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4"
          >
            <div>
              <p className="font-medium">{d.titulo}</p>
              <p className="text-xs text-gray-500">
                {LABEL[d.tipo] ?? d.tipo} ·{" "}
                {new Date(d.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <a
              href={`/api/documents/${d.id}/view`}
              target="_blank"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Abrir
            </a>
          </li>
        ))}
        {list.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500">
            Ainda não há entregas para você.
          </li>
        )}
      </ul>
    </div>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Serve o HTML com segurança:
// 1) exige sessão
// 2) busca o doc — a RLS só devolve se o usuário tem acesso
// 3) gera signed URL temporário e redireciona
// O arquivo abre no domínio do Storage (origem isolada do app),
// então nem vaza link nem toca nos cookies da sessão.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();

  // Sem acesso -> RLS não devolve a linha -> 404 (não revela existência).
  if (error || !doc) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 300); // 5 min

  if (signErr || !signed) {
    return NextResponse.json(
      { error: "Falha ao gerar link" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}

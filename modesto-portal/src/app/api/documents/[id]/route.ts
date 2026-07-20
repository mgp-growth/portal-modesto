import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Serve um documento de forma segura:
// 1) exige sessão;
// 2) busca o documento pela RLS (o usuário só encontra os do próprio client_id);
// 3) só então gera um signed URL temporário e redireciona pra ele.
// Um cliente não consegue nem descobrir nem abrir o doc de outro.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return new NextResponse('Documento não encontrado.', { status: 404 })
  }

  // createSignedUrl também passa pela RLS de storage (defesa em profundidade).
  const { data: signed, error: signErr } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 60) // válido por 60s

  if (signErr || !signed) {
    return new NextResponse('Erro ao gerar o link do arquivo.', { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}

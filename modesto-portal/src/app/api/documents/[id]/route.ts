import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Abre um documento de forma segura:
// 1) exige sessão;
// 2) acha o documento pela RLS (o usuário só encontra os do próprio client_id);
// 3) se for HTML, serve o conteúdo INLINE (renderizado na aba);
//    outros tipos caem num link temporário pra download.
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

  const path = doc.storage_path.toLowerCase()
  const isHtml = path.endsWith('.html') || path.endsWith('.htm')

  if (isHtml) {
    // download() também passa pela RLS de storage (defesa em profundidade)
    const { data: blob, error: dlErr } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (dlErr || !blob) {
      return new NextResponse('Erro ao abrir o documento.', { status: 500 })
    }

    const html = await blob.text()
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
      },
    })
  }

  // Tipos não-HTML: link temporário
  const { data: signed, error: signErr } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 60)

  if (signErr || !signed) {
    return new NextResponse('Erro ao gerar o link do arquivo.', { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}

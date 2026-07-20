'use server'

import { assertAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function uploadDocumentAction(formData: FormData) {
  await assertAdmin()

  const client_id = String(formData.get('client_id') ?? '')
  const titulo = String(formData.get('titulo') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '')
  const metadataRaw = String(formData.get('metadata') ?? '').trim()
  const file = formData.get('file') as File | null

  if (!client_id || !titulo || !tipo || !file || file.size === 0) return

  let metadata: Record<string, unknown> = {}
  if (metadataRaw) {
    try { metadata = JSON.parse(metadataRaw) } catch { metadata = {} }
  }

  const admin = createAdminClient()

  const ext = (file.name.split('.').pop() || 'html').toLowerCase()
  const path = `${client_id}/${crypto.randomUUID()}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: upErr } = await admin.storage
    .from('documents')
    .upload(path, bytes, {
      contentType: file.type || 'text/html',
      upsert: false,
    })
  if (upErr) throw new Error('Falha no upload: ' + upErr.message)

  const { error: insErr } = await admin.from('documents').insert({
    client_id,
    titulo,
    tipo,
    storage_path: path,
    metadata,
  })
  if (insErr) throw new Error('Falha ao salvar documento: ' + insErr.message)

  revalidatePath('/admin/documents')
}

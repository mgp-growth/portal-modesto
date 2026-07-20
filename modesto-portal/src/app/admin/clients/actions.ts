'use server'

import { assertAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData) {
  await assertAdmin()
  const nome = String(formData.get('nome') ?? '').trim()
  if (!nome) return
  const admin = createAdminClient()
  await admin.from('clients').insert({ nome })
  revalidatePath('/admin/clients')
}

// Cria um usuário do Auth já com papel 'client' e vinculado ao client_id.
// O trigger handle_new_user() lê esses metadados e monta o profile.
export async function createClientUserAction(formData: FormData) {
  await assertAdmin()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const client_id = String(formData.get('client_id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  if (!email || !password || !client_id) return

  const admin = createAdminClient()
  await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', client_id, nome },
  })
  revalidatePath('/admin/clients')
}

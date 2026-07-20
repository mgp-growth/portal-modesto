// Helpers de autorização usados por páginas e actions.
import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  role: 'admin' | 'client'
  client_id: string | null
  nome: string | null
}

// Retorna { user, profile } ou null se não houver sessão.
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, client_id, nome')
    .eq('id', user.id)
    .single()

  return { user, profile: (profile as Profile) ?? null }
}

// Usado em Server Actions: lança erro se quem chamou não for admin.
export async function assertAdmin() {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autenticado')
  if (session.profile?.role !== 'admin') throw new Error('Acesso negado')
  return session
}

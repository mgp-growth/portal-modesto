'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type LoginState = { error: string }

// Faz o login NO SERVIDOR. Assim os cookies de sessão (sb-...) são gravados
// pela resposta do servidor, e o middleware passa a enxergar o usuário —
// sem depender do navegador persistir a sessão.
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Preencha e-mail e senha.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-mail ou senha inválidos.' }
  }

  // Limpa o cache e manda pra raiz, que redireciona conforme o papel.
  revalidatePath('/', 'layout')
  redirect('/')
}

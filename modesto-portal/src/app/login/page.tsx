'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    // recarrega na raiz: o servidor redireciona conforme o papel
    window.location.href = '/'
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="brand" style={{ fontSize: 20, marginBottom: 4 }}>
          Modesto Growth
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Portal de clientes
        </div>
        <form onSubmit={onSubmit}>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  )
}

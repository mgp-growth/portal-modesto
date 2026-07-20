'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = { error: '' }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="brand" style={{ fontSize: 20, marginBottom: 4 }}>
          Modesto Growth
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Acesse o portal
        </div>
        <form action={formAction}>
          <label>E-mail</label>
          <input type="email" name="email" required autoComplete="email" />
          <label>Senha</label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
          {state?.error && <div className="error">{state.error}</div>}
          <button type="submit" disabled={pending} style={{ width: '100%' }}>
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

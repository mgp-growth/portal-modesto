'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = { error: '' }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <main className="auth-scene">
      <div className="auth-bg" aria-hidden="true">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="area" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#c2a15b" stopOpacity="0.14" />
              <stop offset="1" stopColor="#c2a15b" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="glow" cx="0.18" cy="0.12" r="0.9">
              <stop offset="0" stopColor="#c2a15b" stopOpacity="0.12" />
              <stop offset="1" stopColor="#c2a15b" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1200" height="800" fill="url(#glow)" />

          {/* malha sutil de dados */}
          <g stroke="#ece7db" strokeOpacity="0.035" strokeWidth="1">
            <line x1="0" y1="200" x2="1200" y2="200" />
            <line x1="0" y1="400" x2="1200" y2="400" />
            <line x1="0" y1="600" x2="1200" y2="600" />
            <line x1="200" y1="0" x2="200" y2="800" />
            <line x1="400" y1="0" x2="400" y2="800" />
            <line x1="600" y1="0" x2="600" y2="800" />
            <line x1="800" y1="0" x2="800" y2="800" />
            <line x1="1000" y1="0" x2="1000" y2="800" />
          </g>

          {/* área sob a curva */}
          <path
            d="M0,760 L0,650 C120,632 210,612 330,566 C470,512 570,470 700,388 C840,300 960,232 1200,128 L1200,800 L0,800 Z"
            fill="url(#area)"
          />

          {/* linha fantasma (referência) */}
          <path
            d="M0,708 C170,698 290,668 430,616 C570,564 690,502 830,432 C970,362 1090,304 1200,258"
            fill="none" stroke="#ece7db" strokeOpacity="0.06" strokeWidth="1.5"
          />

          {/* curva de crescimento principal — se desenha no load */}
          <path
            className="growth-line"
            d="M0,650 C120,632 210,612 330,566 C470,512 570,470 700,388 C840,300 960,232 1200,128"
            fill="none" stroke="#c2a15b" strokeOpacity="0.6" strokeWidth="2"
          />

          {/* marcos */}
          <g fill="#d9be86">
            <circle className="growth-dot d1" cx="330" cy="566" r="3" />
            <circle className="growth-dot d2" cx="700" cy="388" r="3" />
            <circle className="growth-dot d3" cx="1180" cy="132" r="4" />
          </g>
        </svg>
      </div>

      <div className="auth-card">
        <div className="auth-mark">M</div>
        <h1 className="auth-title">Modesto Growth</h1>
        <p className="auth-sub">Portal de clientes</p>

        <form action={formAction} className="auth-form">
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
          <button type="submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footnote">Acesso restrito · Modesto Growth Partners</div>
      </div>
    </main>
  )
}

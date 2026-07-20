import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  apresentacao: 'Apresentações',
  concorrencia: 'Análises de concorrência',
  proposta: 'Propostas',
}

// Extrai pares numéricos de metadata (aceita metadata.kpis {} ou números no topo).
function extractKpis(metadata: any): [string, number][] {
  const src = metadata?.kpis && typeof metadata.kpis === 'object' ? metadata.kpis : metadata
  if (!src || typeof src !== 'object') return []
  return Object.entries(src)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => [k, v as number])
}

export default async function ClientDashboard() {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  if (session.profile?.role === 'admin') redirect('/admin')

  const supabase = await createClient()
  // A RLS garante que só vêm os documentos do client_id deste usuário.
  const { data: docs } = await supabase
    .from('documents')
    .select('id, titulo, tipo, metadata, created_at')
    .order('created_at', { ascending: false })

  const allKpis = new Map<string, number>()
  for (const d of docs ?? []) {
    for (const [k, v] of extractKpis(d.metadata)) allKpis.set(k, v)
  }
  const kpis = Array.from(allKpis.entries()).slice(0, 6)

  const grupos = ['apresentacao', 'concorrencia', 'proposta'] as const

  return (
    <>
      <div className="topbar">
        <span className="brand">Modesto Growth</span>
        <div className="nav">
          <span className="tag">{session.profile?.nome ?? 'cliente'}</span>
          <form action="/auth/signout" method="post">
            <button className="btn-ghost" style={{ marginTop: 0, padding: '6px 12px' }}>Sair</button>
          </form>
        </div>
      </div>

      <div className="container">
        <h1 className="section-title" style={{ marginTop: 8 }}>Seu painel</h1>

        {kpis.length > 0 && (
          <div className="grid cols-3">
            {kpis.map(([k, v]) => (
              <div className="card" key={k}>
                <h3>{k}</h3>
                <div className="stat">{v.toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}

        {grupos.map((tipo) => {
          const list = docs?.filter((d) => d.tipo === tipo) ?? []
          if (list.length === 0) return null
          return (
            <div key={tipo}>
              <h2 className="section-title">{TIPO_LABEL[tipo]}</h2>
              <div className="grid cols-2">
                {list.map((d) => (
                  <a className="card" key={d.id} href={`/api/documents/${d.id}`} target="_blank">
                    <h3>{TIPO_LABEL[tipo]}</h3>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{d.titulo}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                      {new Date(d.created_at).toLocaleDateString('pt-BR')} · abrir →
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        })}

        {(!docs || docs.length === 0) && (
          <p className="muted">Ainda não há entregas publicadas para você.</p>
        )}
      </div>
    </>
  )
}

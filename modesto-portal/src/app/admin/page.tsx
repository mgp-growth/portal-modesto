import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  const supabase = await createClient()

  const [{ count: clientsCount }, { data: docs }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('tipo'),
  ])

  const total = docs?.length ?? 0
  const byType = (t: string) => docs?.filter((d) => d.tipo === t).length ?? 0

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 8 }}>Visão geral</h1>
      <div className="grid cols-3">
        <div className="card"><h3>Clientes</h3><div className="stat">{clientsCount ?? 0}</div></div>
        <div className="card"><h3>Documentos</h3><div className="stat">{total}</div></div>
        <div className="card"><h3>Propostas</h3><div className="stat">{byType('proposta')}</div></div>
        <div className="card"><h3>Apresentações</h3><div className="stat">{byType('apresentacao')}</div></div>
        <div className="card"><h3>Concorrência</h3><div className="stat">{byType('concorrencia')}</div></div>
      </div>
      <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
        As métricas mais ricas por cliente saem do campo <code>metadata</code> de cada
        documento. Suba um HTML em <a href="/admin/documents" style={{ color: 'var(--accent)' }}>Documentos</a> e
        preencha o JSON de metadata para alimentar o dashboard do cliente.
      </p>
    </>
  )
}

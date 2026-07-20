import { createClient } from '@/lib/supabase/server'
import { uploadDocumentAction } from './actions'

export const dynamic = 'force-dynamic'

const TIPOS = [
  { v: 'apresentacao', label: 'Apresentação' },
  { v: 'concorrencia', label: 'Concorrência' },
  { v: 'proposta', label: 'Proposta' },
]

export default async function DocumentsPage() {
  const supabase = await createClient()
  const [{ data: clients }, { data: docs }] = await Promise.all([
    supabase.from('clients').select('id, nome').order('nome'),
    supabase
      .from('documents')
      .select('id, titulo, tipo, created_at, client_id, clients(nome)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 8 }}>Documentos</h1>

      <div className="card">
        <h3>Subir documento (HTML)</h3>
        <form action={uploadDocumentAction}>
          <div className="grid cols-2">
            <div>
              <label>Cliente</label>
              <select name="client_id" required defaultValue="">
                <option value="" disabled>Selecione...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Tipo</label>
              <select name="tipo" required defaultValue="">
                <option value="" disabled>Selecione...</option>
                {TIPOS.map((t) => (
                  <option key={t.v} value={t.v}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <label>Título</label>
          <input name="titulo" required placeholder="Ex.: Análise de concorrência Q3" />
          <label>Arquivo HTML</label>
          <input name="file" type="file" accept=".html,text/html" required />
          <label>Metadata (JSON, opcional) — alimenta o dashboard do cliente</label>
          <textarea
            name="metadata"
            placeholder={'{\n  "kpis": { "trafego": 12400, "conversao": 3.2, "ctr": 1.8 }\n}'}
          />
          <button type="submit">Subir documento</button>
        </form>
      </div>

      <h2 className="section-title">Documentos enviados</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Título</th><th>Cliente</th><th>Tipo</th><th>Data</th><th></th></tr>
          </thead>
          <tbody>
            {docs?.length ? docs.map((d: any) => (
              <tr key={d.id}>
                <td>{d.titulo}</td>
                <td className="muted">{d.clients?.nome ?? '—'}</td>
                <td><span className="tag">{d.tipo}</span></td>
                <td className="muted">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                  <a href={`/api/documents/${d.id}`} target="_blank" style={{ color: 'var(--accent)' }}>
                    Abrir
                  </a>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="muted">Nenhum documento ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

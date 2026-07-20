import { createClient } from '@/lib/supabase/server'
import { createClientAction, createClientUserAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, nome, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 8 }}>Clientes</h1>

      <div className="grid cols-2">
        <div className="card">
          <h3>Novo cliente</h3>
          <form action={createClientAction}>
            <label>Nome do cliente</label>
            <input name="nome" required placeholder="Ex.: Loja Acme" />
            <button type="submit">Criar cliente</button>
          </form>
        </div>

        <div className="card">
          <h3>Novo usuário de cliente</h3>
          <form action={createClientUserAction}>
            <label>Cliente</label>
            <select name="client_id" required defaultValue="">
              <option value="" disabled>Selecione...</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <label>Nome da pessoa</label>
            <input name="nome" placeholder="Ex.: Maria Silva" />
            <label>E-mail de acesso</label>
            <input name="email" type="email" required placeholder="maria@cliente.com" />
            <label>Senha inicial</label>
            <input name="password" type="text" required placeholder="senha provisória" />
            <button type="submit">Criar acesso</button>
          </form>
        </div>
      </div>

      <h2 className="section-title">Todos os clientes</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Cliente</th><th>Criado em</th></tr>
          </thead>
          <tbody>
            {clients?.length ? clients.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td className="muted">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            )) : (
              <tr><td colSpan={2} className="muted">Nenhum cliente ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

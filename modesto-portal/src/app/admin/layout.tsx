import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  if (session.profile?.role !== 'admin') redirect('/dashboard')

  return (
    <>
      <div className="topbar">
        <div className="nav">
          <span className="brand">Modesto Growth</span>
          <a href="/admin">Visão geral</a>
          <a href="/admin/clients">Clientes</a>
          <a href="/admin/documents">Documentos</a>
        </div>
        <div className="nav">
          <span className="tag">admin</span>
          <form action="/auth/signout" method="post">
            <button className="btn-ghost" style={{ marginTop: 0, padding: '6px 12px' }}>
              Sair
            </button>
          </form>
        </div>
      </div>
      <div className="container">{children}</div>
    </>
  )
}

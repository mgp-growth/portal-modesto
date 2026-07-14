import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/portal");

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/30 bg-gray-900 text-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm">
            <span className="font-semibold tracking-tight text-white">
              Modesto Growth <span className="text-indigo-400">· Admin</span>
            </span>
            <Link
              href="/admin/clients"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Clientes
            </Link>
            <Link
              href="/admin/documents"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Entregas
            </Link>
          </nav>
          <form action={signOut}>
            <button className="text-sm text-gray-400 transition-colors hover:text-white">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

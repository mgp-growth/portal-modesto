import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/30 bg-gray-900 text-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight text-white">
            Modesto Growth <span className="text-indigo-400">· Portal</span>
          </span>
          <form action={signOut}>
            <button className="text-sm text-gray-400 transition-colors hover:text-white">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}

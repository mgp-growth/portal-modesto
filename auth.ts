import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

// Porta de entrada: manda cada um pro lugar certo.
export default async function Home() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");
  redirect("/portal");
}

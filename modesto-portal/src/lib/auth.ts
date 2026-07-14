import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  role: "admin" | "client";
  client_id: string | null;
  full_name: string | null;
};

// Retorna o profile do usuário logado (ou null).
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, client_id, full_name")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

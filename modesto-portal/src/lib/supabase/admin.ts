import { createClient } from "@supabase/supabase-js";

// Client com SERVICE ROLE. BYPASSA RLS. Usar SOMENTE no servidor,
// e somente depois de confirmar que quem chama é admin.
// Nunca importar isto em código de cliente/navegador.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

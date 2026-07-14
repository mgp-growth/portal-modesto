import { createBrowserClient } from "@supabase/ssr";

// Client para componentes que rodam no navegador (ex.: form de login).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE-ROLE client. Bypasses RLS. SERVER-ONLY.
// `server-only` import throws at build time if this is ever imported into a
// Client Component. Use only in trusted server code (admin mutations, audit).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client — uses the public anon key and is bound by RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Create one APPROVED demo worker for smoke-testing the public pages.
// Run: node --env-file=.env.local scripts/demo-worker.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "demo-worker@fundi.local";
const PHONE = "+243970000001";

// 1) auth user
let userId = null;
const { data: created, error: cErr } = await db.auth.admin.createUser({
  email: EMAIL,
  email_confirm: true,
  password: "Demo-" + Math.random().toString(36).slice(2, 10),
});
if (cErr) {
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  userId = list?.users?.find((u) => u.email === EMAIL)?.id;
} else {
  userId = created.user.id;
}
console.log("auth user:", userId);

// 2) users row
await db.from("users").upsert(
  { id: userId, role: "worker", full_name: "Jean Mukwege", phone: PHONE, whatsapp_number: PHONE, is_phone_verified: true },
  { onConflict: "id" },
);

// 3) reference ids
const { data: prof } = await db.from("professions").select("id").eq("slug", "electrician").single();
const { data: loc } = await db.from("locations").select("id").eq("slug", "ibanda").single();

// 4) worker (approved)
const { data: existing } = await db.from("workers").select("id").eq("user_id", userId).maybeSingle();
let workerId = existing?.id;
if (!workerId) {
  const { data: w, error: wErr } = await db
    .from("workers")
    .insert({
      user_id: userId,
      profession_id: prof.id,
      location_id: loc.id,
      headline: "Électricien certifié — installations & dépannage rapide",
      bio: "8 ans d'expérience. Installations domestiques, tableaux électriques, dépannage. Travail propre et garanti.",
      years_experience: 8,
      service_areas: ["Ibanda", "Nyalukemba", "Panzi"],
      hourly_rate_min: 5000,
      hourly_rate_max: 15000,
      whatsapp_number: PHONE,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (wErr) {
    console.error("worker insert failed:", wErr.message);
    process.exit(1);
  }
  workerId = w.id;
}

console.log("worker id:", workerId);
console.log("DONE — visit /workers and /workers/" + workerId);

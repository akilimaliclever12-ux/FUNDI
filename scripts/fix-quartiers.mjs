// Correct the Bukavu quartiers in the live DB to the canonical list.
// Idempotent. Run: node --env-file=.env.local scripts/fix-quartiers.mjs
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Canonical: commune slug -> quartier display names
const CANON = {
  ibanda: ["Ndendere", "Nyalukemba", "Panzi"],
  bagira: ["Lumumba", "Nyakavogo", "Mulambula", "Chikera", "Chikonyi", "Ciriri", "Kanoshe", "Mulwa", "Kasha", "Chahi"],
  kadutu: ["Cimpunda", "Mosala", "Kasali", "Nyamugo", "Nkafu", "Nyakaliba", "Kajangu"],
};

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// commune ids
const { data: communes } = await db.from("locations").select("id, slug").eq("type", "commune");
const communeId = Object.fromEntries((communes ?? []).map((c) => [c.slug, c.id]));
for (const slug of Object.keys(CANON)) {
  if (!communeId[slug]) throw new Error(`commune ${slug} not found`);
}

// canonical slug set
const canonicalSlugs = new Set(Object.values(CANON).flat().map(slugify));

// 1) remove quartiers not in the canonical list (guard against worker FK refs)
const { data: existingQ } = await db.from("locations").select("id, slug, name").eq("type", "quartier");
let removed = 0;
for (const q of existingQ ?? []) {
  if (canonicalSlugs.has(q.slug)) continue;
  const { count } = await db.from("workers").select("*", { count: "exact", head: true }).eq("location_id", q.id);
  if ((count ?? 0) > 0) {
    console.log(`  ! keeping "${q.name}" (${q.slug}) — ${count} worker(s) reference it`);
    continue;
  }
  await db.from("locations").delete().eq("id", q.id);
  console.log(`  - removed "${q.name}" (${q.slug})`);
  removed++;
}

// 2) upsert canonical quartiers under the right commune
let upserted = 0;
for (const [commune, names] of Object.entries(CANON)) {
  for (const name of names) {
    const slug = slugify(name);
    const { error } = await db.from("locations").upsert(
      { slug, name, type: "quartier", parent_id: communeId[commune], is_active: true },
      { onConflict: "slug" },
    );
    if (error) { console.log(`  x ${name}: ${error.message}`); continue; }
    upserted++;
  }
}

// 3) report
const { data: final } = await db
  .from("locations")
  .select("name, slug, type, parent_id")
  .order("type");
const byCommune = {};
for (const c of communes) byCommune[c.id] = c.slug;
const quartiers = (final ?? []).filter((l) => l.type === "quartier");
const grouped = {};
for (const q of quartiers) (grouped[byCommune[q.parent_id]] ??= []).push(q.name);

console.log(`\nremoved=${removed}, upserted=${upserted}`);
for (const [c, list] of Object.entries(grouped)) {
  console.log(`  ${c.toUpperCase()} (${list.length}): ${list.sort().join(", ")}`);
}
console.log(`Total quartiers: ${quartiers.length}`);

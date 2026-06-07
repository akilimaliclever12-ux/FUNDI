// Seed reference data (professions + Bukavu locations). Idempotent.
// Run: node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const professions = [
  { slug: "electrician", name_fr: "Électricien", name_sw: "Fundi wa umeme", name_en: "Electrician", icon: "bolt", sort_order: 1 },
  { slug: "plumber", name_fr: "Plombier", name_sw: "Fundi wa maji", name_en: "Plumber", icon: "droplet", sort_order: 2 },
  { slug: "carpenter", name_fr: "Menuisier", name_sw: "Seremala", name_en: "Carpenter", icon: "hammer", sort_order: 3 },
  { slug: "mason", name_fr: "Maçon", name_sw: "Fundi wa ujenzi", name_en: "Mason", icon: "bricks", sort_order: 4 },
  { slug: "welder", name_fr: "Soudeur", name_sw: "Fundi wa kuunganisha", name_en: "Welder", icon: "flame", sort_order: 5 },
  { slug: "painter", name_fr: "Peintre", name_sw: "Mpaka rangi", name_en: "Painter", icon: "brush", sort_order: 6 },
  { slug: "construction", name_fr: "Professionnel du bâtiment", name_sw: "Fundi wa ujenzi mkuu", name_en: "Construction professional", icon: "helmet", sort_order: 7 },
];

const city = { slug: "bukavu", name: "Bukavu", type: "city", latitude: -2.5083, longitude: 28.8425 };
const communes = [
  { slug: "ibanda", name: "Ibanda" },
  { slug: "kadutu", name: "Kadutu" },
  { slug: "bagira", name: "Bagira" },
];
const quartiers = [
  { slug: "ndendere", name: "Ndendere", parent: "ibanda" },
  { slug: "nyalukemba", name: "Nyalukemba", parent: "ibanda" },
  { slug: "panzi", name: "Panzi", parent: "ibanda" },
  { slug: "nyakaliba", name: "Nyakaliba", parent: "kadutu" },
  { slug: "cimpunda", name: "Cimpunda", parent: "kadutu" },
  { slug: "mosala", name: "Mosala", parent: "kadutu" },
  { slug: "lumu", name: "Lumu", parent: "bagira" },
  { slug: "nyamoma", name: "Nyamoma", parent: "bagira" },
];

async function getId(slug) {
  const { data } = await db.from("locations").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

console.log("Seeding professions…");
{
  const { error } = await db.from("professions").upsert(professions, { onConflict: "slug" });
  if (error) throw error;
}

console.log("Seeding city…");
await db.from("locations").upsert({ ...city }, { onConflict: "slug" });
const cityId = await getId("bukavu");

console.log("Seeding communes…");
await db
  .from("locations")
  .upsert(
    communes.map((c) => ({ ...c, type: "commune", parent_id: cityId })),
    { onConflict: "slug" },
  );

console.log("Seeding quartiers…");
for (const q of quartiers) {
  const parentId = await getId(q.parent);
  await db
    .from("locations")
    .upsert({ slug: q.slug, name: q.name, type: "quartier", parent_id: parentId }, { onConflict: "slug" });
}

const { count: pc } = await db.from("professions").select("*", { count: "exact", head: true });
const { count: lc } = await db.from("locations").select("*", { count: "exact", head: true });
console.log(`\n✓ Done. professions=${pc}, locations=${lc}`);

// Seed 5 complete, realistic fundi profiles. Idempotent (keyed by email).
// Run: node --env-file=.env.local scripts/seed-profiles.mjs
import { createClient } from "@supabase/supabase-js";

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const SITE = "https://fundi-red.vercel.app";
const img = (n) => `${SITE}/hero/hero-${n}.jpg`;
const DEMO_PASSWORD = "FundiDemo2026!";

// Each hero image depicts a specific trade — keep photos matched to the trade:
//   1=électricien, 2=peintre, 3=soudeur, 4=maçon, 5=menuisier, 6=plombier
const TRADE_IMG = { electrician: 1, painter: 2, welder: 3, mason: 4, carpenter: 5, plumber: 6 };

const PROFILES = [
  {
    email: "jb.mukendi@fundi.demo",
    full_name: "Jean-Baptiste Mukendi",
    phone: "+243971000101",
    profession: "electrician",
    quartier: "ndendere",
    headline: "Électricien certifié — installations & dépannage rapide",
    bio: "Électricien professionnel avec 9 ans d'expérience à Bukavu. Installation de tableaux électriques, câblage domestique et industriel, dépannage d'urgence et mise aux normes. Travail propre, garanti et ponctuel. Devis gratuit avant chaque intervention.",
    years: 9,
    rate: [10000, 30000],
    photos: [1, 4],
    reviews: [
      ["Sarah Kahindo", 5, "Travail rapide et très propre. Il a réparé tout mon tableau en une matinée."],
      ["Patrick Mugisho", 5, "Intervention le jour même, électricien sérieux et honnête."],
      ["Aline Bashige", 4, "Bon travail, prix correct. Je recommande."],
    ],
    credentials: [
      ["certification", "Certificat d'électricien — INPP Bukavu", 1],
      ["diploma", "Diplôme d'État en Électricité", 4],
    ],
    references: [
      ["Ir. Joseph Kalume", "Chef de chantier — BTP Kivu", "+243971234500"],
      ["Chantal Mwamini", "Gérante — Hôtel Panorama", "+243990111222"],
    ],
  },
  {
    email: "esther.nabintu@fundi.demo",
    full_name: "Esther Nabintu",
    phone: "+243971000102",
    profession: "plumber",
    quartier: "nyamugo",
    headline: "Plombière — sanitaires, fuites & raccordements d'eau",
    bio: "Plombière qualifiée avec 7 ans d'expérience. Réparation de fuites, installation de sanitaires (WC, lavabos, douches), raccordements d'eau et tuyauterie. Disponible rapidement, travail soigné et garanti.",
    years: 7,
    rate: [8000, 20000],
    photos: [2, 5],
    reviews: [
      ["Divine Furaha", 5, "Très professionnelle, elle a réglé une fuite que personne n'arrivait à trouver."],
      ["Olivier Ntaganda", 5, "Ponctuelle et propre. Travail impeccable."],
    ],
    credentials: [
      ["certification", "Formation en plomberie — Centre ENRA", 2],
      ["attestation", "Attestation de service rendu — Régideso", 5],
    ],
    references: [
      ["Emmanuel Lwaboshi", "Plombier-chef — Régideso Sud-Kivu", "+243971555888"],
    ],
  },
  {
    email: "patrick.bisimwa@fundi.demo",
    full_name: "Patrick Bisimwa",
    phone: "+243971000103",
    profession: "carpenter",
    quartier: "lumumba",
    headline: "Menuisier ébéniste — meubles sur mesure & charpente",
    bio: "Menuisier ébéniste passionné, 12 ans de métier. Fabrication de meubles sur mesure (lits, armoires, tables), portes, fenêtres et charpente. Bois local de qualité, finitions soignées. Livraison possible à Bukavu.",
    years: 12,
    rate: [15000, 60000],
    photos: [3, 6],
    reviews: [
      ["Grâce Mapendo", 5, "Une armoire magnifique, exactement comme demandé. Travail d'artiste."],
      ["Serge Bahati", 5, "Meubles solides et bien finis. Délais respectés."],
      ["Nadine Ciza", 5, "Très bon menuisier, à l'écoute et créatif."],
    ],
    credentials: [
      ["diploma", "Diplôme en Menuiserie — ITFM Bukavu", 3],
      ["attestation", "Attestation de travaux — Paroisse Ndendere", 6],
    ],
    references: [
      ["Abbé Pascal Mirindi", "Curé — Paroisse Saint-Joseph", "+243998222111"],
      ["Bernard Kuye", "Propriétaire — Meublerie du Lac", "+243971333444"],
    ],
  },
  {
    email: "david.cishugi@fundi.demo",
    full_name: "David Cishugi",
    phone: "+243971000104",
    profession: "mason",
    quartier: "cimpunda",
    headline: "Maçon — fondations, briques & finitions",
    bio: "Maçon expérimenté (15 ans) spécialisé en construction de maisons, fondations, élévation en briques et blocs, crépissage et finitions. Équipe disponible pour les grands chantiers. Sérieux et respect des délais.",
    years: 15,
    rate: [12000, 40000],
    photos: [4, 1],
    reviews: [
      ["Jeanine Wabiwa", 5, "Il a construit ma maison sans aucun souci. Très professionnel."],
      ["Thomas Lubunga", 4, "Bon maçon, équipe travailleuse."],
    ],
    credentials: [
      ["certification", "Certificat de Maçonnerie — INPP", 4],
    ],
    references: [
      ["Ing. Marie-Claire Furaha", "Architecte — Cabinet AXIS", "+243971777999"],
      ["Henri Mushagalusa", "Promoteur immobilier", "+243990444555"],
    ],
  },
  {
    email: "alphonse.bahati@fundi.demo",
    full_name: "Alphonse Bahati",
    phone: "+243971000105",
    profession: "painter",
    quartier: "panzi",
    headline: "Peintre en bâtiment — intérieur & extérieur",
    bio: "Peintre en bâtiment avec 8 ans d'expérience. Peinture intérieure et extérieure, enduits, décoration murale et traitement anti-humidité. Finitions nettes, matériaux de qualité, chantier laissé propre.",
    years: 8,
    rate: [7000, 18000],
    photos: [5, 3],
    reviews: [
      ["Rachel Nsimire", 5, "Ma maison a une nouvelle vie ! Peinture nette et soignée."],
      ["Gentil Amani", 5, "Rapide, propre et très aimable."],
    ],
    credentials: [
      ["certification", "Formation Peinture & Décoration — INPP", 5],
    ],
    references: [
      ["Espérance Lukogho", "Décoratrice d'intérieur", "+243971888000"],
    ],
  },
];

async function findUserId(email) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data.users.find((x) => x.email === email);
    if (u) return u.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

// resolve reference data
const profMap = {};
for (const slug of [...new Set(PROFILES.map((p) => p.profession))]) {
  const { data } = await svc.from("professions").select("id").eq("slug", slug).single();
  profMap[slug] = data.id;
}
const locMap = {};
for (const slug of [...new Set(PROFILES.map((p) => p.quartier))]) {
  const { data } = await svc.from("locations").select("id").eq("slug", slug).single();
  locMap[slug] = data.id;
}

for (const p of PROFILES) {
  console.log(`\n== ${p.full_name} (${p.profession}) ==`);

  // 1) auth user
  let userId = await findUserId(p.email);
  if (!userId) {
    const { data, error } = await svc.auth.admin.createUser({
      email: p.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) { console.log("  auth error:", error.message); continue; }
    userId = data.user.id;
    console.log("  created auth user");
  } else {
    console.log("  auth user exists");
  }

  // 2) users row
  await svc.from("users").upsert(
    { id: userId, role: "worker", full_name: p.full_name, phone: p.phone, whatsapp_number: p.phone, email: p.email, is_phone_verified: true },
    { onConflict: "id" },
  );

  // 3) worker (skip if already created)
  let { data: worker } = await svc.from("workers").select("id").eq("user_id", userId).maybeSingle();
  if (!worker) {
    const { data: w, error } = await svc.from("workers").insert({
      user_id: userId,
      profession_id: profMap[p.profession],
      location_id: locMap[p.quartier],
      headline: p.headline,
      bio: p.bio,
      years_experience: p.years,
      hourly_rate_min: p.rate[0],
      hourly_rate_max: p.rate[1],
      whatsapp_number: p.phone,
      status: "approved",
      approved_at: new Date().toISOString(),
    }).select("id").single();
    if (error) { console.log("  worker error:", error.message); continue; }
    worker = w;
    console.log("  worker created:", worker.id);
  } else {
    console.log("  worker already exists:", worker.id, "— refreshing details");
    await svc.from("workers").update({
      profession_id: profMap[p.profession], location_id: locMap[p.quartier],
      headline: p.headline, bio: p.bio, years_experience: p.years,
      hourly_rate_min: p.rate[0], hourly_rate_max: p.rate[1], whatsapp_number: p.phone,
      status: "approved", approved_at: new Date().toISOString(),
    }).eq("id", worker.id);
  }
  const wid = worker.id;

  // 4) photos (replace) — use ONLY the image matching this fundi's trade
  const ti = TRADE_IMG[p.profession];
  await svc.from("worker_photos").delete().eq("worker_id", wid);
  await svc.from("worker_photos").insert([
    {
      worker_id: wid, storage_path: `seed/hero-${ti}.jpg`, url: img(ti),
      type: "portfolio", is_primary: true, sort_order: 0,
    },
  ]);

  // 5) reviews (replace)
  await svc.from("reviews").delete().eq("worker_id", wid);
  await svc.from("reviews").insert(
    p.reviews.map(([author_name, rating, comment]) => ({
      worker_id: wid, author_name, rating, comment, status: "published",
    })),
  );

  // 6) credentials (replace) — same trade-matched image
  await svc.from("worker_credentials").delete().eq("worker_id", wid);
  await svc.from("worker_credentials").insert(
    p.credentials.map(([type, title]) => ({
      worker_id: wid, type, title, storage_path: `seed/hero-${ti}.jpg`, url: img(ti),
    })),
  );

  // 7) references (replace)
  await svc.from("worker_references").delete().eq("worker_id", wid);
  await svc.from("worker_references").insert(
    p.references.map(([name, position, contact]) => ({ worker_id: wid, name, position, contact })),
  );

  const { data: chk } = await svc.from("workers").select("rating_avg, rating_count, lead_count").eq("id", wid).single();
  console.log(`  ✓ trade-img=${ti} reviews=${p.reviews.length} creds=${p.credentials.length} refs=${p.references.length} rating=${chk.rating_avg}(${chk.rating_count})`);
}

console.log("\nDONE. Demo login for all: password =", DEMO_PASSWORD);

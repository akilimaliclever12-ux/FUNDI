export const SITE_NAME = "Fundi";
export const SITE_TAGLINE = "Trouvez un fundi de confiance.";
export const SITE_DESCRIPTION =
  "Fundi connecte les habitants de Bukavu avec des travailleurs qualifiés et vérifiés : électriciens, plombiers, menuisiers, maçons, soudeurs, peintres.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const PAGE_SIZE = 12;

// Fallback profession list (mirrors seed.sql) used when DB is unreachable / for labels.
export const PROFESSION_LABELS: Record<string, string> = {
  electrician: "Électricien",
  plumber: "Plombier",
  carpenter: "Menuisier",
  mason: "Maçon",
  welder: "Soudeur",
  painter: "Peintre",
  construction: "Professionnel du bâtiment",
  staffeur: "Staffeur",
};

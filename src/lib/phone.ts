// DRC phone helpers. Supabase phone auth requires E.164 (e.g. +243970000000).
// DRC mobile numbers are 9 national digits; locally written as 0XXXXXXXXX.

/**
 * Normalize a user-typed phone to E.164.
 * Accepts: "+243970000000", "243970000000", "0970000000", "970000000",
 * "+1...", etc. Returns null if it can't be made valid.
 */
export function normalizeDrcPhone(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, "");
  if (!cleaned) return null;

  // Explicit international number — trust the country code.
  if (cleaned.startsWith("+")) {
    const d = cleaned.slice(1).replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  }

  let d = cleaned.replace(/\D/g, "");
  if (d.startsWith("243")) d = d.slice(3); // dropped country code
  else if (d.startsWith("0")) d = d.slice(1); // dropped trunk prefix

  // DRC national significant number is 9 digits.
  if (d.length !== 9) return null;
  return `+243${d}`;
}

/** Display a stored E.164 number in a friendly grouped form. */
export function formatPhoneDisplay(e164: string): string {
  const m = e164.match(/^\+243(\d{3})(\d{3})(\d{3})$/);
  if (m) return `+243 ${m[1]} ${m[2]} ${m[3]}`;
  return e164;
}

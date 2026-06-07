// WhatsApp deep-link helpers. MVP uses wa.me links (no API).

/** Normalize a phone number to digits only, suitable for wa.me (no +). */
export function normalizeWaNumber(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/**
 * Build a wa.me deep link with a prefilled message.
 * @param number E.164-ish phone (e.g. "+243971234567")
 * @param message optional prefilled text
 */
export function buildWaLink(number: string, message?: string): string {
  const digits = normalizeWaNumber(number);
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Default polite first-contact message (French). */
export function defaultContactMessage(workerName: string, professionFr?: string): string {
  const trade = professionFr ? ` (${professionFr})` : "";
  return `Bonjour ${workerName}${trade}, je vous ai trouvé sur Fundi. J'aurais besoin de vos services.`;
}

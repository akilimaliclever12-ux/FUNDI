import "server-only";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

/**
 * Send a transactional email via Resend. No-op if RESEND_API_KEY is not set,
 * so the app works without email configured. Best-effort: never throws.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !opts.to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <notifications@fundi.cd>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
  } catch {
    // best-effort; ignore failures
  }
}

export function newMessageEmail(senderName: string, preview: string, convId: string): {
  subject: string;
  html: string;
} {
  return {
    subject: `Nouveau message de ${senderName} sur ${SITE_NAME}`,
    html: `
      <div style="font-family:system-ui,sans-serif">
        <h2 style="color:#0B5FFF">Nouveau message</h2>
        <p><strong>${senderName}</strong> vous a envoyé un message :</p>
        <blockquote style="border-left:3px solid #0B5FFF;padding-left:12px;color:#374151">${preview}</blockquote>
        <p><a href="${SITE_URL}/messages/${convId}" style="background:#0B5FFF;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Répondre</a></p>
      </div>`,
  };
}

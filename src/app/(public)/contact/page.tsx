import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { buildWaLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contactez l'équipe ${SITE_NAME}.`,
};

// Set the platform's own WhatsApp/contact number here.
const SUPPORT_WHATSAPP = "+14342578255";
const SUPPORT_EMAIL = "contact@fundi.cd";

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-ink">Nous contacter</h1>
      <p className="mt-1 text-gray-600">
        Une question, un problème, un partenariat ? Écrivez-nous.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <a
          href={buildWaLink(SUPPORT_WHATSAPP, "Bonjour Fundi, j'ai une question.")}
          className="card flex items-center gap-3 p-5 hover:border-brand/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-whatsapp/10 text-whatsapp">
            ✆
          </span>
          <div>
            <p className="font-semibold text-ink">WhatsApp</p>
            <p className="text-sm text-gray-500">Réponse rapide</p>
          </div>
        </a>

        <a href={`mailto:${SUPPORT_EMAIL}`} className="card flex items-center gap-3 p-5 hover:border-brand/40">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
            @
          </span>
          <div>
            <p className="font-semibold text-ink">Email</p>
            <p className="text-sm text-gray-500">{SUPPORT_EMAIL}</p>
          </div>
        </a>
      </div>

      {/* Simple contact form (posts to WhatsApp deep link as MVP fallback) */}
      <form
        className="card mt-6 max-w-lg space-y-3 p-5"
        action={buildWaLink(SUPPORT_WHATSAPP)}
        method="get"
      >
        <div>
          <label className="label" htmlFor="name">Votre nom</label>
          <input id="name" name="name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="text">Message</label>
          <textarea id="text" name="text" className="input" rows={4} required />
        </div>
        <button type="submit" className="btn-whatsapp w-full">Envoyer via WhatsApp</button>
      </form>
    </div>
  );
}

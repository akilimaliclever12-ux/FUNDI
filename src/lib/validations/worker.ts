import { z } from "zod";

const phoneRegex = /^\+?\d{9,15}$/;

// All fields are mandatory — a fundi cannot publish an incomplete profile.
export const workerProfileSchema = z
  .object({
    full_name: z.string().min(2, "Nom requis").max(120),
    phone: z.string().regex(phoneRegex, "Numéro de téléphone invalide"),
    whatsapp_number: z.string().regex(phoneRegex, "Numéro WhatsApp invalide"),
    profession_id: z.string().uuid("Profession requise"),
    location_id: z.string().uuid("Quartier requis"),
    headline: z.string().min(8, "Titre requis (8 caractères min)").max(140),
    bio: z.string().min(20, "Présentation requise (20 caractères min)").max(1500),
    years_experience: z.coerce.number().int().min(0, "Expérience requise").max(70),
    service_areas: z.array(z.string()).max(20).optional(),
    hourly_rate_min: z.coerce.number().int().min(0, "Tarif minimum requis"),
    hourly_rate_max: z.coerce.number().int().min(0, "Tarif maximum requis"),
  })
  .refine((d) => d.hourly_rate_max >= d.hourly_rate_min, {
    message: "Le tarif maximum doit être ≥ au minimum",
    path: ["hourly_rate_max"],
  });

export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;

// Self-service edit (no phone/auth fields; full_name handled separately).
export const workerEditSchema = z
  .object({
    profession_id: z.string().uuid("Profession requise"),
    location_id: z.string().uuid("Quartier requis"),
    headline: z.string().min(8, "Titre requis (8 caractères min)").max(140),
    bio: z.string().min(20, "Présentation requise (20 caractères min)").max(1500),
    years_experience: z.coerce.number().int().min(0, "Expérience requise").max(70),
    whatsapp_number: z.string().regex(phoneRegex, "Numéro WhatsApp invalide"),
    hourly_rate_min: z.coerce.number().int().min(0, "Tarif minimum requis"),
    hourly_rate_max: z.coerce.number().int().min(0, "Tarif maximum requis"),
  })
  .refine((d) => d.hourly_rate_max >= d.hourly_rate_min, {
    message: "Le tarif maximum doit être ≥ au minimum",
    path: ["hourly_rate_max"],
  });

export type WorkerEditInput = z.infer<typeof workerEditSchema>;

export const workerPhotoMetaSchema = z.object({
  storage_path: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["portfolio", "avatar", "verification"]).default("portfolio"),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  caption: z.string().max(140).optional(),
});

export type WorkerPhotoMetaInput = z.infer<typeof workerPhotoMetaSchema>;

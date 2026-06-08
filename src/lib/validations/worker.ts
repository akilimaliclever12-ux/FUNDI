import { z } from "zod";

const phoneRegex = /^\+?\d{9,15}$/;

export const workerProfileSchema = z.object({
  full_name: z.string().min(2, "Nom trop court").max(120),
  phone: z.string().regex(phoneRegex, "Numéro de téléphone invalide"),
  whatsapp_number: z.string().regex(phoneRegex, "Numéro WhatsApp invalide"),
  profession_id: z.string().uuid("Profession requise"),
  location_id: z.string().uuid("Quartier requis"),
  headline: z.string().min(8, "Décrivez votre métier en une phrase").max(140),
  bio: z.string().max(1500).optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(70),
  service_areas: z.array(z.string()).max(20).optional(),
  hourly_rate_min: z.coerce.number().int().min(0).optional(),
  hourly_rate_max: z.coerce.number().int().min(0).optional(),
});

export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;

// Self-service edit (no phone/auth fields; full_name handled separately).
export const workerEditSchema = z.object({
  profession_id: z.string().uuid("Profession requise"),
  location_id: z.string().uuid("Quartier requis"),
  headline: z.string().min(8, "Décrivez votre métier en une phrase").max(140),
  bio: z.string().max(1500).optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(70),
  whatsapp_number: z.string().regex(phoneRegex, "Numéro WhatsApp invalide"),
  hourly_rate_min: z.coerce.number().int().min(0).optional(),
  hourly_rate_max: z.coerce.number().int().min(0).optional(),
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

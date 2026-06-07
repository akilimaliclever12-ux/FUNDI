import { z } from "zod";

export const reviewSchema = z.object({
  worker_id: z.string().uuid(),
  author_name: z.string().min(2, "Nom requis").max(80),
  author_phone: z
    .string()
    .regex(/^\+?\d{9,15}$/, "Numéro invalide")
    .optional()
    .or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(800).optional().or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

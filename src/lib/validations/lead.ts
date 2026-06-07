import { z } from "zod";

export const leadSchema = z.object({
  worker_id: z.string().uuid(),
  channel: z.enum(["whatsapp", "call", "form"]).default("whatsapp"),
  source_page: z.string().max(60).optional(),
  customer_phone: z
    .string()
    .regex(/^\+?\d{9,15}$/)
    .optional(),
  message: z.string().max(500).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

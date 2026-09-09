import { z } from 'zod';

export const senderProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Indica o teu nome.').max(100),
  country: z.string().trim().min(2).max(60).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, 'Numero invalido. Usa o formato +351912345678.')
    .optional(),
});
export type SenderProfileInput = z.infer<typeof senderProfileSchema>;

export interface SenderProfileView {
  id: string;
  displayName: string;
  country: string | null;
  phone: string | null;
}

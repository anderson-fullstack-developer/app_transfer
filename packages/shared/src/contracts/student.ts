import { z } from 'zod';
import { normalizeUsername, validateUsername } from '../username/username.js';

/** Idade minima e maxima aceite no onboarding do estudante. */
export const STUDENT_MIN_AGE = 16;
export const STUDENT_MAX_AGE = 100;

function ageFrom(dateIso: string): number {
  const dob = new Date(dateIso);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.')
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Data invalida.')
  .refine((s) => {
    const age = ageFrom(s);
    return age >= STUDENT_MIN_AGE && age <= STUDENT_MAX_AGE;
  }, `Tens de ter entre ${STUDENT_MIN_AGE} e ${STUDENT_MAX_AGE} anos.`);

const usernameField = z
  .string()
  .transform((v) => normalizeUsername(v))
  .superRefine((value, ctx) => {
    const result = validateUsername(value);
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.reason ?? 'Username invalido.' });
    }
  });

export const studentProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Indica o nome completo.').max(100, 'Nome demasiado longo.'),
  dateOfBirth,
  country: z.string().trim().min(2, 'Indica o pais.').max(60),
  city: z.string().trim().min(2, 'Indica a cidade.').max(60),
  university: z.string().trim().min(2, 'Indica a universidade.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, 'Numero invalido. Usa o formato +212600112233.'),
  username: usernameField,
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

/** Perfil atualizavel (todos os campos opcionais). */
export const studentProfileUpdateSchema = studentProfileSchema.partial();
export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;

/** Resposta de disponibilidade de username. */
export interface UsernameAvailability {
  username: string;
  available: boolean;
  reason?: string;
}

/** Perfil publico/privado do estudante devolvido pela API. */
export interface StudentProfileView {
  id: string;
  username: string;
  displayName: string;
  country: string;
  city: string;
  university: string;
  phone: string;
  dateOfBirth: string;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified: boolean;
}

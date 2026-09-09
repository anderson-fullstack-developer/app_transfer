import { z } from 'zod';

/**
 * Contratos de autenticacao partilhados entre `apps/web` (validacao no browser,
 * feedback imediato) e `apps/api` (validacao autoritativa). Uma fonte de verdade.
 */

const email = z.string().trim().toLowerCase().email('Introduz um email valido.');

const password = z
  .string()
  .min(8, 'A password tem de ter pelo menos 8 caracteres.')
  .max(128, 'A password e demasiado longa.');

export const accountTypeSchema = z.enum(['STUDENT', 'SENDER']);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const registerSchema = z.object({
  email,
  password,
  accountType: accountTypeSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Introduz a password.').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Utilizador tal como devolvido por /auth/login, /auth/register e /auth/me. */
export interface AuthUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'SENDER' | 'ADMIN';
  emailVerified: boolean;
  /** O utilizador ja completou o onboarding (perfil criado)? */
  onboardingComplete: boolean;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

import { AppError, ErrorCode } from '../errors/index.js';
import { isReservedUsername } from './reserved.js';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Caracteres permitidos: letras (a-z), digitos, `_` e `.`. Sem espacos. */
const USERNAME_PATTERN = /^[a-z0-9._]+$/;

/**
 * Normaliza um username para a forma canonica de comparacao/armazenamento:
 *   - remove um `@` inicial (o utilizador pode escrever "@carlos" ou "carlos");
 *   - remove espacos nas pontas;
 *   - passa a minusculas (case-insensitive).
 *
 * Guardamos SEMPRE `usernameNormalized` na base de dados com unique index;
 * a forma "de apresentacao" (com as maiusculas originais) fica noutro campo.
 */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

export interface UsernameValidationOptions {
  /** Se true, lanca AppError em vez de devolver o resultado. */
  throwOnError?: boolean;
}

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  code?: Extract<ErrorCode, 'USERNAME_INVALID' | 'USERNAME_RESERVED'>;
  reason?: string;
}

/**
 * Valida um username segundo as regras da seccao 5 da doc. Nao verifica
 * disponibilidade — isso e responsabilidade do backend contra a base de dados.
 */
export function validateUsername(
  input: string,
  options: UsernameValidationOptions = {},
): UsernameValidationResult {
  const normalized = normalizeUsername(input);

  const fail = (
    code: NonNullable<UsernameValidationResult['code']>,
    reason: string,
  ): UsernameValidationResult => {
    if (options.throwOnError) {
      throw new AppError(code, reason);
    }
    return { valid: false, normalized, code, reason };
  };

  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return fail(
      ErrorCode.USERNAME_INVALID,
      `O username tem de ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres.`,
    );
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return fail(
      ErrorCode.USERNAME_INVALID,
      'O username so pode conter letras, numeros, ponto (.) e underscore (_).',
    );
  }
  if (normalized.startsWith('.') || normalized.endsWith('.')) {
    return fail(ErrorCode.USERNAME_INVALID, 'O username nao pode comecar nem terminar com ponto.');
  }
  if (normalized.includes('..')) {
    return fail(ErrorCode.USERNAME_INVALID, 'O username nao pode ter dois pontos seguidos.');
  }
  if (isReservedUsername(normalized)) {
    return fail(ErrorCode.USERNAME_RESERVED, 'Esse username esta reservado. Escolhe outro.');
  }

  return { valid: true, normalized };
}

/** Forma de apresentacao: sempre com `@` a frente. */
export function formatUsername(normalized: string): string {
  return `@${normalized.replace(/^@+/, '')}`;
}

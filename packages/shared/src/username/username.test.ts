import { describe, expect, it } from 'vitest';
import { formatUsername, normalizeUsername, validateUsername } from './username.js';
import { AppError } from '../errors/index.js';

describe('normalizeUsername', () => {
  it('remove @ inicial, espacos e passa a minusculas', () => {
    expect(normalizeUsername('  @Carlos ')).toBe('carlos');
    expect(normalizeUsername('Manuel.Silva')).toBe('manuel.silva');
    expect(normalizeUsername('@@joao23')).toBe('joao23');
  });
});

describe('validateUsername', () => {
  it.each(['carlos', 'manuel.silva', 'joao23', 'ab_c', 'a.b_c.d'])('aceita "%s"', (u) => {
    expect(validateUsername(u).valid).toBe(true);
  });

  it('rejeita demasiado curto', () => {
    expect(validateUsername('ab').code).toBe('USERNAME_INVALID');
  });

  it('rejeita demasiado longo', () => {
    expect(validateUsername('a'.repeat(31)).code).toBe('USERNAME_INVALID');
  });

  it('rejeita espacos e caracteres invalidos', () => {
    expect(validateUsername('joao silva').valid).toBe(false);
    expect(validateUsername('joão').valid).toBe(false);
    expect(validateUsername('carlos!').valid).toBe(false);
  });

  it('rejeita ponto no inicio/fim e pontos seguidos', () => {
    expect(validateUsername('.carlos').valid).toBe(false);
    expect(validateUsername('carlos.').valid).toBe(false);
    expect(validateUsername('car..los').valid).toBe(false);
  });

  it('rejeita usernames reservados (case-insensitive)', () => {
    expect(validateUsername('Admin').code).toBe('USERNAME_RESERVED');
    expect(validateUsername('@PAYMENTS').code).toBe('USERNAME_RESERVED');
  });

  it('lanca AppError quando throwOnError = true', () => {
    expect(() => validateUsername('ab', { throwOnError: true })).toThrow(AppError);
  });
});

describe('formatUsername', () => {
  it('prefixa com @', () => {
    expect(formatUsername('carlos')).toBe('@carlos');
    expect(formatUsername('@carlos')).toBe('@carlos');
  });
});

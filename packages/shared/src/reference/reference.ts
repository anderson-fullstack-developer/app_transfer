/**
 * Referencias publicas amigaveis (seccao 12 da doc). Nunca expor IDs
 * incrementais. Alfabeto sem caracteres ambiguos (0/O, 1/I/L).
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export interface RandomSource {
  /** Devolve `size` bytes aleatorios criptograficamente seguros. */
  randomBytes(size: number): Uint8Array;
}

function pick(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}

/** Ex.: "TRF-X8H29K7Q". `length` = numero de caracteres apos o prefixo. */
export function generateTransferReference(source: RandomSource, length = 8): string {
  return `TRF-${pick(source.randomBytes(length))}`;
}

/** Ex.: "QTE-7Q2H". */
export function generateQuoteReference(source: RandomSource, length = 6): string {
  return `QTE-${pick(source.randomBytes(length))}`;
}

import { randomBytes, scrypt as scryptCb, type ScryptOptions, timingSafeEqual } from 'node:crypto';

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hashing de passwords com scrypt (Node core, sem dependencias nativas).
 * scrypt e recomendado pela OWASP para armazenamento de passwords.
 *
 * Formato guardado:  scrypt$N$r$p$<salt-base64>$<hash-base64>
 * Guardar os parametros no hash permite aumentar o custo no futuro sem
 * invalidar hashes antigos.
 */
const N = 16_384; // custo CPU/memoria (2^14)
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('password vazia');
  }
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(plain.normalize('NFKC'), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: 128 * N * R * 2,
  });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  const salt = Buffer.from(saltB64 ?? '', 'base64');
  const expected = Buffer.from(hashB64 ?? '', 'base64');
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || expected.length === 0) {
    return false;
  }
  const derived = await scrypt(plain.normalize('NFKC'), salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: 128 * n * r * 2,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Indica se um hash foi criado com parametros mais fracos do que os atuais. */
export function passwordNeedsRehash(stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return true;
  return Number(parts[1]) < N || Number(parts[2]) < R || Number(parts[3]) < P;
}

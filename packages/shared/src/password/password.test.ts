import { describe, expect, it } from 'vitest';
import { hashPassword, passwordNeedsRehash, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('gera hashes diferentes para a mesma password (salt aleatorio)', async () => {
    const a = await hashPassword('correct horse battery staple');
    const b = await hashPassword('correct horse battery staple');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
  });

  it('verifica a password correta', async () => {
    const hash = await hashPassword('S3nh@Forte!');
    expect(await verifyPassword('S3nh@Forte!', hash)).toBe(true);
  });

  it('rejeita a password errada', async () => {
    const hash = await hashPassword('S3nh@Forte!');
    expect(await verifyPassword('errada', hash)).toBe(false);
  });

  it('rejeita hashes malformados sem rebentar', async () => {
    expect(await verifyPassword('x', 'nao-e-um-hash')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });

  it('rejeita password vazia ao criar', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });

  it('passwordNeedsRehash: false para hash atual, true para formato invalido', async () => {
    const hash = await hashPassword('abc123');
    expect(passwordNeedsRehash(hash)).toBe(false);
    expect(passwordNeedsRehash('scrypt$1024$8$1$xxx$yyy')).toBe(true);
  });
});

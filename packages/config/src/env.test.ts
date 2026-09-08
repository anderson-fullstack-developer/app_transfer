import { describe, expect, it } from 'vitest';
import { parseApiEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app_transfer',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(16),
  JWT_REFRESH_SECRET: 'b'.repeat(16),
};

describe('parseApiEnv', () => {
  it('aplica valores por omissao', () => {
    const env = parseApiEnv(base);
    expect(env.API_PORT).toBe(4000);
    expect(env.APP_MODE).toBe('SIMULATION');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
  });

  it('falha se faltar DATABASE_URL', () => {
    const { DATABASE_URL: _omit, ...rest } = base;
    expect(() => parseApiEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('falha se o segredo JWT for demasiado curto', () => {
    expect(() => parseApiEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('proibe dev endpoints em producao', () => {
    expect(() =>
      parseApiEnv({ ...base, NODE_ENV: 'production', ENABLE_DEV_ENDPOINTS: 'true' }),
    ).toThrow(/ENABLE_DEV_ENDPOINTS/);
  });

  it('faz split das origens CORS', () => {
    const env = parseApiEnv({ ...base, CORS_ORIGINS: 'http://a.com, http://b.com' });
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });
});

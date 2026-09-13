import { z } from 'zod';

/** Coerce "true"/"false"/"1"/"0" para boolean. */
const booleanFromString = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

const intFromString = z.coerce.number().int();

/**
 * Schema de ambiente do backend (`apps/api`). Validado uma vez no arranque —
 * se algo estiver em falta ou mal formado, a app nao arranca (fail fast).
 */
export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_MODE: z.enum(['SIMULATION', 'LIVE']).default('SIMULATION'),

  API_PORT: intFromString.default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().url(),
  /** Ligacao direta (sem pooler) para migrations. Opcional; default = DATABASE_URL. */
  DIRECT_URL: z.string().url().optional(),
  /**
   * Opcional ate haver uso real (rate limiting distribuido / BullMQ) — doc,
   * seccao 3: "nao adicionar infraestrutura que ainda nao tenha uso real".
   */
  REDIS_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET tem de ter pelo menos 16 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET tem de ter pelo menos 16 caracteres'),
  JWT_ACCESS_TTL: intFromString.default(900),
  JWT_REFRESH_TTL: intFromString.default(1_209_600),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: booleanFromString.default(false),

  PAYMENT_PROVIDER: z.enum(['mock', 'wise', 'nium', 'thunes']).default('mock'),
  MOCK_EUR_MAD_RATE: z.string().default('10.85'),
  MOCK_TRANSFER_FEE_PERCENT: z.string().default('2'),
  MOCK_TRANSFER_FIXED_FEE_MINOR: intFromString.default(0),

  TRANSFER_MIN_SOURCE_MINOR: intFromString.default(1000),
  TRANSFER_MAX_SOURCE_MINOR: intFromString.default(500_000),
  QUOTE_TTL_SECONDS: intFromString.default(600),

  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('app-transfer <no-reply@apptransfer.test>'),

  ENABLE_DEV_ENDPOINTS: booleanFromString.default(false),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export interface ParseEnvResult {
  success: boolean;
  env?: ApiEnv;
  errors?: string[];
}

/** Valida `source` (por omissao `process.env`) contra o schema do backend. */
export function parseApiEnv(source: Record<string, string | undefined> = process.env): ApiEnv {
  const parsed = apiEnvSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Configuracao de ambiente invalida:\n${lines.join('\n')}`);
  }
  // Invariante de seguranca: dev endpoints nunca ligados em producao (seccao 15).
  if (parsed.data.NODE_ENV === 'production' && parsed.data.ENABLE_DEV_ENDPOINTS) {
    throw new Error('ENABLE_DEV_ENDPOINTS tem de ser false quando NODE_ENV=production');
  }
  return parsed.data;
}

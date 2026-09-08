import { z } from 'zod';

/**
 * Variaveis de ambiente expostas ao browser. So `NEXT_PUBLIC_*` sao acessiveis
 * no cliente. Validadas aqui para falhar cedo se algo estiver mal configurado.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_APP_MODE: z.enum(['SIMULATION', 'LIVE']).default('SIMULATION'),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
});

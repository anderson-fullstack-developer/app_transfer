import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

// apps/api/test -> apps/api -> apps -> raiz do monorepo (onde vive o .env).
loadDotenv({ path: resolve(__dirname, '../../../.env') });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL nao definida. Cria um branch Neon (ou BD Docker) dedicado a ' +
      'testes e define TEST_DATABASE_URL no .env antes de correr `pnpm test:e2e`. ' +
      'NUNCA apontar isto para a BD de desenvolvimento ou producao -- os testes ' +
      'apagam a base toda entre execucoes.',
  );
}

// A app le sempre DATABASE_URL (PrismaClient + AppConfigService) -- redirecionamos
// para a BD de testes ANTES de qualquer modulo Nest ser instanciado.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
process.env.APP_MODE = 'SIMULATION';
// Precisamos do endpoint /dev/mock/transfers/:reference/advance para o teste
// E2E chegar a DELIVERED. parseApiEnv so recusa isto com NODE_ENV=production.
process.env.ENABLE_DEV_ENDPOINTS = 'true';

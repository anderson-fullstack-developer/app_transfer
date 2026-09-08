import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Configuracao do Prisma (substitui a chave `package.json#prisma`, deprecada).
 * O carregamento do `.env` da raiz do monorepo e feito pelos scripts via
 * `dotenv -e ../../.env` (ver package.json).
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});

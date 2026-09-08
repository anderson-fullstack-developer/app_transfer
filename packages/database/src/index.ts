/**
 * @app/database — ponto de acesso unico a base de dados.
 * Reexporta o `PrismaClient` gerado e todos os tipos/enums do schema.
 *
 * O cliente e gerado por `prisma generate` (corre no `postinstall` da raiz).
 * Num checkout novo, se aparecer um erro de tipos aqui, correr `pnpm db:generate`.
 */
export * from '@prisma/client';
export { PrismaClient, Prisma } from '@prisma/client';

import { PrismaClient } from '@prisma/client';

/** Cria um cliente Prisma com logging adequado ao ambiente. */
export function createPrismaClient(options?: { log?: boolean }): PrismaClient {
  return new PrismaClient({
    log: options?.log ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

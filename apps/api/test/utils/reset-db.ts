import { type PrismaClient } from '@app/database';

/**
 * Limpa TODAS as tabelas da BD de testes. So deve ser chamado contra
 * TEST_DATABASE_URL (verificado em setup-env.ts) -- nunca contra dev/producao.
 */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;
  if (tables.length === 0) return;
  const names = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
}

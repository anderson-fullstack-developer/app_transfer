/**
 * Seed de desenvolvimento (seccao 28 da doc).
 *
 * FASE 1: placeholder. A FASE 2 cria os utilizadores de exemplo
 *   admin@example.test / sender@example.test / student@example.test
 * e o estudante @carlos, com passwords documentadas APENAS para dev.
 *
 * Estas credenciais NUNCA podem existir em producao.
 */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed nunca deve correr em producao.');
  }
  // eslint-disable-next-line no-console
  console.log('[seed] placeholder — sera implementado na Fase 2.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

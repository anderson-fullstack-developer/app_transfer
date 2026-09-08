/**
 * Usernames reservados: nomes que nao podem ser escolhidos por estudantes
 * porque colidem com rotas, funcoes de sistema ou dao aparencia de conta
 * oficial. Comparado sempre contra a versao normalizada.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'support',
  'help',
  'api',
  'payments',
  'payment',
  'transfer',
  'transfers',
  'settings',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'root',
  'system',
  'security',
  'billing',
  'account',
  'accounts',
  'me',
  'null',
  'undefined',
  'app',
  'apptransfer',
  'official',
  'staff',
  'moderator',
  'webhook',
  'webhooks',
  'dev',
]);

export function isReservedUsername(normalized: string): boolean {
  return RESERVED_USERNAMES.has(normalized);
}

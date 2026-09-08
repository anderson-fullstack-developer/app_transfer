/**
 * Guarda o access token APENAS em memoria do modulo (nunca localStorage /
 * sessionStorage — doc, seccao 4). Perde-se num refresh da pagina; a sessao
 * e reconstruida a partir do cookie httpOnly via /auth/refresh.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

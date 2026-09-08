import { type ApiErrorBody, type ErrorCode } from '@app/shared';
import { env } from './env';
import { getAccessToken, setAccessToken } from './token-store';

/** Erro normalizado a partir do corpo `{ error: { code, message } }` da API. */
export class ApiError extends Error {
  readonly code: ErrorCode | 'NETWORK_ERROR';
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: ApiError['code'],
    message: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Nao tentar renovar a sessao em caso de 401 (usado pelo proprio /auth/refresh). */
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const doRequest = async (): Promise<Response> => {
    const token = getAccessToken();
    return fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await doRequest();
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Sem ligacao a API. Verifica se o servidor esta a correr.',
      0,
    );
  }

  if (res.status === 401 && !options.skipRefresh) {
    const ok = await tryRefresh();
    if (ok) {
      res = await doRequest();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const payload: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const body = payload as Partial<ApiErrorBody> | undefined;
    throw new ApiError(
      body?.error?.code ?? 'INTERNAL_ERROR',
      body?.error?.message ?? 'Ocorreu um erro. Tenta novamente.',
      res.status,
      body?.error?.details,
    );
  }

  return payload as T;
}

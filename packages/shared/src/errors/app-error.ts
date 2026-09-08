import type { ErrorCode } from './error-codes.js';

/** Mapeamento de codigo de erro -> estado HTTP por omissao. */
const DEFAULT_HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  SESSION_EXPIRED: 401,
  VALIDATION_ERROR: 422,
  INVALID_AMOUNT: 422,
  USERNAME_TAKEN: 409,
  USERNAME_NOT_FOUND: 404,
  USERNAME_RESERVED: 422,
  USERNAME_INVALID: 422,
  STUDENT_NOT_FOUND: 404,
  QUOTE_NOT_FOUND: 404,
  QUOTE_EXPIRED: 410,
  QUOTE_ALREADY_CONSUMED: 409,
  TRANSFER_NOT_FOUND: 404,
  INVALID_TRANSFER_STATE: 409,
  TRANSFER_AMOUNT_OUT_OF_RANGE: 422,
  PROVIDER_UNAVAILABLE: 503,
  RATE_LIMIT_EXCEEDED: 429,
  IDEMPOTENCY_KEY_CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
  INTERNAL_ERROR: 500,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export interface AppErrorOptions {
  /** Sobrepoe o estado HTTP por omissao. */
  httpStatus?: number;
  /** Detalhes de validacao por campo. */
  details?: Record<string, string[]>;
  /** Erro original, para logging (nunca exposto ao cliente). */
  cause?: unknown;
}

/**
 * Erro de dominio/aplicacao com um `code` estavel. As camadas HTTP convertem-no
 * no corpo `ApiErrorBody`. Lancar isto em vez de `Error` cru para que o cliente
 * receba sempre um formato previsivel.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, string[]>;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = options.httpStatus ?? DEFAULT_HTTP_STATUS[code];
    this.details = options.details;
  }

  static is(value: unknown): value is AppError {
    return value instanceof AppError;
  }
}

/**
 * Codigos de erro estaveis da aplicacao. O `code` e contrato de API: o frontend
 * pode confiar nele para mostrar mensagens especificas. A `message` e legivel
 * para humanos e pode mudar sem quebrar clientes.
 */
export const ErrorCode = {
  // Autenticacao / autorizacao
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validacao generica
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_AMOUNT: 'INVALID_AMOUNT',

  // Username / estudante
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  USERNAME_NOT_FOUND: 'USERNAME_NOT_FOUND',
  USERNAME_RESERVED: 'USERNAME_RESERVED',
  USERNAME_INVALID: 'USERNAME_INVALID',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',

  // Quote
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  QUOTE_ALREADY_CONSUMED: 'QUOTE_ALREADY_CONSUMED',

  // Transferencia
  TRANSFER_NOT_FOUND: 'TRANSFER_NOT_FOUND',
  INVALID_TRANSFER_STATE: 'INVALID_TRANSFER_STATE',
  TRANSFER_AMOUNT_OUT_OF_RANGE: 'TRANSFER_AMOUNT_OUT_OF_RANGE',

  // Infra / provider
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Forma consistente de erro devolvida pela API (seccao 25 da doc). */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** Detalhes de validacao por campo, quando aplicavel. Nunca stack traces. */
    details?: Record<string, string[]>;
    /** Correlacao com os logs estruturados. */
    requestId?: string;
  };
}

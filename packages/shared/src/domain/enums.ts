/**
 * Enums de dominio partilhados entre backend e frontend.
 * Fonte unica de verdade — o schema Prisma deve espelhar estes valores.
 */

/** Papeis de utilizador. Um utilizador comum NUNCA se pode tornar ADMIN pelo frontend. */
export const UserRole = {
  STUDENT: 'STUDENT',
  SENDER: 'SENDER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Estado da conta de utilizador. */
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Estado do processo de verificacao de identidade (KYC). Sem KYC real nesta fase. */
export const KycStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

/** Estado de uma quote (cotacao). */
export const QuoteStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CONSUMED: 'CONSUMED',
} as const;
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

/**
 * Estados de uma transferencia. Transicoes controladas por uma state machine
 * explicita (ver `transfer-state-machine.ts`). Nao sao permitidas transicoes
 * arbitrarias.
 */
export const TransferStatus = {
  DRAFT: 'DRAFT',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SENT_TO_PROVIDER: 'SENT_TO_PROVIDER',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

/** Tipo de evento no historico imutavel de uma transferencia. */
export const TransferEventType = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PROVIDER_UPDATE: 'PROVIDER_UPDATE',
  PAYMENT_ATTEMPT: 'PAYMENT_ATTEMPT',
  NOTE: 'NOTE',
} as const;
export type TransferEventType = (typeof TransferEventType)[keyof typeof TransferEventType];

/** Canais de notificacao. Nesta fase apenas IN_APP e EMAIL sao implementados. */
export const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

/** Provedores de pagamento suportados pela abstracao. So "mock" esta implementado. */
export const PaymentProviderName = {
  MOCK: 'mock',
  WISE: 'wise',
  NIUM: 'nium',
  THUNES: 'thunes',
} as const;
export type PaymentProviderName = (typeof PaymentProviderName)[keyof typeof PaymentProviderName];

/** Modo da plataforma. SIMULATION = nenhuma transferencia representa dinheiro real. */
export const AppMode = {
  SIMULATION: 'SIMULATION',
  LIVE: 'LIVE',
} as const;
export type AppMode = (typeof AppMode)[keyof typeof AppMode];

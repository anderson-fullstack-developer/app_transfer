-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'SENDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_PROCESSING', 'PAID', 'PROCESSING', 'SENT_TO_PROVIDER', 'DELIVERED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransferEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PROVIDER_UPDATE', 'PAYMENT_ATTEMPT', 'NOTE');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "usernameNormalized" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sender_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "country" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sender_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "senderId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "destinationCurrency" TEXT NOT NULL,
    "sourceAmountMinor" BIGINT NOT NULL,
    "feeAmountMinor" BIGINT NOT NULL,
    "destinationAmountMinor" BIGINT NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "senderId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "destinationCurrency" TEXT NOT NULL,
    "sourceAmountMinor" BIGINT NOT NULL,
    "feeAmountMinor" BIGINT NOT NULL,
    "destinationAmountMinor" BIGINT NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT NOT NULL,
    "providerTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_events" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "previousStatus" "TransferStatus",
    "newStatus" "TransferStatus" NOT NULL,
    "eventType" "TransferEventType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_beneficiaries" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "alias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "sessionId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "userId" UUID,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_usernameNormalized_key" ON "student_profiles"("usernameNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "sender_profiles_userId_key" ON "sender_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_reference_key" ON "quotes"("reference");

-- CreateIndex
CREATE INDEX "quotes_senderId_idx" ON "quotes"("senderId");

-- CreateIndex
CREATE INDEX "quotes_studentId_idx" ON "quotes"("studentId");

-- CreateIndex
CREATE INDEX "quotes_status_expiresAt_idx" ON "quotes"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_reference_key" ON "transfers"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_quoteId_key" ON "transfers"("quoteId");

-- CreateIndex
CREATE INDEX "transfers_senderId_idx" ON "transfers"("senderId");

-- CreateIndex
CREATE INDEX "transfers_studentId_idx" ON "transfers"("studentId");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "transfers_createdAt_idx" ON "transfers"("createdAt");

-- CreateIndex
CREATE INDEX "transfer_events_transferId_createdAt_idx" ON "transfer_events"("transferId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_attempts_transferId_idx" ON "payment_attempts"("transferId");

-- CreateIndex
CREATE INDEX "favorite_beneficiaries_senderId_idx" ON "favorite_beneficiaries"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_beneficiaries_senderId_studentId_key" ON "favorite_beneficiaries"("senderId", "studentId");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_scope_key" ON "idempotency_keys"("key", "scope");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sender_profiles" ADD CONSTRAINT "sender_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "sender_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "sender_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_beneficiaries" ADD CONSTRAINT "favorite_beneficiaries_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "sender_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_beneficiaries" ADD CONSTRAINT "favorite_beneficiaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

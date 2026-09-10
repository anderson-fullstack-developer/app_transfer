import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ErrorCode,
  Money,
  type CreateQuoteInput,
  type PublicStudentView,
  type QuoteRateInfo,
  type QuoteView,
  formatUsername,
  generateQuoteReference,
  normalizeUsername,
} from '@app/shared';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { AuditService } from '../audit/audit.service';
import { SendersService } from '../senders/senders.service';
import { StudentsService } from '../students/students.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment-provider.interface';

const randomSource = { randomBytes: (n: number): Uint8Array => randomBytes(n) };

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
    private readonly senders: SendersService,
    private readonly students: StudentsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  rateInfo(): QuoteRateInfo {
    const env = this.config.raw;
    return {
      sourceCurrency: 'EUR',
      destinationCurrency: 'MAD',
      exchangeRate: env.MOCK_EUR_MAD_RATE,
      feePercent: env.MOCK_TRANSFER_FEE_PERCENT,
      fixedFeeMinor: env.MOCK_TRANSFER_FIXED_FEE_MINOR,
      minSourceMinor: env.TRANSFER_MIN_SOURCE_MINOR,
      maxSourceMinor: env.TRANSFER_MAX_SOURCE_MINOR,
    };
  }

  async createQuote(
    userId: string,
    userEmail: string,
    input: CreateQuoteInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ): Promise<QuoteView> {
    const source = Money.fromMajor('EUR', input.amount);
    const env = this.config.raw;
    const minor = Number(source.toMinorString());
    if (minor < env.TRANSFER_MIN_SOURCE_MINOR || minor > env.TRANSFER_MAX_SOURCE_MINOR) {
      throw new AppError(
        ErrorCode.TRANSFER_AMOUNT_OUT_OF_RANGE,
        `O valor tem de estar entre ${(env.TRANSFER_MIN_SOURCE_MINOR / 100).toFixed(2)} e ${(
          env.TRANSFER_MAX_SOURCE_MINOR / 100
        ).toFixed(2)} EUR.`,
      );
    }

    const student = await this.students.findPublicByUsername(input.studentUsername);
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { usernameNormalized: normalizeUsername(input.studentUsername) },
      select: { id: true },
    });
    if (!studentProfile) {
      throw new AppError(ErrorCode.STUDENT_NOT_FOUND, 'Estudante nao encontrado.');
    }

    const senderProfile = await this.senders.ensureProfile(userId, userEmail);

    const providerQuote = await this.provider.createQuote({
      sourceCurrency: 'EUR',
      destinationCurrency: 'MAD',
      sourceAmountMinor: source.minor,
    });

    const expiresAt = new Date(Date.now() + env.QUOTE_TTL_SECONDS * 1000);
    const total = providerQuote.sourceAmountMinor + providerQuote.feeAmountMinor;

    const quote = await this.prisma.quote.create({
      data: {
        reference: generateQuoteReference(randomSource),
        senderId: senderProfile.id,
        studentId: studentProfile.id,
        sourceCurrency: 'EUR',
        destinationCurrency: 'MAD',
        sourceAmountMinor: providerQuote.sourceAmountMinor,
        feeAmountMinor: providerQuote.feeAmountMinor,
        destinationAmountMinor: providerQuote.destinationAmountMinor,
        exchangeRate: providerQuote.exchangeRate,
        provider: this.provider.name,
        status: 'ACTIVE',
        expiresAt,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'QUOTE_CREATED',
      entityType: 'Quote',
      entityId: quote.id,
      metadata: {
        reference: quote.reference,
        sourceAmountMinor: quote.sourceAmountMinor.toString(),
        student: student.username,
      },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return this.toView(quote, student, total);
  }

  async getQuote(userId: string, id: string): Promise<QuoteView> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { sender: { select: { userId: true } }, student: true },
    });
    if (!quote || quote.sender.userId !== userId) {
      throw new AppError(ErrorCode.QUOTE_NOT_FOUND, 'Cotacao nao encontrada.');
    }

    // Expiracao preguicosa.
    if (quote.status === 'ACTIVE' && quote.expiresAt.getTime() < Date.now()) {
      await this.prisma.quote.update({ where: { id }, data: { status: 'EXPIRED' } });
      quote.status = 'EXPIRED';
    }

    const student: PublicStudentView = {
      username: formatUsername(quote.student.username),
      displayName: quote.student.displayName,
      city: quote.student.city,
      country: quote.student.country,
      verified: quote.student.kycStatus === 'VERIFIED',
    };
    return this.toView(quote, student, quote.sourceAmountMinor + quote.feeAmountMinor);
  }

  private toView(
    quote: {
      id: string;
      reference: string;
      sourceCurrency: string;
      destinationCurrency: string;
      sourceAmountMinor: bigint;
      feeAmountMinor: bigint;
      destinationAmountMinor: bigint;
      exchangeRate: { toString(): string };
      provider: string;
      status: string;
      expiresAt: Date;
      createdAt: Date;
    },
    student: PublicStudentView,
    totalChargedMinor: bigint,
  ): QuoteView {
    return {
      id: quote.id,
      reference: quote.reference,
      student,
      sourceCurrency: quote.sourceCurrency,
      destinationCurrency: quote.destinationCurrency,
      sourceAmountMinor: quote.sourceAmountMinor.toString(),
      feeAmountMinor: quote.feeAmountMinor.toString(),
      totalChargedMinor: totalChargedMinor.toString(),
      destinationAmountMinor: quote.destinationAmountMinor.toString(),
      exchangeRate: quote.exchangeRate.toString(),
      provider: quote.provider,
      status: quote.status as QuoteView['status'],
      expiresAt: quote.expiresAt.toISOString(),
      createdAt: quote.createdAt.toISOString(),
    };
  }
}

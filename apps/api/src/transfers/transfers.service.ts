import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ErrorCode,
  UserRole,
  formatMoney,
  generateTransferReference,
  type CreateTransferInput,
  type TransferListItem,
  type TransferView,
} from '@app/shared';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment-provider.interface';
import { TransferStateService } from './transfer-state.service';
import { IdempotencyService } from './idempotency.service';

const randomSource = { randomBytes: (n: number): Uint8Array => randomBytes(n) };
const SCOPE_CREATE = 'POST /transfers';

interface Ctx {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly state: TransferStateService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async createTransfer(
    userId: string,
    input: CreateTransferInput,
    idempotencyKey: string | undefined,
    ctx: Ctx,
  ): Promise<{ status: number; body: TransferView }> {
    if (!idempotencyKey) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'O header Idempotency-Key e obrigatorio para criar uma transferencia.',
      );
    }

    const result = await this.idempotency.run<TransferView>({
      key: idempotencyKey,
      scope: SCOPE_CREATE,
      userId,
      payload: input,
      fn: () => this.doCreateTransfer(userId, input, ctx),
    });

    return { status: result.status, body: result.body };
  }

  private async doCreateTransfer(
    userId: string,
    input: CreateTransferInput,
    ctx: Ctx,
  ): Promise<{ status: number; body: TransferView }> {
    const quote = await this.prisma.quote.findUnique({
      where: { id: input.quoteId },
      include: {
        sender: { select: { id: true, userId: true, displayName: true } },
        student: true,
      },
    });
    if (!quote || quote.sender.userId !== userId) {
      throw new AppError(ErrorCode.QUOTE_NOT_FOUND, 'Cotacao nao encontrada.');
    }
    if (quote.status === 'CONSUMED') {
      throw new AppError(ErrorCode.QUOTE_ALREADY_CONSUMED, 'Essa cotacao ja foi usada.');
    }
    if (quote.status === 'EXPIRED' || quote.expiresAt.getTime() < Date.now()) {
      if (quote.status === 'ACTIVE') {
        await this.prisma.quote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' } });
      }
      throw new AppError(
        ErrorCode.QUOTE_EXPIRED,
        'Esta cotacao expirou. Cria uma nova para continuares.',
        { httpStatus: 410 },
      );
    }

    // Consome a quote de forma atomica: se outro pedido a consumiu primeiro, falha aqui.
    const consumed = await this.prisma.quote.updateMany({
      where: { id: quote.id, status: 'ACTIVE' },
      data: { status: 'CONSUMED' },
    });
    if (consumed.count === 0) {
      throw new AppError(ErrorCode.QUOTE_ALREADY_CONSUMED, 'Essa cotacao ja foi usada.');
    }

    const transfer = await this.prisma.transfer.create({
      data: {
        reference: generateTransferReference(randomSource),
        senderId: quote.senderId,
        studentId: quote.studentId,
        quoteId: quote.id,
        sourceCurrency: quote.sourceCurrency,
        destinationCurrency: quote.destinationCurrency,
        sourceAmountMinor: quote.sourceAmountMinor,
        feeAmountMinor: quote.feeAmountMinor,
        destinationAmountMinor: quote.destinationAmountMinor,
        exchangeRate: quote.exchangeRate,
        provider: quote.provider,
        status: 'DRAFT',
      },
    });
    await this.prisma.transferEvent.create({
      data: {
        transferId: transfer.id,
        previousStatus: null,
        newStatus: 'DRAFT',
        eventType: 'CREATED',
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'TRANSFER_CREATED',
      entityType: 'Transfer',
      entityId: transfer.id,
      metadata: { reference: transfer.reference, quoteId: quote.id },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    // Modo SIMULATION: avanca automaticamente o "pagamento" do remetente (nao
    // ha cobranca real) ate ao ponto em que o provider assume a transferencia.
    await this.state.transition(transfer.id, 'DRAFT', 'AWAITING_PAYMENT', 'STATUS_CHANGED');
    await this.state.transition(
      transfer.id,
      'AWAITING_PAYMENT',
      'PAYMENT_PROCESSING',
      'PAYMENT_ATTEMPT',
    );
    await this.state.transition(transfer.id, 'PAYMENT_PROCESSING', 'PAID', 'STATUS_CHANGED');
    await this.state.transition(transfer.id, 'PAID', 'PROCESSING', 'STATUS_CHANGED');

    const providerResult = await this.provider.createTransfer({
      sourceCurrency: transfer.sourceCurrency,
      destinationCurrency: transfer.destinationCurrency,
      sourceAmountMinor: transfer.sourceAmountMinor,
      destinationAmountMinor: transfer.destinationAmountMinor,
      reference: transfer.reference,
    });
    await this.prisma.transfer.update({
      where: { id: transfer.id },
      data: { providerTransferId: providerResult.providerTransferId },
    });
    await this.state.transition(transfer.id, 'PROCESSING', 'SENT_TO_PROVIDER', 'PROVIDER_UPDATE', {
      providerTransferId: providerResult.providerTransferId,
    });

    const view = await this.buildView(transfer.reference, userId, UserRole.SENDER);
    return { status: 201, body: view };
  }

  async listMine(userId: string, role: UserRole): Promise<TransferListItem[]> {
    const where =
      role === UserRole.STUDENT
        ? { student: { userId } }
        : role === UserRole.SENDER
          ? { sender: { userId } }
          : {};
    const transfers = await this.prisma.transfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { displayName: true } },
        student: { select: { displayName: true, username: true } },
      },
    });
    return transfers.map((t) => ({
      reference: t.reference,
      status: t.status,
      sourceAmountMinor: t.sourceAmountMinor.toString(),
      destinationAmountMinor: t.destinationAmountMinor.toString(),
      counterpartyName: role === UserRole.STUDENT ? t.sender.displayName : t.student.displayName,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getByReference(userId: string, role: UserRole, reference: string): Promise<TransferView> {
    return this.buildView(reference, userId, role);
  }

  /** So para desenvolvimento: avanca SENT_TO_PROVIDER -> DELIVERED. */
  async devAdvance(reference: string): Promise<TransferView> {
    const transfer = await this.prisma.transfer.findUnique({
      where: { reference },
      include: {
        sender: { select: { userId: true, displayName: true } },
        student: { select: { userId: true, displayName: true, username: true } },
      },
    });
    if (!transfer) {
      throw new AppError(ErrorCode.TRANSFER_NOT_FOUND, 'Transferencia nao encontrada.');
    }
    if (transfer.status !== 'SENT_TO_PROVIDER') {
      throw new AppError(
        ErrorCode.INVALID_TRANSFER_STATE,
        `So e possivel avancar transferencias em SENT_TO_PROVIDER (esta esta em ${transfer.status}).`,
      );
    }
    await this.state.transition(transfer.id, 'SENT_TO_PROVIDER', 'DELIVERED', 'PROVIDER_UPDATE', {
      simulated: true,
    });
    await this.audit.record({
      action: 'TRANSFER_STATUS_CHANGED',
      entityType: 'Transfer',
      entityId: transfer.id,
      metadata: { from: 'SENT_TO_PROVIDER', to: 'DELIVERED', dev: true },
    });

    const destinationFormatted = formatMoney(transfer.destinationAmountMinor, 'MAD');
    const sourceFormatted = formatMoney(transfer.sourceAmountMinor, 'EUR');
    await this.notifications.create(
      transfer.student.userId,
      'TRANSFER_DELIVERED',
      'Recebeste uma transferência',
      `${transfer.sender.displayName} enviou-te ${destinationFormatted} (${transfer.reference}).`,
      { transferReference: transfer.reference },
    );
    await this.notifications.create(
      transfer.sender.userId,
      'TRANSFER_DELIVERED',
      'Transferência entregue',
      `${sourceFormatted} para @${transfer.student.username} foram entregues a ${transfer.student.displayName}.`,
      { transferReference: transfer.reference },
    );

    return this.buildView(reference, null, UserRole.ADMIN);
  }

  private async buildView(
    reference: string,
    userId: string | null,
    role: UserRole,
  ): Promise<TransferView> {
    const transfer = await this.prisma.transfer.findUnique({
      where: { reference },
      include: {
        sender: { select: { userId: true, displayName: true } },
        student: { select: { userId: true, displayName: true, username: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!transfer) {
      throw new AppError(ErrorCode.TRANSFER_NOT_FOUND, 'Transferencia nao encontrada.');
    }

    if (userId) {
      const isOwner = transfer.sender.userId === userId || transfer.student.userId === userId;
      if (!isOwner && role !== UserRole.ADMIN) {
        throw new AppError(ErrorCode.TRANSFER_NOT_FOUND, 'Transferencia nao encontrada.');
      }
    }

    const viewerIsStudent = userId !== null && transfer.student.userId === userId;
    const totalCharged = transfer.sourceAmountMinor + transfer.feeAmountMinor;

    return {
      reference: transfer.reference,
      status: transfer.status,
      sourceCurrency: transfer.sourceCurrency,
      destinationCurrency: transfer.destinationCurrency,
      sourceAmountMinor: transfer.sourceAmountMinor.toString(),
      feeAmountMinor: transfer.feeAmountMinor.toString(),
      totalChargedMinor: totalCharged.toString(),
      destinationAmountMinor: transfer.destinationAmountMinor.toString(),
      exchangeRate: transfer.exchangeRate.toString(),
      provider: transfer.provider,
      counterpartyName: viewerIsStudent
        ? transfer.sender.displayName
        : transfer.student.displayName,
      counterpartyUsername: viewerIsStudent ? null : `@${transfer.student.username}`,
      createdAt: transfer.createdAt.toISOString(),
      completedAt: transfer.completedAt ? transfer.completedAt.toISOString() : null,
      events: transfer.events.map((e) => ({
        eventType: e.eventType,
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }
}

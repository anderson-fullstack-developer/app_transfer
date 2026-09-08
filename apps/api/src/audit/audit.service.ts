import { Injectable, Logger } from '@nestjs/common';
import { type Prisma } from '@app/database';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Regista operacoes relevantes no `audit_logs` (doc, seccao 13).
 * NUNCA guardar passwords, tokens ou documentos completos — so metadados seguros.
 * Uma falha a auditar nao deve rebentar a operacao principal.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata ?? {},
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Falha a registar audit log (${entry.action})`, error as Error);
    }
  }
}

import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';
import {
  UserRole,
  type AdminStatsView,
  type AdminTransferListItem,
  type AdminUserListItem,
  type TransferStatus,
  type TransferView,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { TransfersService } from '../transfers/transfers.service';
import { AdminService } from './admin.service';

/**
 * Painel administrativo (doc, seccao 21). So leitura — nenhum endpoint aqui
 * altera valores financeiros ou estado de transferencias.
 * RBAC: todos os endpoints exigem UserRole.ADMIN (verificado no backend).
 */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly transfers: TransfersService,
    private readonly audit: AuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Estatisticas do dashboard' })
  stats(): Promise<AdminStatsView> {
    return this.admin.stats();
  }

  @Get('users')
  @ApiOperation({ summary: '[ADMIN] Listar utilizadores' })
  listUsers(): Promise<AdminUserListItem[]> {
    return this.admin.listUsers();
  }

  @Get('transfers')
  @ApiOperation({ summary: '[ADMIN] Listar transferencias, com filtros' })
  listTransfers(
    @Query('status') status?: TransferStatus,
    @Query('username') username?: string,
    @Query('reference') reference?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<AdminTransferListItem[]> {
    return this.admin.listTransfers({ status, username, reference, dateFrom, dateTo });
  }

  @Get('transfers/:reference')
  @ApiOperation({ summary: '[ADMIN] Consultar uma transferencia (qualquer utilizador)' })
  async getTransfer(
    @CurrentUser('id') adminId: string,
    @Param('reference') reference: string,
    @Req() req: Request,
  ): Promise<TransferView> {
    const view = await this.transfers.getByReference(adminId, UserRole.ADMIN, reference);
    await this.audit.record({
      actorId: adminId,
      action: 'ADMIN_TRANSFER_VIEWED',
      entityType: 'Transfer',
      entityId: view.reference,
      ip: req.ip ?? null,
      userAgent: req.header('user-agent') ?? null,
    });
    return view;
  }
}

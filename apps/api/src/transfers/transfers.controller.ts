import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import {
  createTransferSchema,
  UserRole,
  type CreateTransferInput,
  type TransferListItem,
  type TransferView,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TransfersService } from './transfers.service';

@ApiTags('transfers')
@Controller({ path: 'transfers', version: '1' })
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post()
  @Roles(UserRole.SENDER)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Criar uma transferencia a partir de uma cotacao' })
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTransferSchema)) dto: CreateTransferInput,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TransferView> {
    const { status, body } = await this.transfers.createTransfer(userId, dto, idempotencyKey, {
      ip: req.ip ?? null,
      userAgent: req.header('user-agent') ?? null,
    });
    res.status(status);
    return body;
  }

  @Get()
  @ApiOperation({ summary: 'As minhas transferencias (remetente ou estudante)' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<TransferListItem[]> {
    return this.transfers.listMine(user.id, user.role);
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Consultar uma transferencia (com historico)' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reference') reference: string,
  ): Promise<TransferView> {
    return this.transfers.getByReference(user.id, user.role, reference);
  }
}

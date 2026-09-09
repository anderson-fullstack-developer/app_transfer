import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';
import {
  senderProfileSchema,
  UserRole,
  type SenderProfileInput,
  type SenderProfileView,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SendersService } from './senders.service';

@ApiTags('senders')
@Controller({ path: 'senders', version: '1' })
export class SendersController {
  constructor(private readonly senders: SendersService) {}

  @Get('me')
  @Roles(UserRole.SENDER)
  @ApiOperation({ summary: 'O meu perfil de remetente' })
  getMe(@CurrentUser('id') userId: string): Promise<SenderProfileView> {
    return this.senders.getMyProfile(userId);
  }

  @Put('me')
  @Roles(UserRole.SENDER)
  @ApiOperation({ summary: 'Criar ou atualizar o perfil de remetente' })
  upsertMe(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(senderProfileSchema)) dto: SenderProfileInput,
    @Req() req: Request,
  ): Promise<SenderProfileView> {
    return this.senders.upsertMyProfile(userId, dto, {
      ip: req.ip ?? null,
      userAgent: req.header('user-agent') ?? null,
    });
  }
}

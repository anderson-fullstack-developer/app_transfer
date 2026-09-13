import { Controller, Get, HttpCode, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type NotificationListResult } from '@app/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'As minhas notificacoes + contagem de nao lidas' })
  list(@CurrentUser('id') userId: string): Promise<NotificationListResult> {
    return this.notifications.list(userId);
  }

  @Patch('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marcar todas as notificacoes como lidas' })
  markAllRead(@CurrentUser('id') userId: string): Promise<void> {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marcar uma notificacao como lida' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.notifications.markRead(userId, id);
  }
}

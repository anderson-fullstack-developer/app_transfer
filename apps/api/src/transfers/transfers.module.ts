import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { TransferStateService } from './transfer-state.service';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TransfersController],
  providers: [TransfersService, TransferStateService, IdempotencyService],
  exports: [TransfersService],
})
export class TransfersModule {}

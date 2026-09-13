import { Module } from '@nestjs/common';
import { TransfersModule } from '../transfers/transfers.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TransfersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

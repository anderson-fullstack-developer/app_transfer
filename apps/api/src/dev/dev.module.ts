import { Module } from '@nestjs/common';
import { TransfersModule } from '../transfers/transfers.module';
import { DevController } from './dev.controller';

@Module({
  imports: [TransfersModule],
  controllers: [DevController],
})
export class DevModule {}

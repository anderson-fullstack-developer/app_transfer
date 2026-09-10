import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { SendersModule } from '../senders/senders.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [StudentsModule, SendersModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}

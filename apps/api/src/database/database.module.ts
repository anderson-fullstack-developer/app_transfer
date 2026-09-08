import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Modulo global de acesso a base de dados. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

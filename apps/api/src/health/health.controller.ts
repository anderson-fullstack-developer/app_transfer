import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + ligacao a base de dados' })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    mode: string;
    env: string;
    database: 'up' | 'down';
    timestamp: string;
  }> {
    const database = (await this.prisma.ping()) ? 'up' : 'down';
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      mode: this.config.raw.APP_MODE,
      env: this.config.nodeEnv,
      database,
      timestamp: new Date().toISOString(),
    };
  }
}

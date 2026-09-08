import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfigService } from '../config/app-config.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness / metadados basicos da API' })
  check(): {
    status: 'ok';
    mode: string;
    env: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      mode: this.config.raw.APP_MODE,
      env: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }
}

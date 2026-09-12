import { Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { type TransferView } from '@app/shared';
import { AppConfigService } from '../config/app-config.service';
import { TransfersService } from '../transfers/transfers.service';

/**
 * Endpoints so para desenvolvimento — nunca disponiveis em producao (doc,
 * seccao 15). `parseApiEnv` ja recusa arrancar com NODE_ENV=production e
 * ENABLE_DEV_ENDPOINTS=true; isto e a segunda barreira, em runtime.
 */
@ApiExcludeController()
@Controller({ path: 'dev', version: '1' })
export class DevController {
  constructor(
    private readonly config: AppConfigService,
    private readonly transfers: TransfersService,
  ) {}

  @Post('mock/transfers/:reference/advance')
  advance(@Param('reference') reference: string): Promise<TransferView> {
    if (!this.config.devEndpointsEnabled) {
      throw new NotFoundException();
    }
    return this.transfers.devAdvance(reference);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { type EmailProvider, type SendEmailInput } from './email.types';

/**
 * Provider de email para desenvolvimento: nao envia nada, escreve o email no
 * terminal. Permite testar verificacao de email / reset de password sem
 * configurar um servico externo (doc, seccao 22).
 */
@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email');

  constructor(private readonly config: AppConfigService) {}

  send(input: SendEmailInput): Promise<void> {
    this.logger.log(
      [
        '',
        '──────────── EMAIL (console) ────────────',
        `De:      ${this.config.emailFrom}`,
        `Para:    ${input.to}`,
        `Assunto: ${input.subject}`,
        '',
        input.text,
        '─────────────────────────────────────────',
      ].join('\n'),
    );
    return Promise.resolve();
  }
}

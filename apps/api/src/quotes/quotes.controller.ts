import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';
import {
  createQuoteSchema,
  UserRole,
  type CreateQuoteInput,
  type QuoteRateInfo,
  type QuoteView,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@Controller({ path: 'quotes', version: '1' })
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get('rate')
  @ApiOperation({ summary: 'Parametros de cotacao (para preview no browser)' })
  rate(): QuoteRateInfo {
    return this.quotes.rateInfo();
  }

  @Post()
  @Roles(UserRole.SENDER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Criar uma cotacao EUR -> MAD (valida 10 min)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createQuoteSchema)) dto: CreateQuoteInput,
    @Req() req: Request,
  ): Promise<QuoteView> {
    return this.quotes.createQuote(user.id, user.email, dto, {
      ip: req.ip ?? null,
      userAgent: req.header('user-agent') ?? null,
    });
  }

  @Get(':id')
  @Roles(UserRole.SENDER)
  @ApiOperation({ summary: 'Consultar uma cotacao' })
  get(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<QuoteView> {
    return this.quotes.getQuote(userId, id);
  }
}

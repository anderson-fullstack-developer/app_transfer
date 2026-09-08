import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from '@app/shared';

/** Corpo de erro documentado no Swagger (seccao 25 da doc). */
export class ApiErrorDetailDto {
  @ApiProperty({ enum: Object.values(ErrorCode), example: ErrorCode.VALIDATION_ERROR })
  code!: ErrorCode;

  @ApiProperty({ example: 'Nao encontramos nenhum estudante com esse username.' })
  message!: string;

  @ApiProperty({
    required: false,
    description: 'Detalhes de validacao por campo, quando aplicavel.',
    example: { amount: ['O valor tem de ser positivo.'] },
  })
  details?: Record<string, string[]>;

  @ApiProperty({ required: false, example: 'b6c1f0a2-9a1e-4c3e-8f2a-1d2c3b4a5e6f' })
  requestId?: string;
}

export class ApiErrorDto {
  @ApiProperty({ type: ApiErrorDetailDto })
  error!: ApiErrorDetailDto;
}

import { type PipeTransform } from '@nestjs/common';
import { type ZodSchema } from 'zod';
import { AppError, ErrorCode } from '@app/shared';

/**
 * Valida o input contra um schema Zod (a mesma fonte de verdade usada no
 * frontend). Em caso de erro lanca AppError(VALIDATION_ERROR) com detalhes
 * por campo, mantendo o formato de erro consistente da API.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;

    const details: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_';
      (details[key] ??= []).push(issue.message);
    }
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Dados invalidos.', { details });
  }
}

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { type ApiErrorBody, AppError, ErrorCode } from '@app/shared';

/**
 * Converte QUALQUER excecao no formato de erro consistente `ApiErrorBody`.
 * - `AppError` -> usa o seu `code`/`httpStatus`;
 * - `HttpException` do Nest -> mapeada para um `ErrorCode` aproximado;
 * - resto -> `INTERNAL_ERROR` 500, SEM stack trace no corpo (seccao 25).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();
    const requestId = request.id;

    const { status, body } = this.normalize(exception, requestId);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status} ${body.error.code}`);
    }

    response.status(status).json(body);
  }

  private normalize(
    exception: unknown,
    requestId?: string,
  ): { status: number; body: ApiErrorBody } {
    if (AppError.is(exception)) {
      return {
        status: exception.httpStatus,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
            requestId,
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      return {
        status,
        body: {
          error: {
            code: this.mapHttpStatusToCode(status),
            message: Array.isArray(message) ? message.join('; ') : message,
            requestId,
          },
        },
      };
    }

    return {
      status: 500,
      body: {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Ocorreu um erro inesperado. Tenta novamente mais tarde.',
          requestId,
        },
      },
    };
  }

  private mapHttpStatusToCode(status: number): ErrorCode {
    switch (status) {
      case 400:
      case 422:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}

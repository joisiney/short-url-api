import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestContext } from '../interceptors/request-context.interceptor';

function isErrorObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  private static readonly STATUS_CODE_MAP: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'TIMEOUT',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_SERVER_ERROR',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestContext>();

    const requestId = request.requestId ?? '';
    const correlationId = request.correlationId ?? '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal Server Error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (isErrorObject(exceptionResponse)) {
        code =
          typeof exceptionResponse.code === 'string'
            ? exceptionResponse.code
            : this.mapStatusToCode(status);
        message =
          typeof exceptionResponse.message === 'string'
            ? exceptionResponse.message
            : exception.message;
        details = exceptionResponse.details;
      } else {
        code = this.mapStatusToCode(status);
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message;
      }
    } else {
      this.logger.error(
        `[Req: ${requestId}] [Corr: ${correlationId}] Unhandled Exception`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: Record<string, unknown> = {
      code,
      statusCode: status,
      message,
      requestId,
      correlationId,
      timestamp: new Date().toISOString(),
      ...(details !== undefined && { details }),
    };

    response.status(status).json({ error: payload });
  }

  private mapStatusToCode(status: number): string {
    return AppExceptionFilter.STATUS_CODE_MAP[status] ?? 'UNKNOWN_ERROR';
  }
}

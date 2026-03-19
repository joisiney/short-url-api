import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { RequestContext } from './request-context.interceptor';
import { redactForLog } from '../../utils/redact.util';
import type { LoggerConfig } from '../../../config/logger.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly loggerConfig?: LoggerConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = request.requestId || '';
    const correlationId = request.correlationId || '';
    const traceId = request.traceId;
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'] || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - now;
          const payload: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            level: 'info',
            context: 'HTTP',
            message: 'Request completed',
            requestId,
            correlationId,
            method,
            path: url,
            statusCode: response.statusCode,
            durationMs,
            userAgent,
          };
          if (traceId) payload.traceId = traceId;
          const redacted = redactForLog(
            payload,
            this.loggerConfig?.redactSensitive ?? false,
          );
          this.logger.log(JSON.stringify(redacted));
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - now;
          const status =
            error && typeof error === 'object' && 'status' in error
              ? Number((error as { status: number }).status)
              : 500;
          const message =
            error instanceof Error ? error.message : String(error);
          const payload: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            level: 'error',
            context: 'HTTP',
            message: 'Request failed',
            requestId,
            correlationId,
            method,
            path: url,
            statusCode: status,
            durationMs,
            userAgent,
            errorMessage: message,
          };
          if (traceId) payload.traceId = traceId;
          const redacted = redactForLog(
            payload,
            this.loggerConfig?.redactSensitive ?? false,
          );
          this.logger.error(JSON.stringify(redacted));
        },
      }),
    );
  }
}

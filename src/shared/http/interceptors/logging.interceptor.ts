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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = request.requestId || '';
    const correlationId = request.correlationId || '';
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const delay = Date.now() - now;
          this.logger.log(
            `[Req: ${requestId}] [Corr: ${correlationId}] ${method} ${url} ${response.statusCode} - ${delay}ms`,
          );
        },
        error: (error: unknown) => {
          const delay = Date.now() - now;
          const status =
            error && typeof error === 'object' && 'status' in error
              ? Number(error.status)
              : 500;
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `[Req: ${requestId}] [Corr: ${correlationId}] ${method} ${url} ${status} - ${delay}ms - ${message}`,
          );
        },
      }),
    );
  }
}

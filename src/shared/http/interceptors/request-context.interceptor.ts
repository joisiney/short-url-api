import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { trace } from '@opentelemetry/api';

const W3C_TRACE_ID_HEX_LENGTH = 32;

export interface RequestContext extends Request {
  requestId: string;
  correlationId: string;
  traceId?: string;
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const response = context.switchToHttp().getResponse<Response>();

    request.requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    request.correlationId =
      (request.headers['x-correlation-id'] as string) || request.requestId;

    const span = trace.getActiveSpan();
    if (span) {
      request.traceId = span.spanContext().traceId;
    } else {
      const traceparent = request.headers['traceparent'] as string | undefined;
      if (traceparent) {
        const parts = traceparent.split('-');
        const traceIdPart = parts[1];
        if (
          parts.length >= 2 &&
          traceIdPart?.length === W3C_TRACE_ID_HEX_LENGTH
        ) {
          request.traceId = traceIdPart;
        }
      }
    }
    if (request.traceId) {
      response.setHeader('X-Trace-Id', request.traceId);
    }
    response.setHeader('X-Request-Id', request.requestId);

    return next.handle();
  }
}

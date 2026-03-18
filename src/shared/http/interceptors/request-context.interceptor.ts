import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { randomUUID } from 'crypto';

export interface RequestContext extends Request {
  requestId: string;
  correlationId: string;
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestContext>();

    request.requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    request.correlationId =
      (request.headers['x-correlation-id'] as string) || request.requestId;

    return next.handle();
  }
}

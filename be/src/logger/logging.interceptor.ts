import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse();

    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string) ?? crypto.randomUUID();
    req.id = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const method = req.method;
    const url = req.originalUrl ?? req.url;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = res.statusCode;
          const durationMs = Date.now() - start;
          this.logger.fatal(
            {
              requestId,
              method,
              url,
              statusCode,
              durationMs,
            },
            `${method} ${url} ${statusCode} ${durationMs}ms`,
          );
        },
        error: () => {
          const statusCode = res.statusCode || 500;
          const durationMs = Date.now() - start;
          this.logger.warn(
            {
              requestId,
              method,
              url,
              statusCode,
              durationMs,
            },
            `${method} ${url} ${statusCode} ${durationMs}ms`,
          );
        },
      }),
    );
  }
}

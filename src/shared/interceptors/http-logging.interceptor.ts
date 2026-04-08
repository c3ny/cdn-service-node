import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logger/app-logger.service.js';

/**
 * Interceptor HTTP que registra os dados de cada request e response.
 *
 * Loga no request:
 *  - requestId, method, path, params, query, body, origin, userAgent, ip
 *
 * Loga no response:
 *  - requestId, statusCode, durationMs
 *
 * Também captura erros de resposta (ex: exceções lançadas nos controllers).
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    const existingId = request.headers['x-request-id'];
    const requestId =
      typeof existingId === 'string' && existingId.trim().length > 0
        ? existingId
        : randomUUID();

    response.setHeader('X-Request-Id', requestId);

    this.logger.info('Incoming request', {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      params: request.params,
      query: request.query,
      body: request.body as Record<string, unknown>,
      origin: request.headers.origin,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info('Request completed', {
            requestId,
            method: request.method,
            path: request.originalUrl ?? request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          });
        },
        error: (error: unknown) => {
          this.logger.error('Request error', {
            requestId,
            method: request.method,
            path: request.originalUrl ?? request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      }),
    );
  }
}

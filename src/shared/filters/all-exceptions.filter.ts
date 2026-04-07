import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service.js';

/**
 * Filtro global que captura qualquer exceção não tratada na aplicação.
 *
 * Garante que todos os erros — inclusive os que não são HttpException —
 * sejam registrados no BetterStack com contexto completo antes de
 * retornar uma resposta padronizada ao cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as string | { message: string })
        : 'Internal server error';

    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);

    const stack =
      exception instanceof Error ? exception.stack : undefined;

    const requestId = response.getHeader('X-Request-Id') as string | undefined;

    this.logger.error('Unhandled exception', {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: status,
      error: errorMessage,
      stack,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    });
  }
}

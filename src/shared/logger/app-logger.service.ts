import { Injectable } from '@nestjs/common';
import pino, { Logger } from 'pino';

/**
 * Serviço genérico de logging estruturado com envio para o BetterStack.
 *
 * Comportamento por ambiente:
 *  - development: saída colorida no terminal via pino-pretty
 *  - production + BETTERSTACK_SOURCE_TOKEN: envia logs para o BetterStack
 *  - production sem token: saída JSON no stdout (fallback)
 */
@Injectable()
export class AppLoggerService {
  private readonly logger: Logger;

  constructor(private readonly serviceName: string) {
    this.logger = this.createLogger(serviceName);
  }

  private createLogger(serviceName: string): Logger {
    const isDev = process.env.NODE_ENV !== 'production';
    const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN;

    const baseOptions: pino.LoggerOptions = {
      level: process.env.LOG_LEVEL ?? 'info',
      base: { service: serviceName },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          'body.password',
          'body.confirmPassword',
          'body.token',
          'body.newPassword',
          'body.oldPassword',
          'headers.authorization',
          'headers.cookie',
        ],
        censor: '[REDACTED]',
      },
    };

    if (isDev) {
      return pino(
        baseOptions,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }),
      );
    }

    if (sourceToken) {
      return pino(
        baseOptions,
        pino.transport({
          target: '@logtail/pino',
          options: { sourceToken },
        }),
      );
    }

    return pino(baseOptions);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta ?? {}, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta ?? {}, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(meta ?? {}, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta ?? {}, message);
  }
}

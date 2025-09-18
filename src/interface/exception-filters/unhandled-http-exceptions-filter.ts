import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';

@Catch()
export class UnhandledHttpExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(LoggerPort) private logger: LoggerPort) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (exception instanceof HttpException) {
      // Re-throw or do nothing here to let Nest handle it normally
      throw exception;
    }
    // From here, only unexpected exceptions reach

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      (exception as any)?.message?.toString() || 'Unexpected error';

    this.logger.error(message, (exception as any)?.stack, request.url);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

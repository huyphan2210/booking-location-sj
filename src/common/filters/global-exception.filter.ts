import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
  method: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request?.url ?? '';
    const method = request?.method ?? '';

    let statusCode: number;
    let message: string | string[];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse() as
        | { message?: string | string[] }
        | string;
      if (typeof res === 'string') {
        message = res;
      } else {
        message = res.message ?? exception.message;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const isProduction = process.env.NODE_ENV === 'production';
      message = isProduction ? 'Internal server error' : exception.message;

      this.logger.error(
        `Unhandled exception on ${method} ${request?.url ?? ''}`,
        exception.stack ?? undefined,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      this.logger.error(
        `Unhandled non-Error exception on ${method} ${request?.url ?? ''}`,
        undefined,
      );
    }

    const body: ErrorResponse = {
      statusCode,
      message,
      timestamp,
      path,
      method,
    };

    response.status(statusCode).json(body);
  }
}

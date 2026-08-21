import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string | string[]) ?? message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        `PrismaKnownError [${exception.code}] on ${request.method} ${request.url}: ${exception.message}`,
      );
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A record with this value already exists';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Related record not found';
          break;
        case 'P1017':
        case 'P1001':
        case 'P1011':
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Database connection reset. Please try again.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database error';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(
        `PrismaValidationError on ${request.method} ${request.url}: ${exception.message}`,
      );
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const isValidationArray = Array.isArray(message);
    response.status(status).json({
      statusCode: status,
      message: isValidationArray ? 'Validation failed' : message,
      ...(isValidationArray ? { errors: message } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

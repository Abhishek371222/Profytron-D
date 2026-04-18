import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const responseBody = {
      success: false,
      statusCode: httpStatus,
      error:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
      code: (message as any).error || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (httpStatus >= 500) {
      this.logger.error(
        `[5xx] ${JSON.stringify(responseBody)}`,
        (exception as any).stack,
      );
    }

    // Hide stack trace and internal details in production
    if (process.env.NODE_ENV === 'production' && httpStatus === 500) {
      responseBody.error = 'Internal server error';
    }

    // Passport can add WWW-Authenticate on 401, which triggers browser auth popups.
    // Remove it so auth failures are handled by app UI instead of native prompt dialogs.
    if (httpStatus === HttpStatus.UNAUTHORIZED) {
      try {
        response.removeHeader('WWW-Authenticate');
        response.removeHeader('www-authenticate');
      } catch {
        // Ignore header removal issues and continue sending structured error response.
      }
    }

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}

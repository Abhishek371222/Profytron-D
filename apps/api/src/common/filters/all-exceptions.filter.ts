import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  isOAuthCallbackPath,
  oauthFailureRedirectUrl,
} from '../utils/oauth-callback.util';
import type { Request } from 'express';

function normalizeErrorPayload(message: unknown): {
  error: string | string[] | Record<string, unknown>;
  code: string;
  details?: unknown;
} {
  if (typeof message === 'string') {
    return { error: message, code: 'ERROR' };
  }
  if (message && typeof message === 'object') {
    const body = message as Record<string, unknown>;
    // class-validator ValidationPipe shape
    if (Array.isArray(body.message)) {
      return {
        error: body.message as string[],
        code: String(body.error ?? 'VALIDATION_ERROR'),
        details: body.message,
      };
    }
    if (typeof body.message === 'string') {
      return {
        error: body.message,
        code: String(body.code ?? body.error ?? 'ERROR'),
      };
    }
    return {
      error: (body.message as Record<string, unknown>) ?? body,
      code: String(body.code ?? body.error ?? 'ERROR'),
    };
  }
  return { error: 'Internal server error', code: 'INTERNAL_ERROR' };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();
    const requestUrl = httpAdapter.getRequestUrl(request);
    const requestId = request?.requestId;
    const correlationId = request?.correlationId ?? requestId;

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const normalized = normalizeErrorPayload(raw);

    const responseBody: Record<string, unknown> = {
      success: false,
      statusCode: httpStatus,
      error: normalized.error,
      code: normalized.code,
      timestamp: new Date().toISOString(),
      path: requestUrl,
      requestId: requestId ?? null,
      correlationId: correlationId ?? null,
    };
    if (normalized.details && process.env.NODE_ENV !== 'production') {
      responseBody.details = normalized.details;
    }

    if (isOAuthCallbackPath(requestUrl)) {
      const redirectUrl = oauthFailureRedirectUrl(exception);
      this.logger.warn(
        `OAuth callback failed, redirecting to login: ${redirectUrl}`,
        (exception as Error)?.stack,
      );
      return response.redirect(302, redirectUrl);
    }

    if (httpStatus >= 500) {
      this.logger.error(
        `[5xx] requestId=${requestId ?? 'n/a'} ${JSON.stringify(responseBody)}`,
        (exception as Error)?.stack,
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `[${httpStatus}] requestId=${requestId ?? 'n/a'} path=${requestUrl} code=${normalized.code}`,
      );
    }

    if (process.env.NODE_ENV === 'production' && httpStatus === 500) {
      responseBody.error = 'Internal server error';
      responseBody.code = 'INTERNAL_ERROR';
      delete responseBody.details;
    }

    if (httpStatus === 401) {
      try {
        response.removeHeader('WWW-Authenticate');
        response.removeHeader('www-authenticate');
      } catch {
        /* ignore */
      }
    }

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}

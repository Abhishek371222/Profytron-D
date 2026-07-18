import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';
import * as Sentry from '@sentry/nestjs';

const logger = new Logger('SentryInterceptor');

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof HttpException && error.getStatus() < 500) {
          return throwError(() => error);
        }

        try {
          if (Sentry?.captureException) {
            const req = context.switchToHttp().getRequest<Request>();
            Sentry.withScope((scope: any) => {
              scope.setTag('route', req?.route?.path ?? req?.url);
              scope.setTag('method', req?.method);
              scope.setContext('request', {
                url: req?.url,
                method: req?.method,
                headers: {
                  'user-agent': req?.headers?.['user-agent'],
                  'content-type': req?.headers?.['content-type'],
                },
              });
              Sentry.captureException(error);
            });
          }
        } catch {
          logger.warn('Sentry not available — error not reported remotely');
        }

        return throwError(() => error);
      }),
    );
  }
}

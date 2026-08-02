import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    this.metrics.increment('http_requests_total');
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          this.metrics.increment('http_responses_ok_total');
          void start;
        },
        error: () => {
          this.metrics.increment('http_responses_error_total');
        },
      }),
    );
  }
}

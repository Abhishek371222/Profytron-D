import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (
          Buffer.isBuffer(data) ||
          data instanceof StreamableFile ||
          data instanceof Uint8Array
        ) {
          return data as T;
        }
        // Skip re-wrap when handler already returned the envelope (Phase 2)
        if (
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          'success' in (data as object) &&
          'data' in (data as object) &&
          'timestamp' in (data as object)
        ) {
          return data as Response<T>;
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

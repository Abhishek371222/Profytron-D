import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Removable API audit timing interceptor.
 * Active ONLY when process.env.API_AUDIT_TIMING === '1'.
 * Does not alter response bodies.
 */
@Injectable()
export class AuditTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (process.env.API_AUDIT_TIMING !== '1') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<{ method?: string; url?: string }>();
    const t0 = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, t0, true),
        error: () => this.record(req, t0, false),
      }),
    );
  }

  private record(
    req: { method?: string; url?: string },
    t0: number,
    ok: boolean,
  ) {
    try {
      const outDir =
        process.env.API_AUDIT_OUT ||
        path.join(process.cwd(), '../../docs/api-audit/phase1/data');
      const file = path.join(outDir, 'timing-interceptor.jsonl');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const line = JSON.stringify({
        at: new Date().toISOString(),
        method: req?.method,
        url: req?.url,
        ms: Date.now() - t0,
        ok,
      });
      fs.appendFileSync(file, line + '\n');
    } catch {
      /* never break request path */
    }
  }
}

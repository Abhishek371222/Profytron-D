import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Paths after global prefix `v1` may appear as /v1/... or without depending on adapter timing. */
const AUDIT_PREFIXES = [
  '/v1/wallet',
  '/v1/admin',
  '/v1/marketplace',
  '/v1/ai',
  '/v1/risk',
  '/v1/subscriptions',
  '/v1/payments',
  '/wallet',
  '/admin',
  '/marketplace',
  '/ai',
  '/risk',
  '/subscriptions',
  '/payments',
  '/api/wallet',
  '/api/admin',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = req;
    const pathOnly = String(url ?? '').split('?')[0];

    const shouldAudit =
      AUDIT_METHODS.has(method) &&
      AUDIT_PREFIXES.some((prefix) => pathOnly.startsWith(prefix));

    if (!shouldAudit) return next.handle();

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const userId: string | null =
            req.user?.id ?? req.user?.userId ?? null;
          const normalized = pathOnly
            .replace(/\/v1/, '')
            .replace(/\/[a-f0-9-]{36}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\//g, '_')
            .replace(/^_/, '')
            .toUpperCase()
            .slice(0, 120);

          this.prisma.auditLog
            .create({
              data: {
                eventType: `HTTP_${method}_${normalized || 'ROOT'}`,
                userId,
                detailsJson: {
                  path: pathOnly,
                  method,
                  durationMs: Date.now() - start,
                  requestId: req.requestId ?? null,
                  correlationId: req.correlationId ?? null,
                },
                triggeredBy: userId ?? 'ANONYMOUS',
                ipAddress: ip,
                userAgent: (headers['user-agent'] as string) ?? null,
              },
            })
            .catch((err: Error) =>
              this.logger.error(`Audit log write failed: ${err.message}`),
            );
        },
      }),
    );
  }
}

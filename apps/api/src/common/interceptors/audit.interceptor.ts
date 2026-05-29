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
const AUDIT_PREFIXES = ['/wallet', '/admin', '/marketplace', '/ai', '/risk'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = req;

    const shouldAudit =
      AUDIT_METHODS.has(method) &&
      AUDIT_PREFIXES.some(
        (prefix) =>
          url.startsWith(`/api${prefix}`) || url.startsWith(prefix),
      );

    if (!shouldAudit) return next.handle();

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const userId: string | null = req.user?.id ?? null;
          const normalized = url
            .replace(/\/[a-f0-9-]{36}/g, '/:id')
            .replace(/\//g, '_')
            .replace(/^_/, '')
            .toUpperCase();

          this.prisma.auditLog
            .create({
              data: {
                eventType: `HTTP_${method}_${normalized}`,
                userId,
                detailsJson: { path: url.split('?')[0], method, durationMs: Date.now() - start },
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

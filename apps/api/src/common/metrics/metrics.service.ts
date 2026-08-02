import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from '@nestjs/common';

/** Lightweight in-process counters for /metrics (no prom-client dependency). */
@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, number>();
  private readonly startedAt = Date.now();

  private shuttingDown = false;

  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  markShuttingDown(): void {
    this.shuttingDown = true;
    this.logger.log('Application shutdown flag set');
  }

  increment(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  snapshot(): Record<string, number | string | boolean> {
    const out: Record<string, number | string | boolean> = {
      uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000),
      process_uptime_seconds: Math.floor(process.uptime()),
      shutting_down: this.shuttingDown,
      memory_rss_bytes: process.memoryUsage().rss,
      memory_heap_used_bytes: process.memoryUsage().heapUsed,
    };
    for (const [k, v] of this.counters) {
      out[`counter_${k}`] = v;
    }
    return out;
  }

  /** Prometheus text exposition (subset). */
  toPrometheus(): string {
    const lines: string[] = [
      '# HELP profytron_uptime_seconds Process uptime after MetricsService start',
      '# TYPE profytron_uptime_seconds gauge',
      `profytron_uptime_seconds ${Math.floor((Date.now() - this.startedAt) / 1000)}`,
      '# HELP profytron_process_rss_bytes Resident set size',
      '# TYPE profytron_process_rss_bytes gauge',
      `profytron_process_rss_bytes ${process.memoryUsage().rss}`,
    ];
    for (const [k, v] of this.counters) {
      const metric = `profytron_${k.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      lines.push(`# TYPE ${metric} counter`);
      lines.push(`${metric} ${v}`);
    }
    lines.push(
      `profytron_shutting_down ${this.shuttingDown ? 1 : 0}`,
    );
    return `${lines.join('\n')}\n`;
  }

  onModuleDestroy(): void {
    this.markShuttingDown();
  }
}

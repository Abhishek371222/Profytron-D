# Profytron Monitoring & Observability Setup

This guide provides complete setup instructions for monitoring, logging, and observing the Profytron platform in development and production environments.

## Table of Contents

1. [Overview](#overview)
2. [Logging Framework](#logging-framework)
3. [Error Tracking](#error-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [Health Checks](#health-checks)
6. [Dashboards](#dashboards)
7. [Alerts & Notifications](#alerts--notifications)
8. [CI/CD Integration](#cicd-integration)

---

## Overview

Profytron's observability stack includes:

- **Winston**: Structured logging to console and files
- **Sentry**: Error tracking and performance monitoring
- **Redis**: Health check storage and session monitoring
- **Custom Metrics**: Trading P&L, execution latency, API response times
- **Winston Transports**: File rotation, JSON formatting, environment-specific levels
- **OpenTelemetry Ready**: Foundation for distributed tracing (optional enhancement)

---

## Logging Framework

### Winston Configuration

The API uses Winston for structured logging. The configuration is located at `apps/api/src/config/winston.config.ts`.

#### Log Levels

```
error   -> Production & Development (errors always logged)
warn    -> Production & Development
info    -> Development, Limited in Production
debug   -> Development only
```

#### Log Transport Configuration

**Development**:
```typescript
// Console output with colors
new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  )
})
```

**Production**:
```typescript
// File rotation + JSON format
new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: winston.format.json()
}),
new winston.transports.File({
  filename: 'logs/combined.log',
  format: winston.format.json()
})
```

### Usage in NestJS

```typescript
import { LoggerService } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {}

  async processStrategy(id: string) {
    this.logger.log(`Processing strategy ${id}`);
    
    try {
      // ... business logic
    } catch (error) {
      this.logger.error(`Failed to process strategy: ${error.message}`, error.stack);
    }
  }
}
```

### Log Files

Logs are stored in `apps/api/logs/`:

- **error.log**: All errors and warnings
- **combined.log**: All logs (info, warn, error, debug)
- **Rotation**: Daily rotation with 14-day retention

---

## Error Tracking

### Sentry Integration

Sentry captures all unhandled exceptions, performance issues, and custom errors.

#### Setup

1. **Install Sentry SDK**:
```bash
pnpm --filter api add @sentry/node
```

2. **Initialize in `apps/api/src/main.ts`**:
```typescript
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0, // Adjust for production (0.1 = 10%)
    attachStacktrace: true,
    maxBreadcrumbs: 50
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

3. **Add to `.env`**:
```env
SENTRY_DSN=https://<key>@sentry.io/<project>
```

#### Custom Error Reporting

```typescript
import * as Sentry from '@sentry/node';

try {
  // ... trading logic
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'trading',
      strategyId: id
    },
    contexts: {
      trade: {
        entry: entryPrice,
        exit: exitPrice,
        quantity: qty
      }
    }
  });
}
```

#### Performance Monitoring

```typescript
const transaction = Sentry.startTransaction({
  op: 'db.query',
  name: 'fetch_user_strategies'
});

// ... business logic

transaction.finish();
```

---

## Performance Monitoring

### Key Metrics to Monitor

#### API Response Times
- Target: < 200ms for 95th percentile
- Alert threshold: > 500ms for production

```typescript
// Middleware to track response times
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${req.method} ${req.path} - ${duration}ms`);
      
      if (duration > 500) {
        this.logger.warn(`Slow request: ${req.path} took ${duration}ms`);
      }
    });
    next();
  }
}
```

#### Database Query Performance
- Track slow queries (> 100ms)
- Monitor connection pool status

```typescript
// In Prisma middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  if (duration > 100) {
    console.warn(`Slow query (${duration}ms): ${params.model}.${params.action}`);
  }
  return result;
});
```

#### Trading Execution Latency
- Target: < 50ms from signal to trade execution
- Alert threshold: > 200ms

```typescript
async executeStrategy(strategy: Strategy) {
  const start = Date.now();
  
  // Execute trade
  const trade = await this.tradingGateway.execute(strategy);
  
  const latency = Date.now() - start;
  this.logger.log(`Trade executed in ${latency}ms`);
  
  Sentry.captureMessage(`Trade latency: ${latency}ms`, 'info', {
    tags: { strategyId: strategy.id }
  });
}
```

#### Memory & CPU Usage
- Monitor with Node process monitors
- Alert if > 80% memory usage

```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  this.logger.debug(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  this.logger.debug(`CPU: ${cpuUsage.user / 1000}ms user, ${cpuUsage.system / 1000}ms system`);
}, 60000);
```

---

## Health Checks

### API Health Endpoint

Enable Terminus health checks in the API:

```bash
pnpm --filter api add @nestjs/terminus
```

**Implementation** in `apps/api/src/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator, RedisHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', { prisma: this.prisma }),
      () => this.redisHealth.pingCheck('redis', { key: 'health' })
    ]);
  }
}
```

**Response** (all healthy):
```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```

### Service Health Checks

**Python Services** (AI & Backtest):

```python
# services/ai/main.py
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ai",
        "timestamp": datetime.now().isoformat()
    }

# services/backtest/main.py
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "backtest",
        "timestamp": datetime.now().isoformat()
    }
```

### Monitoring Service Health

```bash
# Check API
curl http://localhost:4000/health

# Check AI Service
curl http://localhost:8001/health

# Check Backtest Service
curl http://localhost:8002/health

# All services should return:
# {"status":"ok","service":"<name>","timestamp":"..."}
```

---

## Dashboards

### Grafana Setup (Optional)

For production monitoring, set up Grafana with Prometheus as data source.

**Docker Compose addition**:
```yaml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana-storage:/var/lib/grafana

prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Key Dashboard Panels

1. **API Response Times** (histogram by endpoint)
2. **Error Rate** (HTTP 4xx/5xx per minute)
3. **Database Connection Pool** (active/idle connections)
4. **Redis Memory Usage** (used memory trend)
5. **Trading Signals Processed** (per hour)
6. **Trade Execution Latency** (p50/p95/p99)
7. **Stripe Payment Success Rate** (per hour)

---

## Alerts & Notifications

### Alert Rules

Create alerts for these critical thresholds:

| Metric | Threshold | Action |
|--------|-----------|--------|
| API Response Time (p95) | > 500ms | Page on-call engineer |
| Error Rate | > 1% | Notify team |
| Database Connections | > 90% of pool | Auto-scale or page |
| Redis Memory | > 80% | Flush cache, investigate |
| Trade Execution Latency | > 200ms | Notify trading team |
| Stripe Webhook Failures | > 5 in 5 min | Page payment team |
| Disk Space | < 10% free | Notify infrastructure |

### Notification Channels

1. **Slack Integration** (for Sentry & Prometheus)
2. **Email** (for critical alerts)
3. **PagerDuty** (for on-call escalation)
4. **SMS** (for trading-critical alerts)

**Slack Configuration** in Sentry:
- Settings → Integrations → Slack
- Map error levels to Slack channels:
  - `error` → #profytron-alerts
  - `warning` → #profytron-warnings

---

## CI/CD Integration

### GitHub Actions Workflow

Add monitoring checks to your CI/CD pipeline:

```yaml
name: Performance & Health Checks

on: [pull_request]

jobs:
  test-and-monitor:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests with coverage
        run: pnpm --filter api test --coverage
      
      - name: Check coverage thresholds
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage below 70%: $COVERAGE%"
            exit 1
          fi
      
      - name: Build API
        run: pnpm --filter api build
      
      - name: Health check simulation
        run: |
          pnpm --filter api start &
          sleep 5
          curl http://localhost:4000/health || exit 1
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
```

---

## Monitoring Checklist

Use this checklist to ensure all monitoring is in place:

- [ ] Winston logging configured with file rotation
- [ ] Sentry project created and DSN added to `.env`
- [ ] Health check endpoints working for all services
- [ ] Performance middleware tracking API response times
- [ ] Database query monitoring enabled (slow query logs)
- [ ] Trading latency monitoring implemented
- [ ] Error handling middleware configured
- [ ] Slack notifications configured for Sentry alerts
- [ ] Grafana dashboard set up (production only)
- [ ] Prometheus scraping targets configured
- [ ] Alert rules created for critical metrics
- [ ] Coverage reports generated in CI/CD
- [ ] Performance budget tests in CI/CD
- [ ] Documentation of on-call procedures created

---

## Troubleshooting

### High Memory Usage
```bash
# Check Node process memory
ps aux | grep node

# Enable heap snapshots
node --inspect apps/api/dist/main.js

# Analyze in Chrome DevTools chrome://inspect
```

### Slow Database Queries
```typescript
// Enable Prisma logging
// In .env:
DATABASE_LOG=query,info,warn,error

// Or in code:
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check memory
redis-cli info memory

# Monitor commands
redis-cli monitor
```

### Lost Error Context in Logs
- Ensure error middleware is registered BEFORE routes
- Use `@UseFilters()` decorators for granular error handling
- Verify Sentry DSN is set in production

---

## Performance Targets

| Component | Metric | Target | Alert |
|-----------|--------|--------|-------|
| API | p95 response time | < 200ms | > 500ms |
| API | error rate | < 0.5% | > 1% |
| Database | query time | < 50ms | > 100ms |
| Cache | hit rate | > 80% | < 60% |
| Trading | execution latency | < 50ms | > 200ms |
| Stripe | webhook processing | < 100ms | > 500ms |
| Frontend | page load time | < 3s | > 5s |

---

## Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Sentry Documentation](https://docs.sentry.io/product/performance/performance-monitoring/)
- [NestJS Monitoring](https://docs.nestjs.com/techniques/logging)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [OpenTelemetry](https://opentelemetry.io/) (optional next step for distributed tracing)

---

**Last Updated**: 2025-01-14
**Status**: Ready for Development & Production Deployment

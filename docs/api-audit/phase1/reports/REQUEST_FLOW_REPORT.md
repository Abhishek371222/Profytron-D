# REQUEST_FLOW_REPORT — API Audit Phase 1

## Canonical Nest pipeline

```mermaid
flowchart TD
  Client[Client] --> HTTP[HTTP /v1]
  HTTP --> GuardJwt[JwtAuthGuard]
  GuardJwt --> GuardThr[AppThrottlerGuard]
  GuardThr --> Pipe[ValidationPipe]
  Pipe --> Ctrl[Controller]
  Ctrl --> Svc[Service]
  Svc --> Prisma[PrismaService]
  Prisma --> DB[(Postgres Neon)]
  Svc --> Redis[(Redis)]
  Ctrl --> Tx[TransformInterceptor]
  Tx --> Client
```

See also `diagrams/request-flow.md`.

## Hot paths (by latency p50)

### 1. `GET /v1/subscriptions/plans` (359.9 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as subscriptions service
  participant P as Prisma
  C->>G: GET /v1/subscriptions/plans
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 2. `GET /v1/copy/masters` (310.5 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as copy service
  participant P as Prisma
  C->>G: GET /v1/copy/masters
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 3. `GET /health` (304.1 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as app service
  participant P as Prisma
  C->>G: GET /health
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 4. `GET /v1/market/ohlc` (6.5 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as market service
  participant P as Prisma
  C->>G: GET /v1/market/ohlc
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 5. `GET /v1/market/quote` (5.5 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as market service
  participant P as Prisma
  C->>G: GET /v1/market/quote
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 6. `GET /v1/leaderboard/monthly` (4.6 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as leaderboard service
  participant P as Prisma
  C->>G: GET /v1/leaderboard/monthly
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 7. `GET /v1/leaderboard/strategies` (3 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as leaderboard service
  participant P as Prisma
  C->>G: GET /v1/leaderboard/strategies
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

### 8. `GET /v1/market/news` (3 ms)

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as market service
  participant P as Prisma
  C->>G: GET /v1/market/news
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
```

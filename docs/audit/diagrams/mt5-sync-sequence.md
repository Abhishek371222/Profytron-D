# MT5 / MetaApi synchronization sequence (measured)

```mermaid
sequenceDiagram
  participant MA as MetaApiLondon
  participant Poll as NestPollers
  participant Ad as MetaTraderAdapter
  participant Redis as Redis
  participant DB as NeonPostgres
  participant API as NestAPI
  participant RQ as ReactQuery
  participant UI as DashboardCards

  Note over MA,UI: No webhook stage exists today

  Poll->>MA: REST positions/account (every 3s-60s)
  Note right of MA: account_information p50 ~700ms<br/>positions p50 ~650ms
  Poll->>Redis: mastersync snapshots TTL 24h
  Poll->>DB: upsert Trade / EquitySnapshot

  UI->>RQ: mount / 60s refetch
  RQ->>API: GET portfolio / open / broker
  API->>Redis: cache lookup (hit ~10ms)
  alt cache miss
    API->>DB: Prisma queries
    Note right of DB: SQL less than 1ms<br/>RTT 200-500ms+ per round trip
    API->>Ad: getLiveEquity
    Ad->>MA: REST if equity cache miss (30s TTL)
  end
  API-->>RQ: JSON envelope
  RQ-->>UI: commit widgets
  Note over UI: framer-motion present on chrome

  Poll-->>API: socket trade_* / account_equity
  API-->>RQ: invalidate debounce 400ms
  RQ->>API: refetch
```

## Arrow latency table

| Arrow | Measured |
|-------|----------|
| MetaApi account_information | 568–1780 ms |
| MetaApi positions | 628–1453 ms |
| MetaApi list accounts | ~896 ms |
| Adapter equity memory hit | ≪ MetaApi (30s TTL) |
| Prisma SQL execution | <1 ms (EXPLAIN) |
| Prisma wall via network | 0.2–5 s depending on round-trips |
| Redis analytics hit | ~3–10 ms API total |
| API portfolio cold | up to 1351 ms |
| React Query poll interval | 60_000 ms |
| Socket invalidate debounce | 400 ms |
| Health Redis timeout floor | 1500 ms |

# Error Recovery & Progressive Enhancement

| Failure | Recovery |
|---------|----------|
| Redis unavailable | Serve L1/L2 stale; retry backoff; toast only if prolonged |
| MetaApi timeout | Keep last equity; `syncStatus=degraded`; Medium-priority retry |
| DB timeout | Stale cache; retry; never blank cards after first paint |
| WebSocket disconnect | Fall back to Medium poll; resume on reconnect |
| AI service unavailable | Last messages + offline banner; rest of app unaffected |
| Reduced motion | Static UI; full data access |
| Slow JS | Hydrate L2 first; progressive widgets |

**Principle:** Users never lose access to information already on screen.

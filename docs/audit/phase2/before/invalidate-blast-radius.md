# invalidateAccountQueries blast radius (pre-Phase-2)

Source: `apps/web/src/lib/queries/account-queries.ts` → `ACCOUNT_QUERY_KEYS`

On any trade/account event, the following query roots are invalidated together:

- portfolio
- wallet-balance
- open-trades
- trade-history
- dashboard-risk
- broker-accounts
- broker-equity
- broker-account-info
- broker-live-snapshot
- my-strategies
- activation-progress

`useDashboardRealtime` also debounces (400ms) and may call `invalidateAccountQueries` for trade_* events, causing dashboard-wide refetch storms.

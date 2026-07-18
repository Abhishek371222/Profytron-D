# INTEGRITY_REPORT — Phase 1

## Orphan checks (LEFT JOIN counts)

| Child | Column | Parent | Orphans | Wall ms |
|-------|--------|--------|--------:|--------:|
| Trade | userId | User | **0** | 608.4 |
| Trade | brokerAccountId | BrokerAccount | **0** | 619.3 |
| BrokerAccount | userId | User | **0** | 627.8 |
| EquitySnapshot | brokerAccountId | BrokerAccount | **0** | 640.3 |
| UserSession | userId | User | **0** | 629.9 |
| WalletTransaction | userId | User | **0** | 644.2 |
| Payment | userId | User | **0** | 646.2 |
| UserSubscription | userId | User | **0** | 627.2 |
| UserStrategySubscription | userId | User | **0** | 623.6 |
| AccountSnapshot | brokerAccountId | BrokerAccount | **0** | 608.8 |

## Duplicate / consistency checks

- **dupe_trade_broker_ticket** (632.1 ms): `{"count":0,"sample":[]}`
- **inconsistent_trade_timestamps** (617.9 ms): `{"bad":0}`

## Broken FK / enums

- Live FKs are database-enforced; Prisma enums map to Postgres enums — invalid enum inserts fail at write time.
- Phase 1 did **not** mutate data to probe failures.

## Missing required relationships

Nullable FKs exist by design (e.g. optional strategy on trade). Inventory: `data/schema-inventory.json` field `optional` flags.

## Inconsistent timestamps

See `inconsistent_trade_timestamps` check above (`closedAt < openedAt`).

## Verdict

**No orphan rows** on checked FK paths in this sample suite.

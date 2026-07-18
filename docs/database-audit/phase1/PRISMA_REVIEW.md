# PRISMA_REVIEW — Phase 1

## Organization

| Topic | Observation |
|-------|-------------|
| Single schema file | `apps/api/prisma/schema.prisma` (~large monolithic) |
| Models | **80** |
| Enums | **42** |
| Datasource | Postgresql + `url` + `directUrl` (Neon pooler pattern) |
| Generator | `prisma-client-js` + Alpine musl OpenSSL 3 binary target |

## Naming

- PascalCase models mapping 1:1 to quoted Postgres tables (`"Trade"`, `"User"`).
- FKs typically `userId`, `brokerAccountId` — consistent.

## Relations & indexes

- 113 `@relation` sites; cascades sparsely explicit.
- 167 `@@index` — incremental migrations added analytics/copy/snapshot indexes through 2026-06/07.

## Composite keys

- Mostly single `id` UUID/cuid PKs; composite uniqueness via `@@unique` (e.g. trade ticket per account).

## Generated SQL / migrations

| Metric | Value |
|--------|------:|
| Migration folders | 41 |
| Recent snapshot work | `20260718120000` … `20260718130000` AccountSnapshot expansion |

### Migration list

- `20260410211446_init`
- `20260415103000_schema_drift_guards`
- `20260524130000_full_schema_sync`
- `20260605030000_strategy_master_broker`
- `20260605040000_copyfactory_strategy_id`
- `20260614000000_growth_activation`
- `20260615000000_ai_workforce`
- `20260616000000_performance_indexes`
- `20260616010000_broker_initial_equity`
- `20260616990000_add_broker_is_master_source`
- `20260617000000_analytics_trade_indexes`
- `20260618000000_copy_trading_domain`
- `20260618120000_trade_time_indexes`
- `20260622090000_missing_fk_indexes`
- `20260709100000_enterprise_bot_platform`
- `20260709190000_add_business_subscription_tier`
- `20260709194500_add_affiliate_funnel_events`
- `20260710100000_creator_bot_review_pipeline`
- `20260710140000_copy_bridge_orders`
- `20260710990000_add_payment_support_enums`
- `20260710995000_backfill_platform_subscription_tables`
- `20260711000000_add_payment_invoice_support_ticket_tables`
- `20260712013000_wallet_billing_payment_fields`
- `20260712020000_normalize_billing_id_support_link`
- `20260712030000_alpha_coach`
- `20260712040000_coach_escalation_sla`
- `20260713000000_add_strategy_asset_class_timeframe`
- `20260713000100_extend_asset_class_timeframe_enums`
- `20260713000150_backfill_ai_risk_policy`
- `20260713000200_add_daily_win_target`
- `20260713000300_add_profit_share_billing`
- `20260713000350_backfill_schema_drift`
- `20260713000400_add_gcp_vps_provider`
- `20260714120000_add_trade_strategy_status_index`
- `20260716120000_broker_last_known_and_protect_initial`
- `20260716130000_equity_snapshot_and_trade_ticket_unique`
- `20260717120000_add_tutorial_progress`
- `20260717130000_add_broker_account_share`
- `20260718120000_add_account_snapshot`
- `20260718123000_full_metaapi_snapshot_pipeline`
- `20260718130000_account_snapshot_full_expansion`

## Migration risks (measure)

1. **Schema drift history** — multiple `backfill_*` / `schema_drift` migrations imply past prod drift pain.  
2. **Large snapshot tables** — rapid successive AccountSnapshot migrations increase rollback complexity.  
3. **Enum extensions** — `ALTER TYPE` migrations need careful expand/contract.  
4. **No Phase 1 migrate** — inventory only.

## Redundant fields (candidates — not proven unused)

Candidates for Phase 2 review (do not drop now):

- Overlapping broker “last known” vs snapshot latest tables  
- Duplicate status/legacy columns if any remain after drift backfills  

Validate with column null-rates + code references before removal.

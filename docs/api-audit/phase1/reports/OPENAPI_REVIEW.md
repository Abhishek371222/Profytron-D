# OPENAPI_REVIEW — API Audit Phase 1

| Field | Value |
|-------|-------|
| Available | true |
| Fetched from | /api/docs-json |
| OpenAPI operations | 288 |
| Inventory endpoints | 288 |
| Missing in OpenAPI (heuristic) | 119 |

Note: Swagger document fetched

## @Api* decorator counts (controllers)

| Decorator | Count |
|-----------|------:|
| @ApiTags | 32 |
| @ApiOperation | 263 |
| @ApiResponse | 372 |
| @ApiBearerAuth | 46 |
| @ApiBody | 2 |

## Missing sample

- GET /v1/admin/users/:id
- POST /v1/admin/users/:id/withdraw
- PATCH /v1/admin/users/:id/status
- PATCH /v1/admin/users/:id/role
- PATCH /v1/admin/strategies/:id
- POST /v1/admin/strategies/:strategyId/documents
- DELETE /v1/admin/strategies/:strategyId/documents/:documentId
- DELETE /v1/admin/strategies/:id
- POST /v1/admin/verifications/:id/handle
- PATCH /v1/admin/broker-accounts/:id/master
- POST /v1/admin/broker-accounts/:id/broadcast
- GET /v1/admin/kyc/documents/:docId/url
- POST /v1/admin/kyc/:userId/review
- POST /v1/affiliates/capture/:code
- POST /v1/agents/budgets/:agentType/enable
- POST /v1/agents/budgets/:agentType/disable
- POST /v1/agents/run/:agentType
- POST /v1/ai/explain-trade/:tradeId
- GET /v1/ai/market-regime/:symbol
- DELETE /v1/settings/api-keys/:id
- GET /v1/broker/accounts/:id/snapshot/latest
- GET /v1/broker/accounts/:id/snapshot/summary
- GET /v1/broker/accounts/:id/snapshot/history
- GET /v1/broker/accounts/:id/snapshot/positions
- GET /v1/broker/accounts/:id/snapshot/pending-orders
- GET /v1/broker/accounts/:id/snapshot/deals
- GET /v1/broker/accounts/:id/snapshot/balance-history
- GET /v1/broker/accounts/:id/snapshot/equity-history
- GET /v1/broker/accounts/:id/snapshot/drawdown-history
- GET /v1/broker/accounts/:id/snapshot/returns-history
- GET /v1/broker/accounts/:id/snapshot/analytics
- GET /v1/broker/accounts/:id/snapshot/performance
- GET /v1/broker/accounts/:id/snapshot/risk
- GET /v1/broker/accounts/:id/snapshot/symbols
- GET /v1/broker/accounts/:id/snapshot/timeline
- DELETE /v1/broker/accounts/:id
- POST /v1/broker/accounts/:id/test
- POST /v1/broker/accounts/:id/bridge-token
- POST /v1/broker/accounts/:id/share
- POST /v1/broker/accounts/:id/accept

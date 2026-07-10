# Profytron MT5 Copy Bridge

Users connect their own MT5 login/password in Profytron. Credentials stay in our database — **no MetaApi seat per user**.

## How copy works

1. Master MT5 (operator) is the only account on MetaApi.
2. When the master opens/closes a trade, MasterSync fans out jobs to paid subscribers in the DB.
3. **Paper** accounts: simulated fills in Profytron.
4. **Live** accounts without MetaApi: a `CopyBridgeOrder` is queued. The free **ProfytronCopyBridge** EA on the user’s MT5 polls `/bridge/orders` and places the same trade locally.

## Setup for a user

1. Connect MT5 in Profytron (Connected Accounts). Copy the **bridge token** shown once.
2. In MetaTrader 5 → Tools → Options → Expert Advisors → allow WebRequest for your API host (e.g. `https://api.profytron.com`).
3. Attach `ProfytronCopyBridge.mq5` to any chart. Set `InpApiBaseUrl` and `InpBridgeToken`.
4. Subscribe to a bot and keep MT5 + EA running while you want live copies.

## API

- `GET /bridge/orders` — header `X-Bridge-Token` (or `?token=`). Claims pending orders.
- `POST /bridge/orders/:id/result` — body `{ "status": "FILLED"|"FAILED", "brokerTicket"?: "..." }`.

Rotate token anytime: `POST /broker/accounts/:id/bridge-token` (JWT).

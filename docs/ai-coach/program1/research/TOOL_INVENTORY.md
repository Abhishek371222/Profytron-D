# Tool Inventory

“Tools” here = **existing internal APIs / services** the Coach *may* call in a future implementation. Phase 1 does **not** implement a tool-calling agent. Today the chat path has **no tool registry**.

Global prefix: `/v1` (web often via `/api` proxy).

---

## Coach module (in use)

| Endpoint | Purpose | Inputs | Outputs | Permissions | Latency |
| --- | --- | --- | --- | --- | --- |
| `GET /coach/conversations` | List sessions | JWT | Conversations | User | Low |
| `POST /coach/conversations` | Create | `{ title? }` | Conversation | User | Low |
| `GET /coach/conversations/:id` | Load messages | id | Messages + escalation | Owner | Low |
| `POST .../messages` | Sync reply | `{ content }` ≤2000 | Message pair | User, 40/min | Med |
| `POST .../messages/stream` | SSE tokens | `{ content }` | SSE events | User, 30/min | Med–High (LLM) |
| `POST .../escalate` | Human handoff | — | Escalation + 15m SLA | User | Low |
| Admin escalate/claim/reply/resolve | Live desk | Admin JWT | Status | Admin | Low |
| WS `/coach` | Presence / events | JWT | Events | User/Admin | Realtime |

**Internal (not HTTP tools):** `buildAccountSnapshot`, `matchFaq` / `rankFaq`, `AIService.generateCoachReply` / `streamCoachReply`.

---

## Parallel AI (exist; mostly unused by Alpha Coach chat)

| Endpoint | Purpose | Permissions | Notes |
| --- | --- | --- | --- |
| `POST /ai/explain-trade/:tradeId` | Persist `AITradeExplanation` | User | **MVP grounding candidate** |
| `POST /ai/explain` | Explain DTO | User | |
| `POST /ai/chat` | Legacy chat + 5 trades | User | Different prompt/disclaimer |
| `GET /ai/coaching-report` | Behavior flags + suggestions + disclaimer | User | UI already fetches for tips |

---

## Grounding candidates (read-only for MVP design)

| Endpoint family | Purpose | Permissions | Latency |
| --- | --- | --- | --- |
| `GET /trading/trades/open`, `/history` | Live/history book | User | Low–Med |
| `GET /analytics/portfolio`, `/risk`, `/trades`, `/strategy-comparison` | Performance | User | Med |
| `GET /broker/accounts/:id/snapshot/*` | Equity, positions, risk, performance | User | Med |
| `GET /strategies`, `/strategies/my` | Strategy metadata | User | Low |
| `GET /risk/*` | Risk score/policy | User | Low |
| `GET /notifications` | Ops context | User | Low |

---

## Explicit non-tools for Coach automation

| Endpoint family | Why |
| --- | --- |
| Trading close/modify/emergency-stop | Execution — never automatic |
| Strategy activate/pause without confirm | Configuration — confirmation required |
| Wallet withdraw / checkout | Out of Coach execution scope |

---

## Implementation note (future phase — not Phase 1)

MVP implementation should prefer **server-side assembly of a structured grounding block** from existing Prisma/API reads over a full agent tool loop — keeps architecture frozen and latency predictable.

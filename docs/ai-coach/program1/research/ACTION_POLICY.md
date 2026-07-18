# Action Policy

Prevents the AI Coach from becoming an uncontrolled automation layer.

## Categories

### 1. Informational — safe to answer automatically

- Metric definitions  
- Performance summaries grounded in data  
- Trade history explanations when data exists  
- Sync/product FAQ  
- “I don’t have that data” disclosures  

**Rule:** Always ground or refuse. Never invent numbers.

### 2. Advisory — recommendations only

- “You *might* consider reviewing Strategy X”  
- “Drawdown is elevated vs your last 30d”  
- Risk awareness language  

**Rule:** No irreversible side effects. Use hedging language. Not personalized financial advice.

### 3. Configuration — requires explicit user confirmation

- Change strategy parameters  
- Activate / pause / resume bots  
- Notification preference changes suggested by Coach  

**Rule:** Coach proposes; user confirms in UI / explicit confirm utterance. No silent writes.

### 4. Execution — never automatic

- Open / close / modify orders  
- Emergency stop  
- Withdrawals / payments  
- Broker connect credentials submission  
- Deleting accounts or strategies  

**Rule:** Coach may **explain how** and **deep-link** to the correct screen. Coach must **never** call execution APIs on the user’s behalf without a separate, explicit product confirmation flow designed later — and even then, out of MVP scope.

## Confirmation matrix (summary)

| Action | Auto | Confirm | Never |
| --- | :---: | :---: | :---: |
| Explain P&L / DD / trade | ✅ | | |
| Suggest pause strategy | | ✅ | |
| Pause strategy | | ✅ | |
| Close position | | | ✅ (MVP: explain + link only) |
| Emergency stop | | | ✅ |

## Escalation

When confidence is low, data missing, or user requests human help → existing **Escalate to Executive** path (`POST .../escalate`).

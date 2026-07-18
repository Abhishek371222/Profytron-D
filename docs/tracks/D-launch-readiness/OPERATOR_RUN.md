# Operator runner — Closed Beta Weeks 1–3

Run from repo root on Windows PowerShell. Does **not** rotate secrets or send invites.

```powershell
# Health (Week 1)
$env:API_BASE_URL = "https://profytron-api.onrender.com"
curl.exe -sS -m 60 "$env:API_BASE_URL/live"
curl.exe -sS -m 60 "$env:API_BASE_URL/ready"
curl.exe -sS -m 90 "$env:API_BASE_URL/health"
curl.exe -sS -m 45 -o NUL -w "%{http_code}\n" "https://www.profytron.com/status"

# Product-audit live probes (needs local stack + credentials)
# $env:ALLOW_LIVE_METAAPI = "1"
# $env:ALLOW_LIVE_PAYMENT = "1"
# $env:ALLOW_LIVE_EMAIL_OTP = "1"
# pnpm product-audit:journeys

# Load (Week 2) — requires k6 on PATH
# $env:API_BASE_URL = "https://profytron-api.onrender.com"
# pnpm load:d7:100
# pnpm load:d7:500

# Evidence: save stdout under docs/tracks/D-launch-readiness/evidence/
```

Owner-only:
1. Rotate secrets in Render / provider consoles (see SECRET_ROTATION_PLAYBOOK.md)
2. Fill docs/CLOSED_BETA_INVITE_LIST.md and set BETA_ALLOWLIST_EMAILS on Render API
3. Send invites

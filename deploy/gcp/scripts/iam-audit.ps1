#Requires -Version 5.1
<#
.SYNOPSIS
  IAM audit — list custom roles bindings and Cloud Run invokers (CLI only).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Continue"
gcloud config set project $ProjectId | Out-Null

Write-Host "=== Project IAM (owners / editors / secrets) ===" -ForegroundColor Cyan
gcloud projects get-iam-policy $ProjectId `
  --flatten="bindings[].members" `
  --filter="bindings.role:(roles/owner OR roles/editor OR roles/secretmanager.secretAccessor OR roles/run.admin)" `
  --format="table(bindings.role,bindings.members)"

Write-Host "`n=== Cloud Run invoker policy (api) ===" -ForegroundColor Cyan
gcloud run services get-iam-policy api --region=$Region --format=yaml 2>$null

Write-Host "`n=== Service accounts ===" -ForegroundColor Cyan
gcloud iam service-accounts list --format="table(email,displayName,disabled)"

Write-Host "`nLeast-privilege checklist:" -ForegroundColor Green
Write-Host "  - Prefer dedicated SAs per Cloud Run service (not default compute SA)."
Write-Host "  - Scope secretAccessor to individual secrets, not project-wide."
Write-Host "  - Prefer --no-allow-unauthenticated + Identity-Aware Proxy / JWT for admin APIs."

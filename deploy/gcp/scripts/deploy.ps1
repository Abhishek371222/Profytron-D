#Requires -Version 5.1
<#
.SYNOPSIS
  Deploy a Profytron service via Cloud Build (zero-downtime Cloud Run revise).
.EXAMPLE
  .\deploy.ps1 -Service api
  .\deploy.ps1 -Service web
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("api", "web", "ai", "backtest")]
  [string]$Service,

  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $repoRoot

$config = "cloudbuild-$Service.yaml"
if (-not (Test-Path $config)) {
  throw "Missing $config in repo root ($repoRoot)"
}

Write-Host "== Deploy $Service via Cloud Build ==" -ForegroundColor Cyan
Write-Host "Project=$ProjectId Region=$Region Config=$config"
Write-Host "Working directory: $repoRoot"

# Capture current revision for rollback
$prev = gcloud run services describe $Service --region=$Region --project=$ProjectId --format="value(status.latestReadyRevisionName)" 2>$null
Write-Host "Previous ready revision: $prev"

gcloud config set project $ProjectId | Out-Null
gcloud builds submit --config=$config --project=$ProjectId

$new = gcloud run services describe $Service --region=$Region --project=$ProjectId --format="value(status.latestReadyRevisionName)"
$url = gcloud run services describe $Service --region=$Region --project=$ProjectId --format="value(status.url)"
Write-Host "`nDeployed revision: $new" -ForegroundColor Green
Write-Host "URL: $url"

# Smoke health for API
if ($Service -eq "api") {
  try {
    $health = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 30
    Write-Host "Health: $($health.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "Health check failed — consider rollback:" -ForegroundColor Red
    Write-Host "  .\deploy\gcp\scripts\rollback.ps1 -Service api -Revision $prev"
    throw
  }
}

Write-Host "`nRollback command if needed:" -ForegroundColor Yellow
Write-Host "  .\deploy\gcp\scripts\rollback.ps1 -Service $Service -Revision $prev"

#Requires -Version 5.1
<#
.SYNOPSIS
  Roll back a Cloud Run service to a previous revision (100% traffic).
.EXAMPLE
  .\rollback.ps1 -Service api -Revision api-00042-abc
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("api", "web", "ai", "backtest")]
  [string]$Service,

  [Parameter(Mandatory = $true)]
  [string]$Revision,

  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Stop"
gcloud config set project $ProjectId | Out-Null

Write-Host "== Rollback $Service → $Revision ==" -ForegroundColor Yellow
gcloud run services update-traffic $Service `
  --region=$Region `
  --to-revisions="${Revision}=100" `
  --project=$ProjectId

$url = gcloud run services describe $Service --region=$Region --format="value(status.url)"
Write-Host "Traffic moved. URL: $url" -ForegroundColor Green

if ($Service -eq "api") {
  $health = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 30
  Write-Host "Health: $($health.StatusCode)"
}

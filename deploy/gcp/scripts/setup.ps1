#Requires -Version 5.1
<#
.SYNOPSIS
  One-shot platform bootstrap helpers (inventory + APIs + cost audit + health).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1",
  [switch]$EnableApis
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot

Write-Host "======== Profytron GCP bootstrap ========" -ForegroundColor Cyan
& "$here\gcp-inventory.ps1" -ProjectId $ProjectId -Region $Region

if ($EnableApis) {
  & "$here\enable-apis.ps1" -ProjectId $ProjectId
}

& "$here\cost-audit.ps1" -ProjectId $ProjectId -Region $Region
& "$here\health.ps1" -ProjectId $ProjectId -Region $Region
& "$here\iam-audit.ps1" -ProjectId $ProjectId -Region $Region

Write-Host "`nNext (manual decisions required):" -ForegroundColor Yellow
Write-Host "  - Pick ONE database: Neon OR a single Cloud SQL instance"
Write-Host "  - cd deploy\gcp\terraform ; terraform init ; terraform plan"
Write-Host "  - See deploy\gcp\ARCHITECTURE.md and terraform\IMPORT.md"

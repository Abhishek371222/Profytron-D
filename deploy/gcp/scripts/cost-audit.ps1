#Requires -Version 5.1
<#
.SYNOPSIS
  FinOps / cost audit for Profytron GCP (CLI only).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Continue"
gcloud config set project $ProjectId | Out-Null

Write-Host "=== CRITICAL: Cloud SQL instances ===" -ForegroundColor Red
$raw = gcloud sql instances list --format="json"
$instances = @()
if ($raw) {
  $instances = $raw | ConvertFrom-Json
}
if (-not $instances) {
  Write-Host "  (none found)"
} else {
  foreach ($i in @($instances)) {
    $tier = $i.settings.tier
    $disk = $i.settings.dataDiskSizeGb
    $ipv4 = $i.settings.ipConfiguration.ipv4Enabled
    $ssl = $i.settings.ipConfiguration.sslMode
    $backup = $i.settings.backupConfiguration.enabled
    Write-Host ("  {0}  tier={1}  disk={2}GB  publicIP={3}  ssl={4}  backups={5}  state={6}" -f `
      $i.name, $tier, $disk, $ipv4, $ssl, $backup, $i.state)
    if ($tier -match "perf-optimized|N-8") {
      Write-Host "    WARN: HIGH COST tier - confirm this instance is required" -ForegroundColor Yellow
    }
    if ($backup -eq $false) {
      Write-Host "    WARN: BACKUPS DISABLED - enable before production cutover" -ForegroundColor Yellow
    }
    if ($ipv4 -eq $true) {
      Write-Host "    WARN: PUBLIC IP enabled - prefer private IP + VPC connector" -ForegroundColor Yellow
    }
  }
  if (@($instances).Count -gt 1) {
    Write-Host ""
    Write-Host ("  WARN: {0} SQL instances are RUNNABLE - possible duplicate spend" -f @($instances).Count) -ForegroundColor Yellow
    Write-Host "  Keep one source of truth (Neon or a single Cloud SQL). Stop/delete idle after snapshot." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "=== Cloud Run always-on (min instances) ===" -ForegroundColor Cyan
$svcRaw = gcloud run services list --platform=managed --region=$Region --format="json"
$services = @()
if ($svcRaw) {
  $services = $svcRaw | ConvertFrom-Json
}
foreach ($s in @($services)) {
  $name = $s.metadata.name
  $min = $s.spec.template.metadata.annotations.'autoscaling.knative.dev/minScale'
  $max = $s.spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
  Write-Host ("  {0}  min={1}  max={2}  url={3}" -f $name, $min, $max, $s.status.url)
}

Write-Host ""
Write-Host "=== Memorystore ===" -ForegroundColor Cyan
gcloud redis instances list --region=$Region --format="table(name,tier,memorySizeGb,state)"

Write-Host ""
Write-Host "=== Budget ===" -ForegroundColor Cyan
$billing = gcloud billing projects describe $ProjectId --format="value(billingAccountName)"
if ($billing) {
  $ba = $billing -replace "billingAccounts/", ""
  gcloud billing budgets list --billing-account=$ba --format="table(displayName,amount.specifiedAmount)"
}

Write-Host ""
Write-Host "Recommended next steps:" -ForegroundColor Green
Write-Host "  1. Decide: Neon vs Cloud SQL (and which SQL instance)."
Write-Host "  2. Snapshot + stop unused SQL: gcloud sql instances patch NAME --activation-policy=NEVER"
Write-Host "  3. Enable backups on the chosen instance."
Write-Host "  4. terraform apply buckets/pubsub (deploy/gcp/terraform) for lifecycle savings."

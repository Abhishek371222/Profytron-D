#Requires -Version 5.1
<#
.SYNOPSIS
  Health-check Profytron Cloud Run services (CLI only).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Continue"
gcloud config set project $ProjectId | Out-Null

# ai/backtest often have no `/` route — treat 404 as "service up" if TCP/HTTP responds
$services = @(
  @{ Name = "api"; Path = "/health"; OkStatuses = @(200) },
  @{ Name = "web"; Path = "/"; OkStatuses = @(200, 301, 302, 307, 308) },
  @{ Name = "ai"; Path = "/health"; OkStatuses = @(200, 404) },
  @{ Name = "backtest"; Path = "/health"; OkStatuses = @(200, 404) }
)

foreach ($svc in $services) {
  $url = gcloud run services describe $svc.Name --region=$Region --format="value(status.url)" 2>$null
  if (-not $url) {
    Write-Host ("FAIL  {0}  (service not found)" -f $svc.Name) -ForegroundColor Red
    continue
  }
  $target = "$url$($svc.Path)"
  try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
      $resp = Invoke-WebRequest -Uri $target -Method GET -TimeoutSec 20 -UseBasicParsing
      $code = [int]$resp.StatusCode
    } catch {
      # PowerShell throws on 4xx/5xx — extract status if present
      $ex = $_.Exception
      if ($ex.Response -and $ex.Response.StatusCode) {
        $code = [int]$ex.Response.StatusCode
      } else {
        throw
      }
    }
    $sw.Stop()
    $ok = $svc.OkStatuses -contains $code
    $color = if ($ok) { "Green" } else { "Yellow" }
    $label = if ($ok) { "OK  " } else { "WARN" }
    Write-Host ("{0}  {1,-10} {2}  {3}ms  {4}" -f $label, $svc.Name, $code, $sw.ElapsedMilliseconds, $target) -ForegroundColor $color
  } catch {
    Write-Host ("FAIL  {0,-10} {1}  {2}" -f $svc.Name, $target, $_.Exception.Message) -ForegroundColor Red
  }
}

Write-Host "`nRecent Cloud Build failures (last 5):" -ForegroundColor Cyan
gcloud builds list --limit=5 --format="table(id,status,createTime,duration)" --project=$ProjectId

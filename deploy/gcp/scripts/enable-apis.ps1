#Requires -Version 5.1
<#
.SYNOPSIS
  Enable cost-aware Google Cloud APIs for Profytron (CLI only).
.DESCRIPTION
  Enables only APIs that are useful for the current SaaS stack.
  Skips Vision/Video/Speech/Maps/Cloud Armor (idle or product-gated cost).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011"
)

$ErrorActionPreference = "Stop"

Write-Host "== Project: $ProjectId ==" -ForegroundColor Cyan
gcloud config set project $ProjectId | Out-Null

$apis = @(
  # Core platform (idempotent if already enabled)
  "run.googleapis.com",
  "cloudbuild.googleapis.com",
  "artifactregistry.googleapis.com",
  "secretmanager.googleapis.com",
  "logging.googleapis.com",
  "monitoring.googleapis.com",
  "cloudtrace.googleapis.com",
  "redis.googleapis.com",
  "sqladmin.googleapis.com",
  "vpcaccess.googleapis.com",
  "servicenetworking.googleapis.com",
  "compute.googleapis.com",
  "iam.googleapis.com",
  "storage.googleapis.com",
  "pubsub.googleapis.com",
  "cloudscheduler.googleapis.com",
  "aiplatform.googleapis.com",
  # Recommended additions (low/no idle cost)
  "cloudtasks.googleapis.com",
  "eventarc.googleapis.com",
  "clouderrorreporting.googleapis.com",
  "cloudprofiler.googleapis.com",
  "certificatemanager.googleapis.com",
  "networkmanagement.googleapis.com"
)

Write-Host "`nCost notes:" -ForegroundColor Yellow
Write-Host "  Cloud Tasks / Eventarc / Error Reporting / Profiler / Cert Manager / Network Mgmt"
Write-Host "  → pay-per-use; enabling alone does not create billable resources."
Write-Host "  Skipped: cloudarmor, vision, videointelligence, speech, maps, documentai"
Write-Host "  → enable only when a product feature needs them.`n"

Write-Host "Enabling $($apis.Count) APIs..." -ForegroundColor Cyan
gcloud services enable @apis --project=$ProjectId

Write-Host "`nDone. Verify with:" -ForegroundColor Green
Write-Host "  gcloud services list --enabled --project=$ProjectId"

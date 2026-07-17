#Requires -Version 5.1
<#
.SYNOPSIS
  Live GCP inventory for Profytron (CLI only).
#>
param(
  [string]$ProjectId = "gen-lang-client-0497144011",
  [string]$Region = "asia-south1"
)

$ErrorActionPreference = "Continue"
gcloud config set project $ProjectId | Out-Null

Write-Host "=== CLOUD RUN ===" -ForegroundColor Cyan
gcloud run services list --platform=managed --region=$Region --format="table(metadata.name,status.url,status.conditions[0].status)"

Write-Host "`n=== ARTIFACT REGISTRY ===" -ForegroundColor Cyan
gcloud artifacts repositories list --location=$Region --format="table(name,format)"

Write-Host "`n=== CLOUD SQL ===" -ForegroundColor Cyan
gcloud sql instances list --format="table(name,databaseVersion,region,state,settings.tier,settings.dataDiskSizeGb)"

Write-Host "`n=== MEMORYSTORE ===" -ForegroundColor Cyan
gcloud redis instances list --region=$Region --format="table(name,tier,memorySizeGb,host,port,state)"

Write-Host "`n=== VPC CONNECTORS ===" -ForegroundColor Cyan
gcloud compute networks vpc-access connectors list --region=$Region --format="table(name,network,ipCidrRange,state)"

Write-Host "`n=== SERVICE ACCOUNTS ===" -ForegroundColor Cyan
gcloud iam service-accounts list --format="table(email,displayName)"

Write-Host "`n=== BUCKETS ===" -ForegroundColor Cyan
gsutil ls -p $ProjectId

Write-Host "`n=== PUB/SUB TOPICS ===" -ForegroundColor Cyan
gcloud pubsub topics list --format="value(name)"

Write-Host "`n=== SCHEDULER ($Region) ===" -ForegroundColor Cyan
gcloud scheduler jobs list --location=$Region --format="table(name,schedule,state)" 2>$null

Write-Host "`n=== CLOUD BUILD TRIGGERS ===" -ForegroundColor Cyan
gcloud builds triggers list --format="table(name,filename,disabled)" 2>$null

Write-Host "`n=== BILLING ===" -ForegroundColor Cyan
gcloud billing projects describe $ProjectId --format="yaml(billingAccountName,billingEnabled)"

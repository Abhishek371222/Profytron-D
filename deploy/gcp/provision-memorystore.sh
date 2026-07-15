#!/usr/bin/env bash
# Provisions Google Cloud Memorystore for Redis + the Serverless VPC Access
# connector Cloud Run needs to reach it (Memorystore has no public IP), then
# writes the new REDIS_URL into Secret Manager.
#
# Prerequisites (one-time, must be done by a human — not scriptable):
#   1. Fix the broken gcloud CLI on this machine: `gcloud` currently fails with
#      "Python was not found" because Windows routes `python` to the Microsoft
#      Store shim. Either install Python 3 from python.org and ensure it's on
#      PATH ahead of the Store shim, or disable the shim at
#      Settings > Apps > Advanced app settings > App execution aliases.
#   2. Authenticate: `gcloud auth login`
#   3. Confirm the right project is active: `gcloud config set project gen-lang-client-0497144011`
#
# No application code changes are required for this migration — apps/api's
# apps/api/src/config/redis.config.ts already treats a plain redis://host:6379
# URL (no TLS, no credentials) as valid "Standard Redis" config, which is
# exactly what Memorystore looks like. Only infra + the REDIS_URL secret value
# change.
#
# Usage: bash deploy/gcp/provision-memorystore.sh
set -euo pipefail

PROJECT_ID="gen-lang-client-0497144011"
REGION="asia-south1"
NETWORK="default"
REDIS_INSTANCE="profytron-redis"
REDIS_TIER="basic"       # basic = no HA/replica, cheapest. "standard_ha" doubles cost.
REDIS_SIZE_GB=1          # smallest Memorystore size; resize later if needed
CONNECTOR_NAME="profytron-connector"
CONNECTOR_RANGE="10.8.0.0/28"   # must not overlap existing subnets

echo "== Project: $PROJECT_ID / Region: $REGION =="
gcloud config set project "$PROJECT_ID" >/dev/null

echo "== Enabling required APIs =="
gcloud services enable \
  redis.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  --project="$PROJECT_ID"

echo "== Ensuring Private Services Access exists on network '$NETWORK' (required for Memorystore) =="
if ! gcloud compute addresses describe google-managed-services-default \
      --global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute addresses create google-managed-services-default \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network="$NETWORK" \
    --project="$PROJECT_ID"
  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=google-managed-services-default \
    --network="$NETWORK" \
    --project="$PROJECT_ID"
else
  echo "   already exists, skipping"
fi

echo "== Creating Serverless VPC Access connector '$CONNECTOR_NAME' (skip if exists) =="
if ! gcloud compute networks vpc-access connectors describe "$CONNECTOR_NAME" \
      --region="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute networks vpc-access connectors create "$CONNECTOR_NAME" \
    --region="$REGION" \
    --network="$NETWORK" \
    --range="$CONNECTOR_RANGE" \
    --project="$PROJECT_ID"
else
  echo "   already exists, skipping"
fi

echo "== Creating Memorystore Redis instance '$REDIS_INSTANCE' (skip if exists) =="
if ! gcloud redis instances describe "$REDIS_INSTANCE" \
      --region="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud redis instances create "$REDIS_INSTANCE" \
    --size="$REDIS_SIZE_GB" \
    --region="$REGION" \
    --network="$NETWORK" \
    --tier="$REDIS_TIER" \
    --redis-version=redis_7_0 \
    --project="$PROJECT_ID"
else
  echo "   already exists, skipping"
fi

echo "== Fetching Memorystore host IP =="
REDIS_HOST=$(gcloud redis instances describe "$REDIS_INSTANCE" \
  --region="$REGION" --project="$PROJECT_ID" \
  --format="value(host)")
REDIS_PORT=$(gcloud redis instances describe "$REDIS_INSTANCE" \
  --region="$REGION" --project="$PROJECT_ID" \
  --format="value(port)")
NEW_REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
echo "   $NEW_REDIS_URL"

echo "== Writing new REDIS_URL to Secret Manager (adds a new version) =="
printf '%s' "$NEW_REDIS_URL" | gcloud secrets versions add REDIS_URL \
  --data-file=- --project="$PROJECT_ID"

cat <<EOF

Done. Memorystore is live at $NEW_REDIS_URL (private IP, VPC-only — do not
expect to reach it from your laptop directly).

Next steps:
  1. Review deploy/gcp/README.md for what changed in cloudbuild-api.yaml
     (--vpc-connector flag added so Cloud Run can reach this private IP).
  2. Redeploy: gcloud builds submit --config=cloudbuild-api.yaml
  3. Smoke-test: curl https://<api-url>/health  (checks Redis connectivity)
  4. Once confirmed healthy, the old UPSTASH_* secrets in Secret Manager are
     dead weight — safe to delete, not required for anything to keep working.
EOF

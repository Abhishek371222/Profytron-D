#!/usr/bin/env bash
# Provisions a Cloud SQL for PostgreSQL instance (private IP only, same VPC as
# Cloud Run/Memorystore) to replace Neon. Does NOT touch Neon or migrate data
# — this only creates an empty instance + database + app user. Data copy and
# cutover are separate, deliberate steps.
set -euo pipefail

PROJECT_ID="gen-lang-client-0497144011"
REGION="asia-south1"
NETWORK="default"
INSTANCE_NAME="profytron-postgres"
DB_VERSION="POSTGRES_17"   # matches Neon's current version (17.10)
TIER="db-custom-1-3840"    # 1 vCPU / 3.75GB — smallest non-shared-core tier, fine for a 21MB DB
DB_NAME="profytron"
DB_USER="profytron_app"

echo "== Project: $PROJECT_ID / Region: $REGION =="
gcloud config set project "$PROJECT_ID" >/dev/null

echo "== Enabling Cloud SQL Admin API =="
gcloud services enable sqladmin.googleapis.com --project="$PROJECT_ID"

echo "== Generating app user password =="
DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64').replace(/[+/=]/g,''))")

echo "== Creating Cloud SQL instance '$INSTANCE_NAME' (skip if exists; this takes ~5-10 min) =="
if ! gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql instances create "$INSTANCE_NAME" \
    --database-version="$DB_VERSION" \
    --edition=ENTERPRISE \
    --tier="$TIER" \
    --region="$REGION" \
    --network="$NETWORK" \
    --no-assign-ip \
    --storage-size=10 \
    --storage-auto-increase \
    --backup-start-time=18:00 \
    --project="$PROJECT_ID"
else
  echo "   already exists, skipping"
fi

echo "== Creating database '$DB_NAME' (skip if exists) =="
if ! gcloud sql databases describe "$DB_NAME" --instance="$INSTANCE_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql databases create "$DB_NAME" --instance="$INSTANCE_NAME" --project="$PROJECT_ID"
else
  echo "   already exists, skipping"
fi

echo "== Creating app user '$DB_USER' =="
if ! gcloud sql users list --instance="$INSTANCE_NAME" --project="$PROJECT_ID" --format="value(name)" | grep -q "^${DB_USER}$"; then
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID"
else
  echo "   already exists — resetting password so we know it"
  gcloud sql users set-password "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID"
fi

echo "== Fetching connection info =="
PRIVATE_IP=$(gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" --format="value(ipAddresses[0].ipAddress)")
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" --format="value(connectionName)")

echo "== Storing credentials in Secret Manager (new secret: CLOUDSQL_APP_PASSWORD) =="
if ! gcloud secrets describe CLOUDSQL_APP_PASSWORD --project="$PROJECT_ID" >/dev/null 2>&1; then
  printf '%s' "$DB_PASSWORD" | gcloud secrets create CLOUDSQL_APP_PASSWORD --data-file=- --project="$PROJECT_ID"
else
  printf '%s' "$DB_PASSWORD" | gcloud secrets versions add CLOUDSQL_APP_PASSWORD --data-file=- --project="$PROJECT_ID"
fi

cat <<EOF

Done.
  Instance:         $INSTANCE_NAME
  Connection name:  $CONNECTION_NAME
  Private IP:       $PRIVATE_IP
  Database:         $DB_NAME
  App user:         $DB_USER
  Password:         stored in Secret Manager as CLOUDSQL_APP_PASSWORD

This instance is empty — no data has been copied yet, and Neon is untouched.
Next: tunnel in via cloud-sql-proxy, run prisma migrate deploy to create the
schema, then copy data table-by-table.
EOF

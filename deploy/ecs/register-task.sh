#!/usr/bin/env bash
# Register Profytron API on ECS Fargate with Datadog Agent sidecar (APM + Logs).
# Prerequisites: AWS CLI, jq, Docker image pushed to ECR.
#
# Usage:
#   export AWS_REGION=us-east-1
#   export AWS_ACCOUNT_ID=123456789012
#   export ECR_IMAGE_URI=123456789012.dkr.ecr.us-east-1.amazonaws.com/profytron-api:latest
#   export IMAGE_TAG=latest
#   ./deploy/ecs/register-task.sh

set -euo pipefail

: "${AWS_REGION:?Set AWS_REGION}"
: "${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
: "${ECR_IMAGE_URI:?Set ECR_IMAGE_URI}"
: "${IMAGE_TAG:=latest}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TASK_DEF="${ROOT}/deploy/ecs/task-definition.json"

aws logs create-log-group --log-group-name /ecs/profytron-api --region "$AWS_REGION" 2>/dev/null || true
aws logs create-log-group --log-group-name /ecs/profytron-api-datadog --region "$AWS_REGION" 2>/dev/null || true

# Store Datadog API key in Secrets Manager (skip if already exists).
if ! aws secretsmanager describe-secret --secret-id datadog/api-key --region "$AWS_REGION" >/dev/null 2>&1; then
  if [[ -z "${DD_API_KEY:-}" ]]; then
    echo "Create secret datadog/api-key in Secrets Manager or export DD_API_KEY first."
    exit 1
  fi
  aws secretsmanager create-secret \
    --name datadog/api-key \
    --secret-string "$DD_API_KEY" \
    --region "$AWS_REGION"
  echo "Created Secrets Manager secret datadog/api-key"
fi

RENDERED="$(mktemp)"
sed \
  -e "s|\${AWS_REGION}|${AWS_REGION}|g" \
  -e "s|\${AWS_ACCOUNT_ID}|${AWS_ACCOUNT_ID}|g" \
  -e "s|\${ECR_IMAGE_URI}|${ECR_IMAGE_URI}|g" \
  -e "s|\${IMAGE_TAG}|${IMAGE_TAG}|g" \
  "$TASK_DEF" > "$RENDERED"

TASK_ARN="$(aws ecs register-task-definition \
  --cli-input-json "file://${RENDERED}" \
  --region "$AWS_REGION" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"

rm -f "$RENDERED"
echo "Registered task definition: $TASK_ARN"
echo ""
echo "Create or update the ECS service:"
echo "  aws ecs create-service \\"
echo "    --cluster profytron \\"
echo "    --service-name profytron-api \\"
echo "    --task-definition profytron-api \\"
echo "    --desired-count 1 \\"
echo "    --launch-type FARGATE \\"
echo "    --network-configuration \"awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}\" \\"
echo "    --region $AWS_REGION"

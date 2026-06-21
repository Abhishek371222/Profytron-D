#!/usr/bin/env bash
# =============================================================================
# Profytron one-command rollback  (target: recovery < 2 minutes)
# =============================================================================
# Kubernetes:
#   ./scripts/rollback.sh k8s                 # roll back to previous revision
#   ./scripts/rollback.sh k8s 42              # roll back to a specific revision
#
# Docker Compose (image tag pinned via API_IMAGE):
#   API_IMAGE=ghcr.io/org/profytron-api:v1.4.2 ./scripts/rollback.sh compose
#
# After rollback the script waits for /health to report 200 before exiting.
# =============================================================================
set -euo pipefail

MODE="${1:-k8s}"
NAMESPACE="${K8S_NAMESPACE:-profytron}"
DEPLOY="${K8S_DEPLOYMENT:-profytron-api}"
HEALTH_URL="${HEALTH_URL:-http://localhost:4000/health}"

wait_healthy() {
  echo "[rollback] waiting for ${HEALTH_URL} to return 200..."
  for _ in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || echo 000)"
    if [[ "$code" == "200" ]]; then echo "[rollback] healthy"; return 0; fi
    sleep 2
  done
  echo "[rollback] WARNING: health check did not pass in time" >&2
  return 1
}

case "$MODE" in
  k8s)
    REVISION="${2:-}"
    if [[ -n "$REVISION" ]]; then
      echo "[rollback] kubectl rollout undo deploy/${DEPLOY} --to-revision=${REVISION}"
      kubectl -n "$NAMESPACE" rollout undo "deployment/${DEPLOY}" --to-revision="$REVISION"
    else
      echo "[rollback] kubectl rollout undo deploy/${DEPLOY} (previous revision)"
      kubectl -n "$NAMESPACE" rollout undo "deployment/${DEPLOY}"
    fi
    kubectl -n "$NAMESPACE" rollout status "deployment/${DEPLOY}" --timeout=120s
    ;;

  compose)
    : "${API_IMAGE:?Set API_IMAGE to the known-good image tag to roll back to}"
    echo "[rollback] redeploying api with image ${API_IMAGE}"
    API_IMAGE="$API_IMAGE" docker compose -f docker-compose.prod.yml up -d --no-deps api
    wait_healthy
    ;;

  *)
    echo "Unknown mode '$MODE' (use k8s|compose)" >&2
    exit 1
    ;;
esac

echo "[rollback] done"

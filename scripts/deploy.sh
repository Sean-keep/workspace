#!/usr/bin/env bash
# Rebuild and roll the app containers with the current source.
#
# MySQL / Redis containers and their data volumes are left untouched unless
# you pass --full. Backend + frontend are rebuilt from the working tree.
#
#   scripts/deploy.sh           # rebuild backend + frontend only
#   scripts/deploy.sh --full    # recreate the whole stack
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

if [[ ! -f .env ]]; then
  echo "==> .env missing — bootstrapping from running containers"
  ./scripts/bootstrap-env.sh
fi

if [[ "$FULL" == "1" ]]; then
  echo "==> Recreating full stack (volumes preserved)"
  docker compose up -d --build
else
  echo "==> Rebuilding app images (MySQL / Redis left running)"
  docker compose build workspace-backend workspace-frontend
  echo "==> Recreating app containers"
  docker compose up -d --force-recreate workspace-backend workspace-frontend
fi

echo "==> Waiting for backend health"
for _ in $(seq 1 30); do
  status="$(docker inspect workspace-backend --format '{{.State.Health.Status}}' 2>/dev/null || echo unknown)"
  [[ "$status" == "healthy" ]] && break
  sleep 2
done

echo "==> Status"
docker compose ps

echo
echo "Frontend:  http://localhost:3001"
echo "Backend:   http://localhost:8000"
echo "API docs:  http://localhost:8000/api/docs"

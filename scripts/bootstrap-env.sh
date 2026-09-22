#!/usr/bin/env bash
# Build a local .env for docker compose.
#
# - Reuses MYSQL_* / SECRET_KEY already live on the running containers so the
#   existing data volume keeps working (MySQL only applies passwords at
#   first init — changing them later would lock the app out).
# - Generates a fresh REDIS_PASSWORD / ADMIN_PASSWORD when missing.
#
# Idempotent: an existing .env is left untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  echo ".env already exists — leaving it alone ($ENV_FILE)"
  exit 0
fi

live_env() { # live_env <container> <VAR>
  docker inspect "$1" --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sed -n "s/^$2=//p" | head -n1
}

MYSQL_ROOT_PASSWORD="$(live_env workspace-mysql MYSQL_ROOT_PASSWORD || true)"
MYSQL_PASSWORD="$(live_env workspace-mysql MYSQL_PASSWORD || true)"
SECRET_KEY="$(live_env workspace-backend SECRET_KEY || true)"

if [[ -z "${MYSQL_ROOT_PASSWORD}" || -z "${MYSQL_PASSWORD}" || -z "${SECRET_KEY}" ]]; then
  echo "Could not read live secrets from running containers." >&2
  echo "Set SECRET_KEY / MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD in $ENV_FILE manually (see .env.example)." >&2
  exit 1
fi

REDIS_PASSWORD="$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=')"
ADMIN_PASSWORD="$(openssl rand -base64 18 | tr '+/' '-_' | tr -d '=')"
NOW="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

umask 077
cat > "$ENV_FILE" <<EOF
# Generated ${NOW} by scripts/bootstrap-env.sh — local only, never commit.

SECRET_KEY=${SECRET_KEY}

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_PASSWORD=${MYSQL_PASSWORD}

DB_HOST=workspace-mysql
DB_PORT=3306
DB_USER=workspace
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=personal_workspace

REDIS_HOST=workspace-redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_DAYS=14

LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW=300

ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=admin@example.com

CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001

DEBUG=false
EOF

echo "Wrote $ENV_FILE"
echo "  · MYSQL_* / SECRET_KEY preserved from running containers"
echo "  · fresh REDIS_PASSWORD + ADMIN_PASSWORD generated"
echo "  · initial admin password (only used if users table is empty): ${ADMIN_PASSWORD}"

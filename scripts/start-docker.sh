#!/usr/bin/env bash
set -euo pipefail

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if VALKEY_PASSWORD is set
if [ -z "${VALKEY_PASSWORD:-}" ]; then
  echo "Error: VALKEY_PASSWORD is not set. Please set it in your .env file."
  exit 1
fi

# Check if POSTGRES_PASSWORD is set
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "Error: POSTGRES_PASSWORD is not set. Please set it in your .env file."
  exit 1
fi

# Set default PostgreSQL values if not provided
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-personal_assistant}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Pull images
docker pull valkey/valkey:7.2
docker pull postgres:16-alpine

# Stop and remove existing Valkey container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^valkey$'; then
  docker stop valkey 2>/dev/null || true
  docker rm valkey 2>/dev/null || true
fi

# Stop and remove existing PostgreSQL container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
  docker stop postgres 2>/dev/null || true
  docker rm postgres 2>/dev/null || true
fi

# Run Valkey container
docker run -d \
  --name valkey \
  --restart unless-stopped \
  -p 6379:6379 \
  -e VALKEY_PASSWORD="${VALKEY_PASSWORD}" \
  valkey/valkey:7.2 \
  valkey-server --requirepass "${VALKEY_PASSWORD}"

# Run PostgreSQL container
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -p "${POSTGRES_PORT}:5432" \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

echo "Valkey and PostgreSQL containers started successfully!"
echo "PostgreSQL connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
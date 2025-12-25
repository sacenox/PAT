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

# Set default SearXNG port if not provided
SEARXNG_PORT="${SEARXNG_PORT:-8888}"

# Pull images
docker pull valkey/valkey:7.2
docker pull postgres:16-alpine
docker pull docker.io/searxng/searxng:latest

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

# Stop and remove existing SearXNG container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^searxng$'; then
  docker stop searxng 2>/dev/null || true
  docker rm searxng 2>/dev/null || true
fi

# Get the script directory to use absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Create directories for SearXNG configuration and persistent data
mkdir -p "${PROJECT_ROOT}/searxng/config" "${PROJECT_ROOT}/searxng/data"

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

# Run SearXNG container
docker run -d \
  --name searxng \
  --restart unless-stopped \
  -p "${SEARXNG_PORT}:8080" \
  -v "${PROJECT_ROOT}/searxng/config:/etc/searxng" \
  -v "${PROJECT_ROOT}/searxng/data:/var/cache/searxng" \
  docker.io/searxng/searxng:latest

# Fix permissions: ensure directories are accessible
# The container runs as root, so we need to make sure the host user can access the files
# Use Docker to fix permissions without requiring sudo
sleep 2
if docker ps --format '{{.Names}}' | grep -q '^searxng$'; then
  HOST_UID=$(id -u)
  HOST_GID=$(id -g)
  docker exec searxng chown -R "${HOST_UID}:${HOST_GID}" /etc/searxng /var/cache/searxng 2>/dev/null || true
fi

echo "Valkey, PostgreSQL, and SearXNG containers started successfully!"
echo "PostgreSQL connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
echo "SearXNG is available at: http://localhost:${SEARXNG_PORT}"
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

# Pull the image
docker pull valkey/valkey:7.2

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^valkey$'; then
  docker stop valkey 2>/dev/null || true
  docker rm valkey 2>/dev/null || true
fi

# Run the container
docker run -d \
  --name valkey \
  --restart unless-stopped \
  -p 6379:6379 \
  -e VALKEY_PASSWORD="${VALKEY_PASSWORD}" \
  valkey/valkey:7.2 \
  valkey-server --requirepass "${VALKEY_PASSWORD}"
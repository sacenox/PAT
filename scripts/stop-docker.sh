#!/usr/bin/env bash
set -euo pipefail

# Stop Valkey container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^valkey$'; then
  echo "Stopping Valkey container..."
  docker stop valkey
  echo "Valkey container stopped."
else
  echo "Valkey container not found."
fi

# Stop PostgreSQL container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
  echo "Stopping PostgreSQL container..."
  docker stop postgres
  echo "PostgreSQL container stopped."
else
  echo "PostgreSQL container not found."
fi

echo "Docker containers stopped successfully!"


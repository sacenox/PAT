#!/usr/bin/env bash
set -euo pipefail

echo "⚠️  WARNING: This will delete the PostgreSQL container and ALL database data!"

# Stop and delete PostgreSQL container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^postgres$'; then
  echo "Stopping PostgreSQL container..."
  docker stop postgres 2>/dev/null || true
  echo "PostgreSQL container stopped."
  
  echo "Removing PostgreSQL container..."
  docker rm postgres 2>/dev/null || true
  echo "PostgreSQL container removed."
else
  echo "PostgreSQL container not found."
fi

# Remove the volume to completely wipe all data
if docker volume ls --format '{{.Name}}' | grep -q '^postgres_data$'; then
  echo "Removing postgres_data volume..."
  docker volume rm postgres_data
  echo "✓ Volume removed. All database data has been wiped."
else
  echo "postgres_data volume not found."
fi

echo ""
echo "✅ PostgreSQL container and all data removed successfully!"


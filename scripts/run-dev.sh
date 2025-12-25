#!/usr/bin/env bash
set -euo pipefail

# Log file paths
LOG_DIR="${LOG_DIR:-./logs}"
OLLAMA_LOG="${LOG_DIR}/ollama.log"
DOCKER_LOG="${LOG_DIR}/docker.log"
DEV_LOG="${LOG_DIR}/dev.log"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Array to store background process PIDs
PIDS=()

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Stopping all processes..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "${pid}" 2>/dev/null; then
            kill "${pid}" 2>/dev/null || true
        fi
    done

    npm run stop:docker > "${DOCKER_LOG}" 2>&1 &
    
    # Wait for processes to terminate
    for pid in "${PIDS[@]}"; do
        wait "${pid}" 2>/dev/null || true
    done
    
    echo "All processes stopped."
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# Start ollama serve
echo "Starting ollama serve..."
ollama serve > "${OLLAMA_LOG}" 2>&1 &
PIDS+=($!)

# Start docker services
echo "Starting docker services..."
npm run start:docker > "${DOCKER_LOG}" 2>&1 &

# Start dev server
echo "Starting dev server..."
npm run dev > "${DEV_LOG}" 2>&1 &
PIDS+=($!)

# Wait a moment for processes to start
sleep 2

# Tail all log files
echo "Tailing log files..."
echo "Press Ctrl+C to stop all processes"
echo ""
tail -f "${OLLAMA_LOG}" "${DOCKER_LOG}" "${DEV_LOG}"


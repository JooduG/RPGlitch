#!/bin/bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Runs 'act' in the background with log polling to prevent agent timeouts.
# Usage: ./run-act.sh "<act arguments>"
# Example: ./run-act.sh "push -j build --matrix node-version:20.x"

set -euo pipefail

# Configuration
LOG_FILE="act_output.log"
TIMEOUT="${ACT_TIMEOUT:-600}"       # Default: 10 minutes
POLL_INTERVAL="${ACT_POLL:-10}"     # Default: 10 seconds

# Logging function
log() {
  local level="${1:-INFO}"
  local message="${2:-}"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $level: $message"
}

if [ $# -eq 0 ]; then
  log "ERROR" "No arguments provided."
  echo "Usage: $0 <act arguments...>"
  echo "Example: $0 push -j build --matrix node-version:20.x"
  exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  log "ERROR" "Docker is not running. Start Docker and try again."
  exit 1
fi

# Check act is available
if ! command -v act &> /dev/null; then
  log "ERROR" "'act' is not installed. Run install-act.sh first."
  exit 1
fi

# Detect Repository Root
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
LOG_PATH="${ROOT_DIR}/${LOG_FILE}"

log "INFO" "Starting: act $*"
log "INFO" "Logging to: ${LOG_PATH}"
log "INFO" "Timeout: ${TIMEOUT}s | Poll: ${POLL_INTERVAL}s"
echo ""

# Run act in background
# Add default runner image only if the user didn't specify one via -P
if [[ "$*" == *"-P"* ]] || [[ "$*" == *"--platform"* ]]; then
  act "$@" > "$LOG_PATH" 2>&1 &
else
  act "$@" -P ubuntu-latest=node:20-bookworm > "$LOG_PATH" 2>&1 &
fi

act_pid=$!
log "INFO" "Process started (PID: ${act_pid})"

elapsed=0

# Poll log file while process is running
while kill -0 "$act_pid" 2>/dev/null; do
  if [ $elapsed -ge $TIMEOUT ]; then
    echo ""
    log "WARN" "Timeout reached (${TIMEOUT}s). Killing act process..."
    kill "$act_pid" 2>/dev/null || true
    wait "$act_pid" 2>/dev/null || true
    echo ""
    echo "--- Full Log ---"
    cat "$LOG_PATH" 2>/dev/null || true
    echo "--- End Log ---"
    exit 1
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))

  # Show last few lines as progress
  log "INFO" "Running... (${elapsed}s/${TIMEOUT}s)"
  tail -n 5 "$LOG_PATH" 2>/dev/null || true
  echo ""
done

# Capture exit code
wait "$act_pid"
exit_code=$?

echo ""
echo "--- Full Execution Log ---"
cat "$LOG_PATH"
echo "--- End Log ---"
echo ""

if [ $exit_code -eq 0 ]; then
  log "SUCCESS" "Local GitHub Actions passed."
  exit 0
else
  log "ERROR" "Local GitHub Actions failed (exit code: ${exit_code})."
  exit 1
fi

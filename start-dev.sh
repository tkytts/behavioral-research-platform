#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Experiment Platform Development Environment..."

# Kill any existing dev session
tmux kill-session -t dev 2>/dev/null || true

# Create new session with backend in first pane
tmux new-session -d -s dev -x "$(tput cols)" -y "$(tput lines)" \
  -e "PANE_TITLE=Backend" \
  "cd '$REPO_ROOT/backend' && printf '\033]2;Backend - GameServer.Api\033\\' && dotnet run --project src/GameServer.Api"

# Split vertically for frontend
tmux split-window -h -t dev \
  "sleep 3 && cd '$REPO_ROOT/frontend' && printf '\033]2;Frontend - React App\033\\' && npm install && npm start"

echo "- Backend: https://localhost:5001"
echo "- Frontend: http://localhost:3000"

tmux attach-session -t dev

#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Experiment Platform (Fast Mode)..."

# Kill existing session if present
tmux kill-session -t dev 2>/dev/null || true

tmux new-session -d -s dev -n backend \
  "cd \"$DIR/backend\" && dotnet run --project src/GameServer.Api; read"

sleep 3

tmux split-window -h -t dev \
  "cd \"$DIR/frontend\" && npm start; read"

tmux attach -t dev

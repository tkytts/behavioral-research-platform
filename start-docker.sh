#!/bin/bash
set -e
echo "Building and starting PSG-VBR..."
docker compose up --build

# To expose via ngrok (run in a separate terminal):
# ngrok http 3000

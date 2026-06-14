#!/bin/sh
# Deploy script for TrueNAS server
# Usage: ./deploy.sh
# Requires SSH key at ~/.ssh/id_ed25519

HOST="truenas_admin@192.168.77.9"
REMOTE_DIR="/mnt/red/main/easy-english"
SSH="ssh -i $HOME/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
SUDO='echo "d2Q93mY2.#" | sudo -S'

echo "Deploying to $HOST:$REMOTE_DIR ..."

$SSH $HOST "$SUDO bash -c 'cd $REMOTE_DIR && git pull && docker compose build --no-cache && docker compose up -d'"

echo "Done! App: http://192.168.77.9:3080"

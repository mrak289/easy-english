#!/bin/sh
# Deploy script for TrueNAS server
# Usage: ./deploy.sh [user@host] [port]
# Example: ./deploy.sh admin@192.168.77.9 22

HOST=${1:-"admin@192.168.77.9"}
PORT=${2:-22}
REMOTE_DIR="/opt/easy-english"

echo "Deploying to $HOST:$REMOTE_DIR ..."

# Create remote directory and clone/pull repo
ssh -p $PORT $HOST "
  mkdir -p $REMOTE_DIR &&
  if [ -d $REMOTE_DIR/.git ]; then
    cd $REMOTE_DIR && git pull
  else
    git clone https://github.com/mrak289/easy-english.git $REMOTE_DIR
  fi
"

# If you have a .env file with API keys, copy it
if [ -f .env ]; then
  scp -P $PORT .env $HOST:$REMOTE_DIR/.env
fi

# Build and restart container
ssh -p $PORT $HOST "
  cd $REMOTE_DIR &&
  docker compose down &&
  docker compose build --no-cache &&
  docker compose up -d &&
  echo 'Deploy complete! App running at http://\$(hostname -I | awk \"{print \\\$1}\"):3080'
"

#!/bin/bash
cd ..
cd "$(dirname "$0")/backend"

if [ -f server.pid ]; then
    PID=$(cat server.pid)

    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "Vaultkey stopped."
    else
        echo "Vaultkey is not running."
    fi

    rm -f server.pid
else
    echo "No PID file found."
fi
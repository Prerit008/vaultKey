#!/bin/bash

# Change to the directory of this script
cd ..
cd "$(dirname "$0")/backend"

# Start the uvicorn server in the background
source venv/bin/activate
nohup uvicorn server:app --host 127.0.0.1 --port 51888 > server.log 2>&1 &

echo $! > server.pid
echo "Vaultkey is running in the background on http://localhost:51888"

# Attempt to open browser automatically
if which xdg-open > /dev/null
then
  xdg-open http://localhost:51888
elif which open > /dev/null
then
  open http://localhost:51888
fi

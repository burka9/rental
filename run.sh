#!/bin/bash

# Function to clean up and exit
cleanup() {
  echo "Shutting down..."
  # Kill the background processes if they exist
  if [ -n "$API_PID" ]; then
    kill $API_PID 2>/dev/null
    wait $API_PID 2>/dev/null
  fi
  if [ -n "$UI_PID" ]; then
    kill $UI_PID 2>/dev/null
    wait $UI_PID 2>/dev/null
  fi
  exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Start the api dev server in the background
cd api && nodemon src/index.ts --ignore src/import_data.ts &
API_PID=$!

# Start the ui dev server in the background
cd ui && npm run dev &
UI_PID=$!

# Return to the root directory
cd ..

# Listen for 'q' or 'quit' input
while read -r input; do
  if [[ "$input" == "q" || "$input" == "quit" ]]; then
    cleanup
  fi
done
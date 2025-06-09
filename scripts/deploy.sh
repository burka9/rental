#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load nvm and set the node version
export NVM_DIR="$HOME/.nvm"
# Source nvm script to load it
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
# Optionally, load nvm bash_completion for additional functionality
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use the Node.js version you need (adjust if necessary)
nvm use 20


cd /rental/rental-main


git restore .
git pull origin main


# fix axios
FILE='ui/lib/axios.ts'
NEW_LINE="const API_URL = \"http://116.203.217.208:4000\""

sed -i "s|^const API_URL.*|$NEW_LINE|" "$FILE"


# ui
cd ui
npm install --legacy-peer-deps
npm run build


# api
cd ..
cd api
npm install
npm run build



# TODO: implement db backup


# deploy
systemctl restart nextjs-rental.service
systemctl restart api-rental.service
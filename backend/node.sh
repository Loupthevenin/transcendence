#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status
set -o pipefail # Ensure all parts of a pipeline fail correctly

# Define colors
RESET='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'

cd /var/www/html
npm install

if [ "$NODE_ENV" = "production" ]; then
  echo -e "${CYAN}Building frontend for production...${RESET}"
  npm run build # Production build
  echo -e "${GREEN}Frontend build successfully...${RESET}"
else
  echo -e "${YELLOW}Starting frontend development server...${RESET}"
  npm run dev & # Development server running in background
  FRONTEND_PID=$! # Capture the process ID for later use
fi

cd /var/app
npm install
npm run build

if [ "$NODE_ENV" = "production" ]; then
  echo -e "${CYAN}Launching backend in production mode...${RESET}"
  npm start # Production server
else
  echo -e "${YELLOW}Launching backend in development mode...${RESET}"
  npm run dev # Development server
fi

if [ ! -z "$FRONTEND_PID" ]; then
  echo -e "${YELLOW}Waiting for the frontend development server to finish...${RESET}"
  wait $FRONTEND_PID # Wait for the frontend server process if running
fi

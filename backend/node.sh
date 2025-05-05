#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status
set -o pipefail # Ensure all parts of a pipeline fail correctly

# Define colors
RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

FRONT_DIR="/var/www/html"
BACK_DIR="/var/app"

if [ "$INTEGRITY_TEST" = "true" ]; then
    cd $BACK_DIR

    # Check if dependencies are missing before installing them
    if [ ! -d "node_modules/typescript" ]; then
        echo -e "${BLUE}Installing npm dependencies...${RESET}"
        npm install
    fi

    echo -e "${CYAN}Building the project...${RESET}"
    npm run build

    echo -e "${BLUE}Running tests...${RESET}"

    # Run tests and check the exit status
    if npm run test; then
       echo -e "${GREEN}Success: Integrity test passed!${RESET}"
    else
       echo -e "${RED}Error: Integrity test failed!${RESET}"
    fi

    exit 0
fi

# Install npm dependencies
echo -e "${BLUE}Installing npm dependencies...${RESET}"
( cd $FRONT_DIR && npm install ) &
( cd $BACK_DIR && npm install ) &

wait
echo -e "${GREEN}Npm dependencies installed successfully...${RESET}"

# Compilation of front
cd $FRONT_DIR
ln -sfn ${BACK_DIR}/src/shared ${FRONT_DIR}/src/shared

if [ "$NODE_ENV" = "development" ]; then
  echo -e "${YELLOW}Starting frontend development server...${RESET}"
  npm run dev & # Development server running in background
  FRONTEND_PID=$! # Capture the process ID for later use
else
  echo -e "${CYAN}Building frontend for production...${RESET}"
  npm run build # Production build
  echo -e "${GREEN}Frontend build successfully...${RESET}"
fi

# Compilation of back and run the server
cd $BACK_DIR
npm run build

if [ "$NODE_ENV" = "development" ]; then
  echo -e "${YELLOW}Launching backend in development mode...${RESET}"
  npm run dev # Development server
else
  echo -e "${CYAN}Launching backend in production mode...${RESET}"
  npm start # Production server
fi

if [ ! -z "$FRONTEND_PID" ]; then
  echo -e "${YELLOW}Waiting for the frontend development server to exit...${RESET}"
  wait $FRONTEND_PID # Wait for the frontend server process if running
fi

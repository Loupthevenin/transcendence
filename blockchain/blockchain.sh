#!/bin/bash

set -e

# Define colors
RESET='\033[0m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'

echo -e "${BLUE}Installing npm dependencies...${RESET}"
npm install
echo -e "${GREEN}Npm dependencies installed successfully...${RESET}"

echo -e "${BLUE}Compiling smart contracts with Hardhat...${RESET}"
npx hardhat compile
echo -e "${GREEN}Contracts compiled successfully.${RESET}"

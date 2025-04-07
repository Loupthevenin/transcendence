#!/bin/bash

# frontend compilation
cd /var/www/html
npm install
npm run build

# backend compilation and launch
cd /var/app

npm install
npm run build
# npm run dev
npm start

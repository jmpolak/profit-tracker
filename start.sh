#!/bin/bash


# Ensure a mode is passed
if [ -z "$1" ]; then
  echo -e "Error: No mode specified. Use 'dev' or 'prod'."
  exit 1
fi

MODE=$1

if [ "$MODE" == "dev" ]; then
  echo -e "Starting in development mode..."
  sudo docker compose -f docker-compose.dev.yml up --build

elif [ "$MODE" == "prod" ]; then
  echo -e "Starting in production mode..."
  sudo docker compose -f docker-compose.prod.yml up --build

else
  echo -e "Invalid mode: $MODE. Use 'dev' or 'prod'."
  exit 1
fi

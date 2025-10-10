#!/bin/bash


# Ensure a mode is passed
if [ -z "$1" ]; then
  echo -e "Error: No mode specified. Use 'dev' or 'prod'."
  exit 1
fi

MODE=$1

if [ "$MODE" == "dev" ]; then
  echo -e "Starting in development mode..."
  sudo docker compose --env-file docker-env/docker.env -f docker-env/docker-compose.dev.yml up --build

elif [ "$MODE" == "prod" ]; then
  echo -e "Starting in production mode..."
  sudo docker compose --env-file docker-env/docker.env -f docker-env/docker-compose.prod.yml up --build

elif [ "$MODE" == "down" ]; then
  echo -e "Stopping and removing all dev and prod containers..."
  sudo docker compose -f docker-env/docker-compose.dev.yml down
  sudo docker compose -f docker-env/docker-compose.prod.yml down

else
  echo -e "Invalid mode: $MODE. Use 'dev', 'prod' or 'down'."
  exit 1
fi

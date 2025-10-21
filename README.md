## Description

Profit Tracker is a project to track your wallet on Aave. It will track your supplied positions. A cron job runs everyday to save your current balance. Based on this it can generate a file with your daily profits.

## Built With

- [Node.js](https://nodejs.org/en/) – JavaScript runtime environment
- [NestJS](https://nestjs.com/) – Progressive Node.js framework for building scalable server-side applications
- [Docker](https://www.docker.com/) – Containerization platform to build, ship, and run apps
- [MongoDB](https://www.mongodb.com/) – NoSQL database for modern, scalable applications
- [Aave SDK](https://docs.aave.com/) – SDK for interacting with the Aave protocol, enabling DeFi lending and borrowing functionalities

## Requirements

- docker
- docker compose v2

## Environment Variables

Before starting the application, create a `.env` file in the project root directory. This file is required to store environment-specific settings, such as RPC URLs and API keys.

Example `.env` file:

```bash
SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY=https://mainnet.helius-rpc.com/?api-key={api-key}
```

or

```bash
SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY=https://api.mainnet-beta.solana.com
```

Make sure **not** to commit your `.env` file to version control for security reasons.

## Start

```bash
$ ./start dev or prod
```

This will start a docker container on port 8080

## Screenshots

![alt text](https://github.com/jmpolak/profit-tracker/blob/master/screenshots/screenshot.png)

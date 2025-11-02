## Description

Profit Tracker is a tool created to help you monitor and analyze your DeFi lending positions. It currently supports tracking supplied positions on both [**Aave**](https://aave.com/) and [**Jupiter Lend**](https://jup.ag/lend/earn).

A daily cron job captures your supplied token balances and transactions, allowing you to generate a detailed history of your **daily profits** for your wallet.

## Built With

- [Node.js](https://nodejs.org/en/) – JavaScript runtime environment
- [NestJS](https://nestjs.com/) – Progressive Node.js framework for building scalable server-side applications
- [Docker](https://www.docker.com/) – Containerization platform to build, ship, and run apps
- [MongoDB](https://www.mongodb.com/) – NoSQL database for modern, scalable applications

## Requirements

- [Docker](https://www.docker.com/)
- [Docker Compose v2](https://docs.docker.com/compose/)

## Environment Variables

Before starting the application, create a `.env` file in the project root directory. This file is required to store an solana rpc url.

Example `.env` file:

```bash
SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY=https://mainnet.helius-rpc.com/?api-key={api-key}
or
SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY=https://api.mainnet-beta.solana.com
```

Make sure to adjust the SolanaRpc class to the rpc endpoint rate limits.

## Start

```bash
$ ./start dev or prod
```

This will start a docker container on port 8080

## Screenshots

![alt text](https://github.com/jmpolak/profit-tracker/blob/master/screenshots/screenshot.png)

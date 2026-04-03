---
sidebar_position: 3
title: Deployment
---

# Deployment

This guide covers deploying the full Shade Protocol stack: indexer, prover, frontend, and reverse proxy.

## Architecture

```
Internet
  │
  ▼
Cloudflare (DNS + Tunnel)
  │
  ▼
Caddy (reverse proxy, automatic HTTPS)
  │
  ├── shade-protocol.com        → shade-frontend:3000
  ├── api.shade-protocol.com    → shade-indexer:4000
  ├── prover.shade-protocol.com → shade-prover:5000
  └── docs.shade-protocol.com   → shade-docs:80
```

## Prerequisites

- Docker and Docker Compose
- A deployed `ShadePool` contract on Citrea mainnet
- Circuit artifacts (`joinsplit.wasm`, `joinsplit.zkey`)
- Domain configured with Cloudflare DNS

## Docker Compose

The project includes a `docker-compose.yml` in the `docker/` directory:

```yaml
version: "3.8"

services:
  shade-indexer:
    build:
      context: ../packages/indexer
      dockerfile: Dockerfile
    container_name: shade-indexer
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - RPC_URL=${RPC_URL:-https://rpc.citreascan.com}
      - CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
      - DEPLOYMENT_BLOCK=${DEPLOYMENT_BLOCK:-0}
      - DB_PATH=/data/shade-indexer.db
      - POLL_INTERVAL=${POLL_INTERVAL:-2000}
    volumes:
      - indexer-data:/data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  shade-prover:
    build:
      context: ../packages/prover
      dockerfile: Dockerfile
    container_name: shade-prover
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - ARTIFACTS_DIR=/app/artifacts
    volumes:
      - prover-artifacts:/app/artifacts
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  shade-frontend:
    build:
      context: ../packages/frontend
      dockerfile: Dockerfile
    container_name: shade-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_INDEXER_URL=${INDEXER_URL:-http://shade-indexer:4000}
      - NEXT_PUBLIC_PROVER_URL=${PROVER_URL:-http://shade-prover:5000}
      - NEXT_PUBLIC_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
      - NEXT_PUBLIC_WCBTC_ADDRESS=${WCBTC_ADDRESS}
      - NEXT_PUBLIC_RPC_URL=${RPC_URL:-https://rpc.citreascan.com}
      - NEXT_PUBLIC_CHAIN_ID=${CHAIN_ID:-4114}
    depends_on:
      shade-indexer:
        condition: service_healthy
      shade-prover:
        condition: service_healthy

volumes:
  indexer-data:
    driver: local
  prover-artifacts:
    driver: local
```

## Environment variables

Create a `.env` file in the `docker/` directory:

```bash
# Contract addresses (required)
CONTRACT_ADDRESS=0x...
WCBTC_ADDRESS=0x...

# Citrea RPC
RPC_URL=https://rpc.citreascan.com
CHAIN_ID=4114

# Deployment block (for indexer scanning)
DEPLOYMENT_BLOCK=0

# Public-facing URLs (for frontend environment)
INDEXER_URL=https://api.shade-protocol.com
PROVER_URL=https://prover.shade-protocol.com
```

## Starting the stack

```bash
cd docker

# Copy circuit artifacts into the prover volume
docker volume create prover-artifacts
docker run --rm -v prover-artifacts:/data -v ./artifacts:/src alpine \
  cp /src/joinsplit.wasm /src/joinsplit.zkey /data/

# Start all services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

## Caddy configuration

Extend the existing Caddy config to route traffic to the Docker containers:

```
shade-protocol.com {
    reverse_proxy shade-frontend:3000
}

api.shade-protocol.com {
    reverse_proxy shade-indexer:4000
}

prover.shade-protocol.com {
    reverse_proxy shade-prover:5000
}

docs.shade-protocol.com {
    reverse_proxy shade-docs:80
}
```

## Cloudflare Tunnel

If using Cloudflare Tunnel (recommended for servers behind NAT):

```bash
# Create tunnel
cloudflared tunnel create shade-protocol

# Configure tunnel (in ~/.cloudflared/config.yml)
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: shade-protocol.com
    service: http://localhost:3000
  - hostname: api.shade-protocol.com
    service: http://localhost:4000
  - hostname: prover.shade-protocol.com
    service: http://localhost:5000
  - hostname: docs.shade-protocol.com
    service: http://localhost:80
  - service: http_status:404

# Start tunnel
cloudflared tunnel run shade-protocol
```

## Monitoring

Check the health of each service:

```bash
# Indexer health
curl https://api.shade-protocol.com/health

# Prover health
curl https://prover.shade-protocol.com/health

# Merkle tree status
curl https://api.shade-protocol.com/merkle/root
```

The indexer health endpoint returns the last scanned block, leaf count, tree depth, and capacity — useful for monitoring tree fill level.

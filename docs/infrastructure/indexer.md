---
sidebar_position: 1
title: Indexer
---

# Indexer

The indexer scans Citrea mainnet for contract events and maintains a local copy of the Poseidon Merkle tree. It provides Merkle authentication paths needed for witness building and caches event data for efficient balance scanning.

> **Note:** Key registration has moved on-chain to the [ShadeKeyRegistry](/contracts#shadekeyregistry) contract. The indexer's `/keys/*` endpoints remain as a read-through cache but are no longer the primary source of truth.

**Source:** [`packages/indexer/`](https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/indexer)

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/keys/register` | Register an Ethereum address to Shade public key mapping |
| `GET` | `/keys/:address` | Look up the Shade public key for an Ethereum address |
| `GET` | `/events?from=blockNumber` | Fetch Shield/Transact/Nullified events since a block |
| `GET` | `/merkle/root` | Get the current Merkle root, leaf count, and tree number |
| `GET` | `/merkle/path/:leafIndex` | Get the Merkle authentication path for a leaf |
| `GET` | `/health` | Server health status |

### POST /keys/register

Register a mapping from an Ethereum address to a Shade public key.

**Request:**

```json
{
  "ethAddress": "0xABC...",
  "shadePublicKey": "{\"viewingPublicKey\":{\"x\":\"0x...\",\"y\":\"0x...\"},\"masterPublicKey\":\"0x...\"}"
}
```

**Response:**

```json
{
  "status": "ok",
  "ethAddress": "0xabc...",
  "shadePublicKey": "..."
}
```

### GET /keys/:address

Look up the Shade public key for an Ethereum address.

**Response (200):**

```json
{
  "ethAddress": "0xabc...",
  "shadePublicKey": "{\"viewingPublicKey\":{\"x\":\"0x...\",\"y\":\"0x...\"},\"masterPublicKey\":\"0x...\"}"
}
```

**Response (404):**

```json
{
  "error": "Address not registered"
}
```

### GET /events

Fetch all contract events since a given block number.

**Query parameters:** `from` (required) — block number to start from.

**Response:**

```json
{
  "events": [
    {
      "id": 1,
      "blockNumber": 123456,
      "txHash": "0x...",
      "eventType": "Shield",
      "data": { ... }
    }
  ]
}
```

### GET /merkle/root

Returns the current state of the Merkle tree.

**Response:**

```json
{
  "root": "12345678901234567890...",
  "leafCount": 42,
  "treeNumber": 0
}
```

### GET /merkle/path/:leafIndex

Returns the Merkle authentication path for a specific leaf.

**Response:**

```json
{
  "leafIndex": 5,
  "pathElements": ["123...", "456...", "..."],
  "indices": [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}
```

## Architecture

The indexer consists of three main components:

1. **Event Scanner** — polls Citrea mainnet via RPC for `Shield`, `Transact`, and `Nullified` events, starting from the deployment block
2. **Merkle Tree** — binary Poseidon tree (depth 16, 65K capacity) reconstructed from on-chain events, provides authentication paths for witness building
3. **Key Cache** — mirrors the on-chain [ShadeKeyRegistry](/contracts#shadekeyregistry) for fast HTTP lookups (optional, primary source is on-chain)

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `RPC_URL` | `https://rpc.citreascan.com` | Citrea mainnet RPC endpoint |
| `CONTRACT_ADDRESS` | (required) | Deployed ShadePool contract address |
| `DEPLOYMENT_BLOCK` | `0` | Block number to start scanning from |
| `DB_PATH` | `./shade-indexer.db` | SQLite database file path |
| `POLL_INTERVAL` | `2000` | Event polling interval in milliseconds |

## Running locally

```bash
cd packages/indexer

# Install dependencies
npm install

# Set environment variables
export CONTRACT_ADDRESS=0x...
export RPC_URL=https://rpc.citreascan.com

# Run in development mode
npx tsx src/index.ts
```

## Docker

```bash
docker build -t shade-indexer packages/indexer/
docker run -p 4000:4000 \
  -e CONTRACT_ADDRESS=0x... \
  -e RPC_URL=https://rpc.citreascan.com \
  -v indexer-data:/data \
  shade-indexer
```

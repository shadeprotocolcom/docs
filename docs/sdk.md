---
sidebar_position: 5
title: SDK
---

# SDK

The Shade Protocol SDK is a TypeScript library that runs in the browser. It handles key derivation, note encryption, witness building, and transaction assembly — everything needed to interact with the privacy pool without touching low-level cryptography directly.

**Source:** [`packages/sdk/`](https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/sdk)

## ShadeClient API

The `ShadeClient` class is the primary interface:

```typescript
import { ShadeClient } from "@shade-protocol/sdk";

const client = new ShadeClient({
  contractAddress: "0x...",
  wcbtcAddress: "0x...",
  rpcUrl: "https://rpc.citreascan.com",
  chainId: 4114,
  indexerUrl: "https://api.shade-protocol.com",
  proverUrl: "https://prover.shade-protocol.com",
});
```

### `connect(signer)`

Connect a wallet, derive Shade keys, and perform initial balance sync.

```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await client.connect(signer);
```

The signer is prompted to sign the canonical message `"Shade Protocol Key Derivation v1"`. The signature is used deterministically to derive all cryptographic keys.

### `getBalance()`

Re-sync with the indexer and return the total unspent scBTC balance.

```typescript
const balance = await client.getBalance();
// Returns bigint in wei (18 decimals)
```

### `shield(amount)`

Deposit native cBTC into the privacy pool.

```typescript
const txHash = await client.shield(ethers.parseEther("0.001"));
```

- Creates a note with the user's Master Public Key
- Encrypts the note with the user's viewing key
- Sends native cBTC as `msg.value` (auto-wrapped to WcBTC by the contract)

### `send(recipientAddress, amount)`

Send a private transfer to another Shade user.

```typescript
const txHash = await client.send("0xRecipient...", ethers.parseEther("0.0005"));
```

- Looks up the recipient's public key from the indexer
- Selects input notes (greedy, largest first, max 2)
- Builds output notes (recipient note + change note)
- Encrypts each note with the correct viewing key
- Sends the witness to the prover, receives the Groth16 proof
- Submits the transaction on-chain

### `unshield(toAddress, amount)`

Withdraw from the privacy pool back to a public address.

```typescript
const txHash = await client.unshield("0xMyWallet...", ethers.parseEther("0.001"));
```

- Encodes the recipient address in the unshield note's NPK field
- The contract unwraps WcBTC back to native cBTC and sends to the recipient

### `getMasterPublicKey()`

Return the Master Public Key (a single field element).

```typescript
const mpk = client.getMasterPublicKey(); // bigint
```

### `getViewingPublicKey()`

Return the viewing public key as a JSON string for key registration.

```typescript
const vpk = await client.getViewingPublicKey();
// '{"x":"0x...","y":"0x..."}'
```

## Modules

| Module | File | Purpose |
|---|---|---|
| Client | `client.ts` | High-level API (ShadeClient class) |
| Keys | `keys.ts` | Key derivation from wallet signature |
| Notes | `notes.ts` | Note creation, commitment computation, nullifier derivation |
| Encryption | `encryption.ts` | XChaCha20-Poly1305 encryption, ECDH key exchange |
| Witness | `witness.ts` | Witness construction for the JoinSplit circuit |
| Prover | `prover.ts` | HTTP client for the prover server |
| Sync | `sync.ts` | Balance synchronization with the indexer |
| Types | `types.ts` | Shared type definitions and constants |

## Dependencies

| Package | Purpose |
|---|---|
| `ethers` | Ethereum provider, contract interaction, ABI encoding |
| `circomlibjs` | Poseidon hash, BabyJubjub curve operations, EdDSA |
| `@noble/ciphers` | XChaCha20-Poly1305 symmetric encryption |
| `@noble/hashes` | SHA-256, keccak256 for key derivation |

## Type checking

```bash
cd packages/sdk
npx tsc
```

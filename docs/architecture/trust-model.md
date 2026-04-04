---
sidebar_position: 2
title: Trust Model
---

# Trust Model

Shade Protocol's trust model has two distinct layers: **on-chain privacy** (trustless) and **prover-side visibility** (trusted or self-hosted).

## On-chain privacy

On-chain privacy is unconditional. Third parties, chain observers, and other users cannot determine:

- Who sent a private transfer
- Who received it
- How much was transferred
- Which notes were consumed
- Any user's total shielded balance

This holds for all transactions verified by the Groth16 proof system. The only publicly visible information is that *some* private transaction occurred.

## Prover server visibility

ZK proof generation happens on a server (rapidsnark, under 1 second) instead of in the browser (snarkjs WASM, 15-45 seconds). The server receives the **witness** (private inputs) to generate the proof.

### What the server sees

- Which notes are being spent
- Transaction amounts
- Recipient identifiers

### What the server does NOT have

- The user's **spending key** — the user signs transactions with their own wallet
- The ability to spend funds — only the wallet holder can authorize transactions
- Control over the user's notes — keys are derived from the wallet signature

### The comparison

This is the same trust model as using any web wallet: the user trusts the server they connect to. The difference is that the Shade prover is **open-source and self-hostable**, allowing verification and independent operation.

## Self-hosting

Users who do not want to trust the Shade prover server can run their own. The prover is:

- Open-source (MIT license)
- Packaged as a single Docker container
- Stateless — no database, just witness in, proof out
- Only needs the circuit artifacts (`.wasm` + `.zkey` files)

With a self-hosted prover, the trust requirement is eliminated entirely. The user's private transaction data never leaves their own machine.

```bash
# Run the prover locally
docker run -p 5000:5000 \
  -v ./artifacts:/app/artifacts \
  shade-prover
```

Then configure the SDK or frontend to point to `http://localhost:5000` instead of `prover.shade-protocol.com`.

## Non-custodial design

All critical protocol data is available on-chain or via public repositories:

| Component | Source | Required? |
|---|---|---|
| Smart contracts | On-chain (Citrea mainnet) | Yes |
| Public key registry | On-chain ([ShadeKeyRegistry](/contracts#shadekeyregistry)) | Yes |
| Merkle tree state | Reconstructable from on-chain events | Yes |
| Circuit artifacts | [GitHub](https://github.com/shadeprotocolcom/circuits/tree/main/build) | Yes |
| Indexer | [Open source](https://github.com/shadeprotocolcom/indexer) | Convenience (can self-host) |
| Prover | [Open source](https://github.com/shadeprotocolcom/prover) | Convenience (can self-host) |
| Frontend | [Open source](https://github.com/shadeprotocolcom/frontend) | Convenience (can self-host) |

If the official infrastructure (shade-protocol.com) goes offline, any third party can reconstruct the full protocol state from the blockchain and operate independently.

## tx.origin linkage

Without a relayer, calling `transact()` reveals the caller's Ethereum address on-chain. This links a public address to the fact that a private transaction occurred, though not to its contents. A relayer is planned for Phase 2 to eliminate this linkage.

## Gas requirement

Users need public cBTC in their wallet to pay gas for every transaction (shield, transact, unshield). A user who shields all their cBTC cannot make further transactions. The frontend warns users to keep a small cBTC reserve for gas.

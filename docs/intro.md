---
slug: /
sidebar_position: 1
title: Introduction
---

# Shade Protocol

Shade Protocol is a privacy system for [Citrea](https://citrea.xyz), a Bitcoin Layer 2 network (chain ID 4114). It enables users to transact with **shielded cBTC (scBTC)** — the same value as cBTC, but with full on-chain privacy. No observer can see balances, transaction amounts, or counterparties.

## What can users do?

| Action | Description |
|---|---|
| **Shield** | Convert cBTC to scBTC with one click. The contract auto-wraps native cBTC into WcBTC internally. |
| **Send** | Send scBTC to any Ethereum-style address that has a Shade account. Transfers are private and instant. |
| **Receive** | Automatic. Incoming scBTC appears in the balance when the recipient opens the app. |
| **Unshield** | Convert scBTC back to cBTC and withdraw to any address. |

## How it works

Shade Protocol uses a UTXO-based privacy model with Groth16 zero-knowledge proofs. When a user shields cBTC, the protocol creates encrypted **notes** (commitments) in a Poseidon Merkle tree. Private transfers consume existing notes and produce new ones, proving balance preservation without revealing any details. ZK proofs are generated server-side using [rapidsnark](https://github.com/nicklasso/rapidsnark) in under one second.

The architecture follows [RAILGUN](https://railgun.org)'s proven patterns — a clean-room implementation inspired by the same cryptographic design that has secured over $4.5 billion in cumulative volume across Ethereum, Polygon, Arbitrum, and BSC.

## Key properties

- **On-chain privacy**: third parties, chain observers, and other users see nothing
- **No new address format**: users send scBTC to standard `0x` addresses
- **Deterministic keys**: derived from a wallet signature, re-derivable anytime, no mnemonic needed
- **Self-hostable**: the prover server is open-source and runs as a single Docker container
- **Citrea-native**: optimized for cBTC, 2-second blocks, and the 10M gas block limit

## Quick links

- [Architecture Overview](/architecture/overview)
- [Trust Model](/architecture/trust-model)
- [SDK Reference](/sdk)
- [Website](https://shade-protocol.com)
- [GitHub](https://github.com/shadeprotocolcom)

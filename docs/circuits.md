---
sidebar_position: 3
title: Circuits
---

# Circuits

The ZK circuit is the cryptographic core of Shade Protocol. It proves that a private transaction is valid without revealing any details about the notes, amounts, or participants.

**Source:** [`packages/circuits/`](https://github.com/shadeprotocolcom/shade-protocol/tree/main/packages/circuits)

## JoinSplit circuit

Shade Protocol uses a single circuit template: `JoinSplit(2, 2, 16)` — 2 inputs, 2 outputs, Merkle tree depth 16.

```circom
template JoinSplit(nInputs, nOutputs, TreeDepth)
```

### Public signals

| Signal | Type | Description |
|---|---|---|
| `merkleRoot` | `field` | Current root of the Poseidon Merkle tree |
| `boundParamsHash` | `field` | Hash binding chain ID, tree number, unshield flag, and ciphertext |
| `nullifiers[2]` | `field[2]` | Nullifiers for the consumed input notes |
| `commitmentsOut[2]` | `field[2]` | Commitment hashes for the new output notes |

### Private signals

| Signal | Type | Description |
|---|---|---|
| `token` | `field` | Token identifier hash |
| `publicKey[2]` | `field[2]` | Spending public key (BabyJubjub x, y) |
| `signature[3]` | `field[3]` | EdDSA-Poseidon signature (R8x, R8y, S) |
| `randomIn[2]` | `field[2]` | Random scalars for input note NPKs |
| `valueIn[2]` | `field[2]` | Input note values |
| `pathElements[2][16]` | `field[2][16]` | Merkle authentication paths |
| `leavesIndices[2]` | `field[2]` | Leaf positions in the tree |
| `nullifyingKey` | `field` | Nullifying key for nullifier derivation |
| `npkOut[2]` | `field[2]` | Note public keys for output notes |
| `valueOut[2]` | `field[2]` | Output note values |

## Constraint steps

The circuit enforces these constraints in order:

### 1. Message hash

All public signals are hashed into a single Poseidon digest:

```
message = Poseidon(merkleRoot, boundParamsHash, nullifiers[0], nullifiers[1],
                   commitmentsOut[0], commitmentsOut[1])
```

### 2. Signature verification

An EdDSA-Poseidon signature over the message is verified against the spending public key. This proves the transaction was authorized by the key holder.

### 3. Master Public Key derivation

```
MPK = Poseidon(publicKey[0], publicKey[1], nullifyingKey)
```

### 4. Input note verification

For each input note:

- **Nullifier check**: `nullifiers[i] == Poseidon(nullifyingKey, leavesIndices[i])`
- **NPK derivation**: `NPK = Poseidon(MPK, randomIn[i])`
- **Commitment**: `commitment = Poseidon(NPK, token, valueIn[i])`
- **Merkle proof**: verify that `commitment` exists at `leavesIndices[i]` in the tree

Dummy inputs (value = 0) bypass the Merkle check:
```
valueIn[i] * (merkleRoot - computedRoot) === 0
```

### 5. Output note verification

For each output note:

- **Range check**: `valueOut[i]` must fit in 120 bits (via `Num2Bits(120)`)
- **Commitment**: `commitmentsOut[i] == Poseidon(npkOut[i], token, valueOut[i])`

### 6. Balance check

```
sum(valueIn) == sum(valueOut)
```

No value is created or destroyed.

## Circuit files

| File | Purpose |
|---|---|
| `src/joinsplit.circom` | Main JoinSplit template |
| `src/main.circom` | Instantiation: `JoinSplit(2, 2, 16)` |
| `src/merkle.circom` | Binary Poseidon Merkle proof verifier |
| `src/nullifier.circom` | Nullifier derivation and verification |

## Dependencies

- [circomlib](https://github.com/iden3/circomlib) — Poseidon, BabyJubjub, EdDSA, Num2Bits, comparators
- [Circom 2.0.6](https://docs.circom.io/) — circuit compiler

## Trusted setup

Groth16 requires a trusted setup ceremony:

1. **Phase 1** (Powers of Tau): reuses the Hermez/Tornado Cash ceremony (public, up to 2^20 constraints)
2. **Phase 2** (circuit-specific): requires a minimum of 3-5 participants
3. **Output**: `joinsplit.zkey` (proving key) and `Verifier.sol` (on-chain verifier)

The development setup uses a single participant. A proper multi-participant ceremony is required before accepting significant deposits on mainnet.

## Building

```bash
cd packages/circuits
bash scripts/build.sh
```

This compiles the circuit, runs the trusted setup, and exports:
- `artifacts/joinsplit.wasm` — WASM witness calculator
- `artifacts/joinsplit.zkey` — Groth16 proving key
- `artifacts/Verifier.sol` — Solidity verifier contract

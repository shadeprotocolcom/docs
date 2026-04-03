---
sidebar_position: 4
title: Note Format
---

# Note Format

Notes are the fundamental data structure in Shade Protocol. Each note represents a private balance entry in the UTXO set, stored as a commitment in the Poseidon Merkle tree.

## Note structure

```typescript
Note {
  npk: bytes32     // Note Public Key: Poseidon(masterPublicKey, random)
  token: bytes32   // Token identifier: keccak256(tokenType, address, subID) % SNARK_FIELD
  value: uint120   // Note value (max ~1.33 * 10^36)
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `npk` | `bytes32` | Unique per note. Derived as `Poseidon(MPK, random)` where `random` is a fresh random scalar chosen by the sender. This acts as a stealth address. |
| `token` | `bytes32` | Hash of the token metadata: `keccak256(abi.encodePacked(tokenType, tokenAddress, tokenSubID)) % SNARK_SCALAR_FIELD`. For MVP, this is always the WcBTC token hash. |
| `value` | `uint120` | The amount held by this note. Limited to 120 bits by a range check in the ZK circuit to prevent overflow attacks. |

## Commitment

The commitment is the Merkle tree leaf — a single field element that hides the note's contents:

```
Commitment = Poseidon(npk, token, value)
```

This is a 3-input Poseidon hash (using the `PoseidonT4` contract on-chain, which takes 3 inputs + 1 for the internal state). The commitment reveals nothing about the note without knowledge of the preimage fields.

### On-chain computation

```solidity
bytes32 commitmentHash = PoseidonT4.poseidon(
    [preimage.npk, tokenHash, bytes32(uint256(preimage.value))]
);
```

## Nullifier

The nullifier is a deterministic value that marks a note as spent, without revealing which note it corresponds to:

```
Nullifier = Poseidon(nullifyingKey, leafIndex)
```

### Properties

- **Deterministic**: the same note always produces the same nullifier
- **Unlinkable**: knowing the nullifier does not reveal the note's contents or its position in the tree (without the nullifying key)
- **Unique**: each leaf index produces exactly one nullifier per user
- **Efficient scanning**: derived from leaf index (not note content), enabling O(1) lookup

### Why leaf index?

RAILGUN derives nullifiers from `Poseidon(nullifyingKey, leafIndex)` rather than from the note commitment. This design choice enables efficient wallet scanning: the client only needs to track leaf indices, not recompute commitments for every possible note.

## Zero-value notes

The circuit supports **dummy notes** with `value = 0`. These are used to pad transactions that need fewer than 2 inputs or 2 outputs (the circuit is fixed at 2-in, 2-out).

Dummy input notes bypass the Merkle inclusion check via the constraint:

```
valueIn[i] * (merkleRoot - computedRoot) === 0
```

If `valueIn[i]` is zero, the constraint is trivially satisfied regardless of the Merkle proof. This avoids requiring a real Merkle path for padding inputs.

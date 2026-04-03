---
sidebar_position: 5
title: Transaction Flow
---

# Transaction Flow

Shade Protocol supports three operations: **shield** (deposit), **transact** (private transfer), and **unshield** (withdraw). All three interact with the `ShadePool` contract on Citrea mainnet.

## Shield (deposit)

Shielding converts public cBTC into a private note in the Merkle tree.

```
User                    Frontend/SDK                Contract
 │                          │                          │
 │  Enter amount            │                          │
 │─────────────────────────>│                          │
 │                          │                          │
 │                          │  Create note for self    │
 │                          │  (NPK, token, value)     │
 │                          │                          │
 │                          │  Encrypt note with own   │
 │                          │  viewing public key      │
 │                          │                          │
 │  Confirm transaction     │                          │
 │─────────────────────────>│                          │
 │                          │                          │
 │                          │  shield{value: amount}   │
 │                          │  (preimage, ciphertext)  │
 │                          │─────────────────────────>│
 │                          │                          │
 │                          │                          │  Wrap cBTC → WcBTC
 │                          │                          │  Compute commitment
 │                          │                          │  Insert into Merkle tree
 │                          │                          │  Emit Shield event
 │                          │                          │
 │                          │       tx receipt         │
 │                          │<─────────────────────────│
```

**Steps:**

1. User specifies the cBTC amount to shield
2. SDK creates a note with `NPK = Poseidon(userMPK, random)`
3. SDK encrypts the note with the user's own viewing public key
4. User calls `shield{value: amount}(requests)` sending native cBTC
5. Contract wraps cBTC to WcBTC internally via `TokenGuard`
6. Contract computes `commitment = PoseidonT4(npk, tokenHash, value)`
7. Commitment is inserted into the binary Poseidon Merkle tree
8. `Shield` event is emitted for wallet scanning

## Transact (private transfer)

Private transfers consume existing notes and create new ones, without revealing amounts or participants.

```
User                    Frontend/SDK              Prover            Contract
 │                          │                       │                  │
 │  Recipient + amount      │                       │                  │
 │─────────────────────────>│                       │                  │
 │                          │                       │                  │
 │                          │  Lookup recipient key │                  │
 │                          │  from indexer          │                  │
 │                          │                       │                  │
 │                          │  Select input notes   │                  │
 │                          │  (greedy, largest     │                  │
 │                          │   first, max 2)       │                  │
 │                          │                       │                  │
 │                          │  Build output notes:  │                  │
 │                          │  - Recipient note     │                  │
 │                          │  - Change note (self) │                  │
 │                          │                       │                  │
 │                          │  Fetch Merkle paths   │                  │
 │                          │  from indexer          │                  │
 │                          │                       │                  │
 │                          │  Build witness        │                  │
 │                          │  POST /prove          │                  │
 │                          │──────────────────────>│                  │
 │                          │                       │                  │
 │                          │  Groth16 proof (<1s)  │                  │
 │                          │<──────────────────────│                  │
 │                          │                       │                  │
 │  Confirm transaction     │                       │                  │
 │─────────────────────────>│                       │                  │
 │                          │                       │                  │
 │                          │  transact(proof, root, nullifiers,      │
 │                          │    commitments, boundParams)             │
 │                          │─────────────────────────────────────────>│
 │                          │                                          │
 │                          │        Verify proof, mark nullifiers,    │
 │                          │        insert new commitments            │
 │                          │        Emit Transact + Nullified events  │
```

**Steps:**

1. SDK looks up the recipient's Shade public key from the indexer (`GET /keys/:address`)
2. SDK selects unspent input notes (greedy selection, largest first, max 2 inputs)
3. SDK creates output notes: one for the recipient, one change note for the sender (if needed)
4. SDK encrypts each output note with the correct recipient's viewing public key
5. SDK fetches Merkle authentication paths from the indexer (`GET /merkle/path/:index`)
6. SDK builds the witness and sends it to the prover server (`POST /prove`)
7. Prover generates the Groth16 proof in under 1 second
8. User submits the transaction to `ShadePool.transact()`
9. Contract verifies the proof, checks nullifiers are unspent, validates the Merkle root
10. Nullifiers are marked as spent, new commitments are inserted
11. `Transact` and `Nullified` events are emitted

## Unshield (withdraw)

Unshielding is a special case of `transact()` where one output note encodes the recipient's Ethereum address instead of a Note Public Key.

**Key differences from a regular transact:**

- The `BoundParams.unshield` flag is set to `NORMAL` (1)
- The last output commitment uses the recipient's address (as a `uint160`) in the NPK field
- The contract verifies that the unshield preimage hashes to the last commitment
- After proof verification, the contract unwraps WcBTC back to native cBTC and sends it to the recipient

```
// The unshield note uses the recipient address as NPK
unshieldNote = {
  npk: uint256(recipientAddress),  // 0xABC... as a number
  token: tokenId,
  value: amount
}
```

The circuit treats this as a normal output note for balance checking purposes (`sumIn == sumOut`), but the contract intercepts it and transfers tokens instead of inserting it into the Merkle tree.

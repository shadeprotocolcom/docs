---
sidebar_position: 6
title: Note Encryption
---

# Note Encryption

Notes emitted in `Transact` events must be encrypted so that only the intended recipient can read them. Without encryption, the event data would leak note values, recipients, and token types to all chain observers.

## Encryption scheme

Shade Protocol uses **XChaCha20-Poly1305** for symmetric encryption and **ECDH over BabyJubjub** for key exchange.

### Key exchange (ECDH)

1. The sender generates an ephemeral BabyJubjub keypair `(ephPriv, ephPub)`
2. The sender computes a shared secret: `sharedSecret = ECDH(ephPriv, recipientViewingPubKey)`
3. The shared secret is used to derive the symmetric encryption key
4. The ephemeral public key is stored in the event data so the recipient can reconstruct the shared secret

The recipient reverses the process:

```
sharedSecret = ECDH(recipientViewingKey, ephemeralPubKey)
```

Both sides arrive at the same shared secret because ECDH is commutative on BabyJubjub.

### Symmetric encryption

The plaintext (note data: NPK, random, token, value) is encrypted using XChaCha20-Poly1305:

- **Algorithm**: XChaCha20-Poly1305 (via `@noble/ciphers`)
- **Key**: derived from the ECDH shared secret
- **Nonce**: 24 bytes (XChaCha20 extended nonce)
- **Authentication**: Poly1305 MAC ensures ciphertext integrity

## Event data layout

### Shield events

```solidity
ShieldCiphertext {
  bytes32[3] encryptedBundle  // First 96 bytes of the XChaCha20 ciphertext
  bytes32 shieldKey           // Ephemeral public key x-coordinate
}
```

Shield ciphertexts store the first 96 bytes of encrypted data. The shielder is the recipient of their own shield, so they have direct access to the note data and do not need to decrypt from on-chain events.

### Transact events

```solidity
CommitmentCiphertext {
  bytes32[4] ciphertext                 // 128 bytes of encrypted note data
  bytes32 blindedSenderViewingKey       // Ephemeral public key x-coordinate
  bytes32 blindedReceiverViewingKey     // Ephemeral public key y-coordinate
  bytes annotationData                  // Remaining ciphertext bytes + nonce
  bytes memo                            // Reserved for future use
}
```

The ciphertext fields are included in the `boundParamsHash` computation, which binds them to the ZK proof. This prevents frontrunning attacks where an attacker could swap the ciphertext to redirect funds.

## Balance scanning

When a user opens the app, the SDK fetches all `Transact` events from the indexer and attempts to decrypt each `CommitmentCiphertext` using the user's viewing key:

1. Extract the ephemeral public key from `blindedSenderViewingKey` and `blindedReceiverViewingKey`
2. Compute the ECDH shared secret using the user's viewing private key
3. Derive the symmetric decryption key
4. Attempt XChaCha20-Poly1305 decryption
5. If decryption succeeds (Poly1305 MAC validates), the note belongs to this user
6. If decryption fails, the note belongs to someone else — skip it

This trial-decryption approach means the indexer never learns which notes belong to which user. The scanning happens entirely client-side within the SDK.

## Libraries

| Component | Library | Purpose |
|---|---|---|
| XChaCha20-Poly1305 | `@noble/ciphers` | Symmetric authenticated encryption |
| BabyJubjub ECDH | `circomlibjs` | Elliptic curve Diffie-Hellman key exchange |
| Key derivation | `@noble/hashes` | SHA-256 / keccak for key material derivation |

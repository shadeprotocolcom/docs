---
sidebar_position: 3
title: Key Hierarchy
---

# Key Hierarchy

Shade Protocol derives all cryptographic keys deterministically from a single wallet signature. The same wallet plus the same message always produces the same keys — no mnemonic or seed phrase is needed.

## Derivation flow

```
User connects wallet (0xABC...)
  └── Signs deterministic message: "Shade Protocol Key Derivation v1"
        └── Signature (secp256k1) → keccak256 hash → seed
              │
              ├── Spending Key
              │     BabyJubjub private scalar, derived from seed.
              │     Used to sign transaction witnesses (EdDSA-Poseidon).
              │     └── Spending Public Key
              │           BabyJubjub point on the curve.
              │
              ├── Viewing Key
              │     Derived from seed. Used for:
              │     - Note encryption / decryption (ECDH key exchange)
              │     - Balance scanning (decrypt incoming notes)
              │     └── Viewing Public Key
              │           BabyJubjub point. Registered with the indexer
              │           for recipient lookups.
              │
              ├── Nullifying Key
              │     Poseidon(spendingKey). Used to compute nullifiers
              │     that prove note consumption without revealing which
              │     note was spent.
              │
              └── Master Public Key (MPK)
                    Poseidon(spendPK.x, spendPK.y, nullifyingKey)
                    A single field element that identifies the user.
                    │
                    └── Note Public Key (NPK) — per note
                          Poseidon(MPK, random)
                          Each note gets a unique NPK, enabling stealth
                          addresses. The random value is chosen by the
                          sender.
```

## Key purposes

| Key | Curve / Hash | Purpose |
|---|---|---|
| Spending Key | BabyJubjub scalar | Sign witness messages (EdDSA-Poseidon) |
| Spending Public Key | BabyJubjub point | Verified inside the ZK circuit |
| Viewing Key | BabyJubjub scalar | ECDH key exchange for note encryption |
| Viewing Public Key | BabyJubjub point | Published to key registry for recipient lookup |
| Nullifying Key | Poseidon hash | Compute nullifiers: `Poseidon(nullifyingKey, leafIndex)` |
| Master Public Key | Poseidon hash | Derive per-note public keys (NPK) |
| Note Public Key | Poseidon hash | Unique per note: `Poseidon(MPK, random)` |

## Deterministic re-derivation

Keys are never stored on the server. When a user returns to the app, they sign the same canonical message again. Because Ethereum wallets produce deterministic signatures for identical messages, the same keys are re-derived every time.

This approach has a security advantage: no key material persists in browser storage. The trade-off is one extra signature prompt when the user opens the app.

## Key registration

When a user first connects, their viewing public key and master public key are registered with the indexer:

```
POST /keys/register
{
  "ethAddress": "0xABC...",
  "shadePublicKey": "{\"viewingPublicKey\":{\"x\":\"0x...\",\"y\":\"0x...\"},\"masterPublicKey\":\"0x...\"}"
}
```

This mapping allows senders to look up a recipient's public key by their standard Ethereum address. No new address format is required — users send scBTC to normal `0x` addresses.

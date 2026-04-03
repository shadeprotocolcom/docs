---
sidebar_position: 7
title: Risks
---

# Risks

This page documents the known risks and limitations of Shade Protocol. Understanding these is essential for users, developers, and auditors.

## Trusted setup {#trusted-setup}

Groth16 requires a trusted setup ceremony. A compromised setup enables an attacker to forge proofs and steal all funds in the pool.

**Current state:** the development setup uses a single participant. This is acceptable for testing but must be replaced before accepting significant deposits.

**Trusted setup process:**

1. **Phase 1 (Powers of Tau):** Shade reuses the Hermez/Tornado Cash ceremony (public, up to 2^20 constraints). This phase is already complete and widely trusted.
2. **Phase 2 (circuit-specific):** requires a minimum of 3-5 independent participants. As long as at least one participant is honest and destroys their toxic waste, the setup is secure.

**Mitigation:** before mainnet launch with significant TVL, a proper multi-participant ceremony must be conducted. Until then, conservative deposit caps (e.g., max 0.01 BTC per shield) limit risk exposure.

## Circuit bugs {#circuit-bugs}

A bug in the ZK circuit can be catastrophic: undetectable theft, broken privacy, or frozen funds. Circuit bugs are particularly dangerous because they cannot be patched — the circuit is embedded in the trusted setup.

**Mitigations:**

- Formal annotations on all circuit templates (`@ensures`, `@requires`, `@satisfies`)
- Exhaustive witness generation tests
- Professional circuit audit before mainnet launch
- Following RAILGUN's battle-tested circuit design patterns

## Regulatory risk {#regulatory}

Privacy protocols face increasing regulatory scrutiny:

- Tornado Cash was sanctioned by OFAC in August 2022
- RAILGUN navigates this with PPOI (Private Proofs of Innocence) — a ZK-based compliance system

Shade Protocol does not currently implement a compliance mechanism. A PPOI-style approach is planned for a later phase. Users should be aware that interacting with privacy protocols may have legal implications depending on their jurisdiction.

## Gas costs {#gas-costs}

Citrea has a 10M gas block limit with ~2-second blocks. Estimated gas costs:

| Operation | Estimated Gas |
|---|---|
| Groth16 proof verification | ~250K (BN128 precompile) |
| Merkle tree insertion (16 levels) | ~320K (16 storage writes) |
| Total shield / unshield | ~600K - 800K |
| Total private transfer | ~800K - 1M |

At these costs, Citrea can handle approximately 10-15 private transactions per block. Actual costs may differ from estimates and should be verified on mainnet.

## Privacy model {#privacy-model}

### On-chain privacy

Full privacy. No observer can determine the sender, receiver, or amount of any private transfer. This is guaranteed by the Groth16 proof system.

### Prover server visibility

The prover server receives the witness (private inputs) and has full visibility into transaction details. See the [Trust Model](/architecture/trust-model) for details. Users can eliminate this trust requirement by [self-hosting the prover](/infrastructure/prover#self-hosting).

### tx.origin linkage

Without a relayer, calling `transact()` reveals the caller's Ethereum address on-chain. This links a public address to the fact that a private transaction occurred (but not to its contents).

**Impact:** an observer can see that address `0xABC` made a private transaction, but cannot determine what was sent, to whom, or how much.

**Mitigation:** a relayer is planned for Phase 2 to break this linkage.

### Gas requirement

Users need public cBTC to pay gas for every transaction. This means:

- A user who shields **all** their cBTC cannot transact further
- The frontend warns users to keep a small cBTC reserve
- Gas payments create a public trace (address `0xABC` paid gas), linking the wallet to private activity

## Tree capacity {#tree-capacity}

The Merkle tree is a binary Poseidon tree of depth 16, providing a maximum capacity of 2^16 = **65,536 leaves**.

- Each `shield` creates 1 leaf
- Each `transact` creates 2 leaves (new output notes)
- At ~100 transactions per day, the tree lasts approximately 1 year

### When the tree fills up

- The contract reverts on insertion — the protocol stops accepting new transactions
- A new tree contract must be deployed or the contract must be upgraded to multi-tree support

### Mitigations

- **Monitoring:** the indexer exposes `leafCount` via `GET /merkle/root` — monitor this against the 65,536 capacity
- **Early planning:** begin the multi-tree upgrade before reaching ~50,000 leaves
- **Forward compatibility:** event signatures already include `treeNumber` for future multi-tree support, and the SDK uses `treeNumber = 0` initially

## Smart contract risks

Standard smart contract risks apply:

- **Upgrade path:** the contracts are not upgradeable. A bug requires redeployment and migration.
- **External dependencies:** PoseidonT3 and PoseidonT4 are from [zk-kit](https://github.com/privacy-scaling-explorations/zk-kit) (MIT license, audited). The verifier is generated by snarkjs.
- **Reentrancy:** the `_handleUnshield` function sends native cBTC. The contract follows checks-effects-interactions but does not use a reentrancy guard.

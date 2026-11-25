# Tacit stuck-TAC lab

Independent prototype and test notes for the Tacit stuck-TAC bounty. This repository is **not** the upstream Tacit codebase and does not modify deployed contracts, pool state, proofs, or verifying keys.

## Current finding

The upstream repository already contains a more direct primitive than the initially proposed sell-for-sats rebalance loop: a Bitcoin-to-Bitcoin swap desk in `btcswap-desk/` and `dapp/btcswap-desk.js`. It exchanges a note the Ethereum reflection proof cannot follow for tracked TAC, less a fee, using two timelocked Bitcoin locks and an adaptor/MuSig2 claim. The holder can then use the ordinary bridge on the tracked output.

That makes **option A (a bounded stuck-TAC desk)** a stronger first prototype than option B (sell for sats, then repurchase tracked TAC). It avoids relying on an unverified order-book buyback path.

## Contents

- `docs/technical-review.md` — upstream code review, architecture, risks, and what remains unverified.
- `sim/rebalance-model.mjs` — dependency-free economic model for repeated bridges.
- `tests/rebalance-model.test.mjs` — offline accounting and safety tests.

## Run the offline model

Requires Node.js 18+:

```sh
node tests/rebalance-model.test.mjs
node sim/rebalance-model.mjs
```

These tests validate accounting and configured floors only. They do **not** execute Bitcoin transactions, cryptographic signing, proof generation, Ethereum settlement, or a live order-book trade.

## Upstream references

- [Stuck TAC bounty](https://github.com/z0r0z/tacit/blob/main/docs/STUCK-TAC-BOUNTY.md)
- [Bitcoin-to-Bitcoin swap desk README](https://github.com/z0r0z/tacit/blob/main/btcswap-desk/README.md)
- [Desk server](https://github.com/z0r0z/tacit/blob/main/btcswap-desk/server.mjs)
- [Desk implementation](https://github.com/z0r0z/tacit/blob/main/dapp/btcswap-desk.js)
- [Fast-bridge provider README](https://github.com/z0r0z/tacit/blob/main/fastbridge-lp/README.md)

## Status

Research prototype only. No live funds are handled. No PR or bounty claim has been submitted.

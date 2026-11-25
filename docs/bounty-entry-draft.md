# Bounty entry draft: bounded Bitcoin TAC recovery desk

## Proposal

Use the existing Bitcoin-to-Bitcoin swap desk as the recovery path for TAC notes that the Ethereum reflection proof cannot carry. A holder offers a stuck Bitcoin TAC note; a separately funded desk pays a tracked TAC note on Bitcoin at a disclosed, bounded discount. The holder then uses the existing bridge with the tracked output. The desk claims the stuck input through the existing two-lock/adaptor-signature flow.

This is option A in the bounty. It reuses the existing desk implementation rather than inventing an order-book sell-and-rebuy loop. The lab does not modify deployed contracts, the live pool, proof system, verifying key, or existing provider/page wire formats. It does not custody users' funds under one shared key.

## What it assumes

- The desk is explicitly enabled and funded by an operator with tracked Bitcoin TAC inventory.
- The desk verifies the input's current spend status and lineage; only an input classified as stuck by the agreed policy is eligible.
- The desk pays only outputs classified exactly as `tracked`; missing, unread, unknown, or untracked inventory fails closed.
- Quotes include a fixed, disclosed fee/haircut, amount bounds, expiry, and confirmation/timelock margins.
- A holder can independently complete the ordinary bridge after receiving the tracked note.

The client page currently has no production desk endpoint configured (`DESK = null`), and the upstream desk is described as built but not running. This entry therefore proposes a bounded activation/integration path, not a claim that a public production desk is already operating.

## Numerical example: provider inventory after N bridges

Assume a provider starts with 10,000 TAC of Ethereum-side lendable inventory and completes 10 bridges of 1,000 TAC each. Five Bitcoin outputs are stuck; five are bridgeable. Assume the desk can service all five stuck notes at a 1% haircut, with no other costs, delays, defaults, or liquidity constraints.

| Outcome after 10 bridges | Without recovery desk | With recovery desk |
|---|---:|---:|
| Starting lendable inventory | 10,000 TAC | 10,000 TAC |
| Stuck outputs recoverable | 0 TAC | 5 × 990 = 4,950 TAC |
| Ending lendable inventory | 5,000 TAC | 9,950 TAC |

The five clean outputs are assumed to round-trip normally and therefore do not change net inventory. Each stuck 1,000 TAC output permanently reduces inventory by 1,000 TAC without the desk; with the desk it reduces inventory by only the 10 TAC fee. This is an illustrative accounting scenario, not a market quote or liquidity guarantee. The executable model uses integer 8-decimal TAC base units.

## Safety limits and risks

- **Inventory exhaustion:** refuse quotes when tracked desk inventory is insufficient; never promise an unfunded output.
- **Lineage uncertainty:** reject unknown/unread classifications; never treat a failed read as proof that a note is stuck or tracked.
- **Abandoned swaps / timelocks:** cap open swaps and total locked value; expose refund state and alert on overdue sessions.
- **Double-spend, reorg, stale chain data:** require confirmation thresholds and consistent chain reads before advancing a phase.
- **Restart/replay bugs:** persist swap phases durably, serialize note selection, and make each phase idempotent.
- **Uneconomic pricing:** apply explicit fee and minimum-output floors; do not silently lower limits to clear inventory.
- **Operational key risk:** isolate desk inventory and signing keys; do not place user funds under a common custody key.

## Tests and what remains untested

The lab CI runs the upstream offline Bitcoin desk simulation and reflection/key-path compatibility tests, plus the lab's offline accounting tests. The complete workflow passed in run #3 and again in run #4: the lab accounting-model tests, upstream Bitcoin desk simulation, and reflection/key-path compatibility test all completed successfully.

Not tested here: a Signet end-to-end swap; a real reflection proof generated from a desk output; Bitcoin reorgs and explorer disagreement; crash/restart at every signing phase; a live Ethereum mint; production desk liquidity, pricing, monitoring, and operator runbooks. No mainnet funds or production secrets have been used.

## Review status

This is a reviewable design/prototype note, not yet a complete bounty implementation or a pull request to the upstream repository. Before production use, add and pass a Signet integration test for the complete stuck-input → tracked-output → holder-claim → desk-claim → bridge-review path, then integrate only the minimal optional client/server activation needed.
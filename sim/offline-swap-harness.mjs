// Deterministic offline lifecycle harness for the stuck-TAC desk.
// This models protocol state and safety gates; it does not create/sign Bitcoin transactions.
export function createSwapHarness({ store = new Map(), csvDesk = 144, minConfirmations = 2 } = {}) {
  const read = (id) => structuredClone(store.get(id) ?? null);
  const write = (id, patch) => {
    const old = read(id);
    const next = { ...old, ...structuredClone(patch), revision: (old?.revision ?? 0) + 1 };
    store.set(id, next);
    return read(id);
  };
  function create({ id, amount, fee, holderLock, deskInventory, tracking = 'tracked', confirmations = 0 }) {
    if (read(id)) throw new Error('swap already exists');
    if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(fee) || fee < 0 || fee >= amount) throw new Error('invalid quote');
    if (!holderLock?.txid || !Number.isInteger(holderLock.csvRemaining) || holderLock.csvRemaining <= csvDesk + 12) throw new Error('insufficient holder refund margin');
    return write(id, { id, phase: 'accepted', amount, fee, out: amount - fee, holderLock, deskInventory, tracking, confirmations, revision: 0, events: ['accepted'] });
  }
  function advance(id, evidence = {}) {
    const s = read(id);
    if (!s) throw new Error('unknown swap');
    const move = (phase, event, extra = {}) => write(id, { phase, events: [...s.events, event], ...extra });
    switch (s.phase) {
      case 'accepted':
        if (s.tracking !== 'tracked') return move('refused', 'desk-inventory-not-tracked');
        if (s.deskInventory < s.out) return move('refused', 'insufficient-desk-inventory');
        return move('holder-locked', 'holder-lock-confirmed', { confirmations: evidence.confirmations ?? s.confirmations });
      case 'holder-locked':
        if ((evidence.confirmations ?? s.confirmations) < minConfirmations) return s;
        if (evidence.chainAgreement !== true) return move('paused', 'chain-evidence-disagreement');
        return move('desk-locked', 'desk-lock-broadcast', { deskPaid: s.out, deskLockHeight: evidence.height ?? 100 });
      case 'desk-locked':
        if (evidence.holderClaim === true) return move('holder-claimed', 'holder-claim-confirmed', { secretRecovered: true });
        if ((evidence.height ?? 0) >= s.deskLockHeight + csvDesk) return move('desk-refunded', 'desk-timeout-refund');
        return s;
      case 'holder-claimed':
        if (evidence.deskClaim === true && s.secretRecovered) return move('complete', 'desk-claim-confirmed');
        return s;
      case 'paused':
        if (evidence.chainAgreement !== true) return s;
        return move('holder-locked', 'chain-evidence-reconciled');
      default:
        return s;
    }
  }
  function holderRefund(id, evidence = {}) {
    const s = read(id);
    if (!s) throw new Error('unknown swap');
    if (!['accepted', 'holder-locked', 'refused'].includes(s.phase)) throw new Error('holder refund unavailable in current phase');
    if ((evidence.height ?? 0) < s.holderLock.csvHeight) throw new Error('holder refund timelock not reached');
    return write(id, { phase: 'holder-refunded', events: [...s.events, 'holder-refund-confirmed'] });
  }
  return { create, advance, holderRefund, get: read };
}

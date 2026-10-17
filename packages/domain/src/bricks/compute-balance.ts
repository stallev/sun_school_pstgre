/** bricks_ledger_contract §3 — balance is always derived, never stored. */
export type BricksBalanceSnapshot = {
  earned: number;
  issued: number;
  balance: number;
  needsAttention: boolean;
};

/** `balance = earned − issued`; `needsAttention` when balance < 0 (INV-18). */
export const computeBalance = (earned: number, issued: number): BricksBalanceSnapshot => {
  const balance = earned - issued;
  return {
    earned,
    issued,
    balance,
    needsAttention: balance < 0,
  };
};

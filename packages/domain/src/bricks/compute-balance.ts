/** bricks_ledger_contract §3 — balance is always derived, never stored. */
export type BricksBalanceSnapshot = {
  earned: number;
  issued: number;
  balance: number;
  needsAttention: boolean;
  checkPoints: number;
  achievementBonus: number;
  penaltiesTotal: number;
};

export type BricksBalanceComponents = {
  checkPoints: number;
  achievementBonus: number;
  penaltiesTotal: number;
  issued: number;
};

/** `набрано = очки_проверок + бонус − штрафы` when achievements flag is on (§3). */
export const buildBricksBalanceSnapshot = (
  components: BricksBalanceComponents,
  achievementsEnabled: boolean,
): BricksBalanceSnapshot => {
  const achievementBonus = achievementsEnabled ? components.achievementBonus : 0;
  const penaltiesTotal = achievementsEnabled ? components.penaltiesTotal : 0;
  const earned = components.checkPoints + achievementBonus - penaltiesTotal;
  const balance = earned - components.issued;
  return {
    earned,
    issued: components.issued,
    balance,
    needsAttention: balance < 0,
    checkPoints: components.checkPoints,
    achievementBonus,
    penaltiesTotal,
  };
};

/** `balance = earned − issued`; `needsAttention` when balance < 0 (INV-18). */
export const computeBalance = (earned: number, issued: number): BricksBalanceSnapshot => {
  return buildBricksBalanceSnapshot(
    {
      checkPoints: earned,
      achievementBonus: 0,
      penaltiesTotal: 0,
      issued,
    },
    false,
  );
};

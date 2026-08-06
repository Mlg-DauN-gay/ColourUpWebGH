/* ═══════════════════════ settlement maths ═══════════════════════
   Minimal-transfer greedy method: split players into debtors and
   creditors by net; repeatedly match the largest debtor against the
   largest creditor for the smaller of the two amounts. Produces at
   most n−1 transfers.

   `net` must be an exact integer (minor currency units — see
   lib/money.js) that already sums to precisely zero across all players.
   That's what lets this use exact `=== 0` comparisons below instead of
   the epsilon-fuzz float thresholds (`< 0.005`) this used to need — the
   epsilon was papering over float error, not a real safeguard.        */
export function simplify(nets) {
  const debt = nets.filter(n => n.net < 0).map(n => ({ ...n, amt: -n.net })).sort((a, b) => b.amt - a.amt);
  const cred = nets.filter(n => n.net > 0).map(n => ({ ...n, amt: n.net })).sort((a, b) => b.amt - a.amt);
  const tx = []; let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i].amt, cred[j].amt);
    tx.push({ from: debt[i], to: cred[j], amount: amt });
    debt[i].amt -= amt; cred[j].amt -= amt;
    if (debt[i].amt === 0) i++;
    if (cred[j].amt === 0) j++;
  }
  return tx;
}

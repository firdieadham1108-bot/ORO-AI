// Simulated Orbyte Credit Wallet: a demo of a usage-based (pay-per-transaction) pricing model.
// No real money or payment service is involved.
//
// The balance is not stored in its own table. activity_log is the ledger: the balance is the starting
// amount minus 0.10 for every "orbyte_credits_deducted" row. Reset Demo State clears the log, so the
// wallet goes back to 25.00 automatically. Amounts are kept in hundredths of a credit (integers).
import { db, logActivity } from "./db";

export const CREDIT_ACTION = "orbyte_credits_deducted";
const STARTING_CENTI = 2500; // 25.00 credits
const CHARGE_CENTI = 10; // 0.10 credits per manager transaction
const ACTOR = "Orbyte Credit Wallet (simulated)";

const fmt = (centi: number) => (centi / 100).toFixed(2);

function chargesSoFar(): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM activity_log WHERE action = ?").get(CREDIT_ACTION) as { n: number };
  return Number(row.n);
}

export interface WalletState {
  balance: number;
  balanceFormatted: string;
  startingBalance: number;
  chargePerTransaction: number;
  transactionsCharged: number;
  label: string;
}

export function getWallet(): WalletState {
  const charged = chargesSoFar();
  const balanceCenti = STARTING_CENTI - charged * CHARGE_CENTI;
  return {
    balance: balanceCenti / 100,
    balanceFormatted: fmt(balanceCenti),
    startingBalance: STARTING_CENTI / 100,
    chargePerTransaction: CHARGE_CENTI / 100,
    transactionsCharged: charged,
    label: "Simulated usage-based pricing. Each manager approval or recovery swap costs 0.10 credits. Not real money.",
  };
}

/**
 * Charge one manager transaction. Call it inside the same database transaction as the approval,
 * so a refused or rolled-back approval is never charged.
 */
export function chargeTransaction(forWhat: string): void {
  const after = STARTING_CENTI - (chargesSoFar() + 1) * CHARGE_CENTI;
  logActivity(
    CREDIT_ACTION,
    `${fmt(CHARGE_CENTI)} Orbyte Credits deducted (Pay-per-transaction) for ${forWhat}. Balance: ${fmt(after)} Credits.`,
    ACTOR,
    "info",
  );
}

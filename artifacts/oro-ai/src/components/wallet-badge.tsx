// Simulated Orbyte Credit Wallet pill (usage-based pricing demo). The balance comes from the server,
// which deducts 0.10 credits per manager approval or recovery swap. Not real money.
import { useEffect, useRef, useState } from "react";
import { useGetOrbyteWallet } from "@workspace/api-client-react";
import { Wallet } from "lucide-react";

export function WalletBadge() {
  const wallet = useGetOrbyteWallet();
  const balance = wallet.data?.balance;
  const previous = useRef<number | null>(null);
  const [deducted, setDeducted] = useState<string | null>(null);

  // Briefly show "-0.10" when the balance goes down, so the charge is visible during the demo.
  useEffect(() => {
    if (balance == null) return;
    const before = previous.current;
    previous.current = balance;
    if (before == null || balance >= before) return;
    setDeducted(`-${(before - balance).toFixed(2)}`);
    const t = setTimeout(() => setDeducted(null), 2600);
    return () => clearTimeout(t);
  }, [balance]);

  return (
    <span
      className={`wallet-pill ${deducted ? "charged" : ""}`}
      title={wallet.data?.label ?? "Simulated usage-based pricing. Not real money."}
      data-testid="badge-wallet"
    >
      <Wallet size={12} aria-hidden />
      <span>Orbyte Credit Wallet:</span>
      <strong data-testid="text-wallet-balance">
        {wallet.data ? `${wallet.data.balanceFormatted} Credits` : wallet.isError ? "unavailable" : "..."}
      </strong>
      {deducted && <span className="wallet-deducted" aria-live="polite">{deducted}</span>}
    </span>
  );
}

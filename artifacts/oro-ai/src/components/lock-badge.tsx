import { Lock } from "lucide-react";
import { MANAGER_LOCK_TEXT } from "@/lib/role";

/** Shown next to manager-only buttons while the demo role is Sales Staff. */
export function LockBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 self-start rounded-full border border-[#e3c98f] bg-[#f7eedb] px-2.5 py-1 text-[11px] font-semibold text-[#8a5e14] ${className}`} data-testid="badge-locked">
      <Lock size={12} /> {MANAGER_LOCK_TEXT}
    </span>
  );
}

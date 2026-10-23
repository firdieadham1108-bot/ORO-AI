// Quotation price validity vs. temporary crew-slot hold (MASTER_BRIEF.md Part 12: "give capacity holds
// their own expiry independent of quotation price validity").
//
// The price is valid for 7 days. The crew slot hold is a 30-second DEMO SIMULATION of a short hold:
// nothing is locked in the database while it runs. The real protection is at approval time, when the
// server re-checks availability inside a transaction. Once the hold expires, the approve buttons are
// disabled until the availability is re-verified (a fresh analysis), so a slot is never confirmed from
// an old check.
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, RefreshCw, Timer, TimerOff } from "lucide-react";

export const HOLD_SECONDS = 30;
export const PRICE_VALID_DAYS = 7;

export interface HoldTimer {
  remaining: number;
  fraction: number;
  expired: boolean;
  expireNow: () => void;
}

/** Counts down from `seconds` after mount. Inactive timers never expire. */
export function useHoldTimer(seconds: number, active: boolean): HoldTimer {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [forced, setForced] = useState(false);
  const leftMs = Math.max(0, seconds * 1000 - (now - startedAt));
  const expired = active && (forced || leftMs <= 0);
  useEffect(() => {
    if (!active || expired) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active, expired]);
  return {
    remaining: expired ? 0 : Math.ceil(leftMs / 1000),
    fraction: expired ? 0 : leftMs / (seconds * 1000),
    expired,
    expireNow: () => setForced(true),
  };
}

export function QuoteTerms({ hasSlot, hold, onReverify, reverifying, submitted = false }: {
  hasSlot: boolean;
  hold: HoldTimer;
  onReverify: () => void;
  reverifying: boolean;
  submitted?: boolean;
}) {
  return (
    <div className={`quote-terms ${hold.expired ? "expired" : ""}`} data-testid="quote-terms">
      <div className="flex flex-wrap gap-2">
        <span className="term-badge price" data-testid="badge-price-validity">
          <BadgeCheck size={13} aria-hidden /> Quotation Price Valid: {PRICE_VALID_DAYS} Days
        </span>
        {hasSlot && !hold.expired && (
          <span className="term-badge hold" data-testid="badge-hold">
            <Timer size={13} aria-hidden /> Availability check expires in (demo):
            <span className="hold-count" data-testid="text-hold-countdown">{hold.remaining}s left</span>
          </span>
        )}
        {hasSlot && hold.expired && (
          <span className="term-badge expired" data-testid="badge-hold-expired">
            <TimerOff size={13} aria-hidden /> Availability check expired — re-check before confirming
          </span>
        )}
      </div>
      {hasSlot && !hold.expired && (
        <div className="hold-track" aria-hidden><span style={{ width: `${hold.fraction * 100}%` }} /></div>
      )}
      <div className="sr-only" aria-live="polite">{hold.expired ? "Availability check expired. No booking was cancelled. Re-check before confirming." : ""}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[11px] leading-snug text-[#6f7a75] flex-1 min-w-[200px]">
          {!hasSlot
            ? "No available crew option was found. No slot has been reserved."
            : hold.expired
              ? "Staff records may have changed. Re-check before confirming. The timer does not cancel a quotation or change its price."
              : "This is a 30-second demo freshness check, not a crew reservation. A booking is created only after manager approval."}
        </p>
        {hasSlot && (hold.expired ? (
          <button className="btn btn-primary" onClick={onReverify} disabled={reverifying} data-testid="button-reverify">
            {reverifying ? <Loader2 className="spin" /> : <RefreshCw />} Re-check availability
          </button>
        ) : (
          <button className="btn" onClick={hold.expireNow} data-testid="button-simulate-hold-expiry">
            <TimerOff /> Demo: expire check now
          </button>
        ))}
      </div>
      <p className="mt-2 mb-0 text-xs text-muted-foreground" data-testid="text-submission-state">
        {submitted
          ? "Sent for approval. This draft stays in Pending until the manager approves or declines it, even if this check expires."
          : "Not submitted yet. Expiry does not add this quotation to Pending. Sales can send it for approval; a manager can approve an available option directly."}
      </p>
    </div>
  );
}

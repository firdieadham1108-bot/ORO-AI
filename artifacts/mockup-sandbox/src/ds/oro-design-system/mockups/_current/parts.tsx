// BASELINE: ports of artifacts/oro-ai/src/components/{quote-document,quote-terms,risk,voice-input,lock-badge}.tsx.
// Markup and class names are verbatim; API hooks are replaced by local state passed in from the page.
// The voice bar renders its idle state only (no microphone / upload / sample playback in a mockup).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertOctagon, AudioLines, BadgeCheck, CalendarX2, CheckCircle2, Download, Loader2, Lock, Mic, Play, Printer, Radio,
  RefreshCw, ShieldCheck, Timer, TimerOff, Upload, UserRoundCheck, X, XCircle,
} from "lucide-react";
import { ErrorBox } from "./shell";
import { MANAGER_LOCK_TEXT, useRole, rm, longDate, myTime } from "./lib";
import type { Commitment, Quote } from "../_shared/sample-data";

// ---------- lock-badge.tsx ----------
export function LockBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 self-start rounded-full border border-[#e3c98f] bg-[#f7eedb] px-2.5 py-1 text-[11px] font-semibold text-[#8a5e14] ${className}`} data-testid="badge-locked">
      <Lock size={12} /> {MANAGER_LOCK_TEXT}
    </span>
  );
}

// ---------- quote-document.tsx ----------
export interface QuoteDocData {
  companyName: string;
  reference: string | null;
  status: "draft" | "approved" | "at_risk";
  customerName: string;
  location: string;
  lines: Array<{ serviceName: string; quantity: number; unitPrice: number; lineTotal: number }>;
  totalPrice: number;
  requestedDate: string | null;
  promisedDate: string | null;
  crew: string[];
  crewIsProposal: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

const STATUS_BADGE: Record<QuoteDocData["status"], { cls: string; label: string }> = {
  draft: { cls: "badge-amber", label: "Draft · awaiting manager approval" },
  approved: { cls: "badge-green", label: "Approved" },
  at_risk: { cls: "badge-red", label: "Approved · At risk" },
};

export function quoteToDoc(x: Quote): QuoteDocData {
  return {
    companyName: x.companyName,
    reference: x.reference,
    status: x.riskStatus === "AT_RISK" ? "at_risk" : x.status === "approved" ? "approved" : "draft",
    customerName: x.customerName,
    location: x.location,
    lines: x.lineItems,
    totalPrice: x.totalPrice,
    requestedDate: x.requestedDate,
    promisedDate: x.appointmentDate,
    crew: x.crew,
    crewIsProposal: false,
    approvedBy: x.approvedBy,
    approvedAt: x.approvedAt,
  };
}

export function QuoteDocument({ q }: { q: QuoteDocData }) {
  const st = STATUS_BADGE[q.status];
  return (
    <article className="quote-sheet w-full" data-testid="quote-sheet">
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-extrabold m-0" style={{ fontFamily: "Manrope" }} data-testid="text-doc-title">
            {q.companyName} — Quotation {q.reference ? `#${q.reference}` : "(draft)"}
          </h2>
          <div className="text-[12px] text-[#707b7a] mt-1">Cheras, Kuala Lumpur · Synthetic demo company</div>
        </div>
        <div className="sm:text-right">
          <div className="eyebrow">Quotation no.</div>
          <div className="mono text-[15px]" data-testid="text-reference">{q.reference ?? "Assigned on approval"}</div>
          <div className="mt-2"><span className={`badge ${st.cls}`} data-testid="status-quote">{st.label}</span></div>
        </div>
      </div>
      <dl className="sheet-meta">
        <div><dt>Customer</dt><dd data-testid="text-customer">{q.customerName}</dd></div>
        <div><dt>Job location</dt><dd>{q.location}</dd></div>
        <div><dt>Requested date</dt><dd>{q.requestedDate ? longDate(q.requestedDate) : "Not given"}</dd></div>
        <div>
          <dt>Promised date</dt>
          <dd className="font-semibold" data-testid="text-appointment">
            {q.promisedDate ? longDate(q.promisedDate) : "To be confirmed"}{q.status === "draft" && q.promisedDate ? " (proposed)" : ""}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt>Assigned crew</dt>
          <dd data-testid="text-crew">{q.crew.length ? q.crew.join(", ") : "To be assigned"}{q.crewIsProposal && q.crew.length ? " (proposed)" : ""}</dd>
        </div>
      </dl>
      <div className="overflow-x-auto">
        <table className="q-table">
          <thead><tr><th>Service</th><th className="r">Qty</th><th className="r">Unit price</th><th className="r">Amount</th></tr></thead>
          <tbody>
            {q.lines.map((l, i) => (
              <tr key={i} data-testid={`row-line-${i}`}>
                <td>{l.serviceName}</td><td className="r">{l.quantity}</td><td className="r">{rm(l.unitPrice)}</td><td className="r">{rm(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="q-total"><span className="text-[13px] font-semibold">Total (RM)</span><span data-testid="text-quote-total">{rm(q.totalPrice)}</span></div>
      <p className="mt-8 text-[12px] text-[#707b7a]" data-testid="text-approval-status">
        {q.status === "draft"
          ? "Approval status: not yet approved. This draft is not a confirmed booking."
          : `Approval status: approved by ${q.approvedBy ?? "manager"}${q.approvedAt ? ` on ${myTime(q.approvedAt)} (Malaysia time)` : ""}.`}{" "}
        Prices from the approved CoolAir Services price list.
      </p>
    </article>
  );
}

export function PrintableQuoteModal({ q, onClose }: { q: QuoteDocData; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="oro-current oro-library print-modal-root fixed inset-0 z-[90] bg-[#1f2a33]/60 overflow-y-auto p-3 sm:p-8" onClick={onClose} data-testid="modal-quote">
      <div className="max-w-[860px] mx-auto" role="dialog" aria-modal="true" aria-label="Printable quotation" onClick={(e) => e.stopPropagation()}>
        <div className="print-hide flex justify-end gap-2 mb-3">
          <button className="btn" onClick={onClose} data-testid="button-close-quote"><X /> Close</button>
          <button className="btn btn-primary" onClick={() => window.print()} data-testid="button-print"><Printer /> Print / Save PDF</button>
        </div>
        <QuoteDocument q={q} />
      </div>
    </div>,
    document.body,
  );
}

// ---------- quote-terms.tsx ----------
export const HOLD_SECONDS = 30;
export const PRICE_VALID_DAYS = 7;
export interface HoldTimer { remaining: number; fraction: number; expired: boolean; expireNow: () => void }

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

export function QuoteTerms({ hasSlot, hold, onReverify, reverifying }: { hasSlot: boolean; hold: HoldTimer; onReverify: () => void; reverifying: boolean }) {
  return (
    <div className={`quote-terms ${hold.expired ? "expired" : ""}`} data-testid="quote-terms">
      <div className="flex flex-wrap gap-2">
        <span className="term-badge price" data-testid="badge-price-validity">
          <BadgeCheck size={13} aria-hidden /> Quotation Price Valid: {PRICE_VALID_DAYS} Days
        </span>
        {hasSlot && !hold.expired && (
          <span className="term-badge hold" data-testid="badge-hold">
            <Timer size={13} aria-hidden /> Crew Slot Temporary Hold: {HOLD_SECONDS}s (Demo Simulation)
            <span className="hold-count" data-testid="text-hold-countdown">{hold.remaining}s left</span>
          </span>
        )}
        {hasSlot && hold.expired && (
          <span className="term-badge expired" data-testid="badge-hold-expired">
            <TimerOff size={13} aria-hidden /> HOLD EXPIRED — Needs Re-verification before confirming
          </span>
        )}
      </div>
      {hasSlot && !hold.expired && (
        <div className="hold-track" aria-hidden><span style={{ width: `${hold.fraction * 100}%` }} /></div>
      )}
      <div className="sr-only" aria-live="polite">{hold.expired ? "Crew slot hold expired. Re-verify availability before confirming." : ""}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[11px] leading-snug text-[#6f7a75] flex-1 min-w-[200px]">
          {!hasSlot
            ? "No crew slot is held, because no date in this quote is feasible."
            : hold.expired
              ? "The crew is released, so nobody's day stays blocked. Staff records may have changed: re-check before confirming. The price stays valid."
              : "The price and the crew hold expire separately. Simulated hold: the crew is locked in the database only when the manager approves."}
        </p>
        {hasSlot && (hold.expired ? (
          <button className="btn btn-primary" onClick={onReverify} disabled={reverifying} data-testid="button-reverify">
            {reverifying ? <Loader2 className="spin" /> : <RefreshCw />} Re-verify Availability
          </button>
        ) : (
          <button className="btn" onClick={hold.expireNow} data-testid="button-simulate-hold-expiry">
            <TimerOff /> Simulate Hold Expiry
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- risk.tsx ----------
const shortDate = (d: string) =>
  new Date(d + "T00:00:00+08:00").toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" });

export function SimulationBar({ fired, onFire }: { fired: boolean; onFire: () => void }) {
  return (
    <section className="no-print mb-5 rounded-xl border border-dashed border-[#d9b46a] bg-[#fbf4e4] px-4 py-3 flex flex-wrap items-center gap-3" data-testid="bar-simulation">
      <div className="flex items-center gap-2 text-[#795d2c] flex-1 min-w-[220px]">
        <Radio size={16} className="shrink-0" />
        <div>
          <div className="eyebrow !mb-0 !text-[#996b23]">Demo control · Simulated Orbyte eLeave event</div>
          <div className="text-[12px]">
            {fired ? "Simulated eLeave SIM-ELEAVE-0199 approved for Bala on Mon 26 Oct 2026. 1 commitment re-checked." : "Approve the Monday job first, then fire this event to see ORO AI react."}
          </div>
        </div>
      </div>
      <button className="btn w-full sm:w-auto !whitespace-normal !h-auto !py-2 !text-left" onClick={onFire} disabled={fired} data-testid="button-simulate-leave">
        <CalendarX2 />
        Simulate Orbyte Event: Approve Bala's Emergency Leave (Mon, 26 Oct)
      </button>
    </section>
  );
}

export function RiskAlerts({ atRisk, recovered, onRecovered }: { atRisk: Commitment[]; recovered: Commitment | null; onRecovered: (c: Commitment) => void }) {
  const showRecovered = !!recovered && !atRisk.some((c) => c.quote.id === recovered.quote.id);
  if (atRisk.length === 0 && !showRecovered) return null;
  return (
    <div className="grid gap-4 mb-5 no-print">
      {atRisk.map((c) => <AtRiskCard key={c.quote.id} commitment={c} onRecovered={onRecovered} />)}
      {showRecovered && recovered && (
        <div className="notice success" role="status" data-testid="notice-recovered" style={{ animation: "fade-up .3s ease both" }}>
          <CheckCircle2 />
          <div>
            <strong>Recovery approved for #{recovered.quote.reference}.</strong> Crew is now {recovered.quote.crew.join(", ")} on{" "}
            {shortDate(recovered.quote.appointmentDate!)}. Commitment is feasible again and the change is in the activity log.
          </div>
        </div>
      )}
    </div>
  );
}

function AtRiskCard({ commitment: c, onRecovered }: { commitment: Commitment; onRecovered: (c: Commitment) => void }) {
  const { isManager } = useRole();
  const [pending, setPending] = useState(false);
  const plan = c.recovery;
  const x = c.quote;
  const approve = () => {
    setPending(true);
    setTimeout(() => { setPending(false); onRecovered(c); }, 700);
  };
  return (
    <section className="rounded-xl border-2 border-[#c9574e] bg-[#fdf3f1] p-5 shadow-[0_8px_24px_#a8474018]" role="alert" data-testid={`card-at-risk-${x.id}`} style={{ animation: "fade-up .3s ease both" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[#a84740]">
          <AlertOctagon size={22} />
          <span className="font-extrabold tracking-wide text-[16px]" style={{ fontFamily: "Manrope" }}>COMMITMENT AT RISK</span>
        </div>
        {plan && <span className="badge badge-red !normal-case" data-testid="badge-eleave">eLeave #{plan.leaveReference}</span>}
      </div>
      <dl className="grid grid-cols-3 gap-3 mt-4 text-[13px]">
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Quote</dt><dd className="m-0 font-semibold mono" data-testid="text-risk-reference">#{x.reference}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Customer</dt><dd className="m-0 font-medium">{x.customerName}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Date</dt><dd className="m-0 font-medium">{x.appointmentDate ? shortDate(x.appointmentDate) : "-"}</dd></div>
      </dl>
      <div className="mt-4 text-[13px] text-[#7d3b35]">
        <div className="font-semibold mb-1">Why it is at risk</div>
        <p className="m-0" data-testid="text-risk-reason">{x.riskReason}</p>
        <p className="m-0 mt-1 text-[11px] text-[#9b6a65]">Leave details stay in Orbyte eLeave; only the approval reference is shown here (PDPA).</p>
      </div>
      {plan && (
        <div className="mt-4 rounded-lg bg-white/70 border border-[#ecd2cd] p-4">
          <div className="eyebrow !text-[#347956]">Recommended recovery</div>
          {plan.replacement ? (
            <div className="flex items-start gap-2 text-[14px] font-semibold text-[#2d3a40]" data-testid="text-recovery-summary">
              <UserRoundCheck size={18} className="text-[#347956] shrink-0 mt-0.5" />
              {plan.summary}
            </div>
          ) : (
            <div className="text-[13px] text-[#7d3b35]" data-testid="text-recovery-summary">{plan.summary}</div>
          )}
          {(plan.otherEligible.length > 0 || plan.rejected.length > 0) && (
            <ul className="mt-2 mb-0 pl-0 list-none text-[11px] text-[#6b7570] grid gap-1">
              {plan.otherEligible.map((m) => (
                <li key={m.id} className="flex gap-1.5"><CheckCircle2 size={13} className="text-[#347956] shrink-0" /> {m.name} is also free and qualified (backup).</li>
              ))}
              {plan.rejected.map((r) => (
                <li key={r.staffName} className="flex gap-1.5"><XCircle size={13} className="text-[#a84740] shrink-0" /> {r.staffName} rejected: {r.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {plan?.replacement && !isManager && <div className="mt-4"><LockBadge /></div>}
      {plan?.replacement && (
        <button
          className={`btn w-full ${isManager ? "mt-4" : "mt-2"} !min-h-[46px] !text-[13px] ${isManager ? "!bg-[#a84740] !border-[#a84740] !text-white hover:!bg-[#933b35]" : ""}`}
          onClick={approve}
          disabled={pending || !isManager}
          data-testid={`button-approve-recovery-${x.id}`}
        >
          {pending ? <Loader2 className="spin" /> : isManager ? <ShieldCheck /> : <Lock />}
          Approve Recovery &amp; Update Orbyte Work
        </button>
      )}
      <p className="text-[11px] text-[#9b6a65] mt-2 mb-0">Manager-only action. The replacement is re-checked by the server before the crew changes.</p>
    </section>
  );
}

// ---------- voice-input.tsx (idle state) ----------
export function VoiceInput({ disabled }: { disabled: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  const explain = () => setNote("Mockup frame: microphone, upload and the sample voice note are not wired here. In the live app the transcript lands in the message box and goes through the same analysis.");
  return (
    <div className="voice-bar" data-testid="voice-bar">
      <div className="voice-head">
        <span className="voice-title"><AudioLines size={14} /> Voice Note / Audio Input</span>
        <a className="voice-sample-link" href="#" onClick={(e) => { e.preventDefault(); explain(); }} data-testid="link-download-sample">
          <Download size={12} /> Sample .mp3 for upload test
        </a>
      </div>
      <div className="voice-actions">
        <button className="btn" disabled={disabled} onClick={explain} data-testid="button-voice-record"><Mic /> Record Voice Note</button>
        <button className="btn" disabled={disabled} onClick={explain} data-testid="button-voice-upload"><Upload /> Upload Audio File (.mp3 / .m4a / .wav)</button>
        <button className="btn btn-voice-demo" disabled={disabled} onClick={explain} data-testid="button-voice-simulate"><Play /> Simulate 10s Contractor Voice Note</button>
      </div>
      {note && <div className="notice info mt-2 text-[12px]" role="status">{note}</div>}
    </div>
  );
}

export { ErrorBox };

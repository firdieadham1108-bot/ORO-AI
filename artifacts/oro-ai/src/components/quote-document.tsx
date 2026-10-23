// Print-ready quotation document, shown inline or in a modal with Print / Save PDF.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { rm, longDate, myTime } from "@/lib/util";

export interface QuoteDocData {
  companyName: string;
  reference: string | null; // null while still a draft
  status: "draft" | "approved" | "at_risk" | "rejected";
  rejectionReason?: string | null;
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
  rejected: { cls: "badge-amber", label: "Declined · not booked" },
};

export function QuoteDocument({ q }: { q: QuoteDocData }) {
  const st = q.status === "draft" && !q.reference
    ? { cls: "badge-amber", label: "Preview · not submitted" }
    : STATUS_BADGE[q.status];
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
          <div className="mono text-[15px]" data-testid="text-reference">{q.reference ?? "Assigned when submitted or approved"}</div>
          <div className="mt-2"><span className={`badge ${st.cls}`} data-testid="status-quote">{st.label}</span></div>
        </div>
      </div>
      <dl className="sheet-meta">
        <div><dt>Customer</dt><dd data-testid="text-customer">{q.customerName}</dd></div>
        <div><dt>Job location</dt><dd>{q.location}</dd></div>
        <div><dt>Requested date</dt><dd>{q.requestedDate ? longDate(q.requestedDate) : "Not given"}</dd></div>
        <div>
          <dt>{q.status === "draft" ? "Proposed date" : q.status === "rejected" ? "Booking date" : "Promised date"}</dt>
          <dd className="font-semibold" data-testid="text-appointment">
            {q.status === "rejected" ? "Not booked" : q.promisedDate ? longDate(q.promisedDate) : "To be confirmed"}{q.status === "draft" && q.promisedDate ? " (not booked)" : ""}
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
        {q.status === "rejected"
          ? `Approval status: declined. No booking confirmed.${q.rejectionReason ? ` Reason: ${q.rejectionReason}` : ""}`
          : q.status === "draft"
          ? q.reference ? "Awaiting manager approval. This draft is not a confirmed booking." : "Preview only: not saved or submitted for approval. No crew is reserved."
          : `Approval status: approved by ${q.approvedBy ?? "manager"}${q.approvedAt ? ` on ${myTime(q.approvedAt)} (Malaysia time)` : ""}.`}{" "}
        Prices from the approved CoolAir Services price list.
      </p>
    </article>
  );
}

/** Full-screen modal. While it is open, printing shows only the quotation. */
export function PrintableQuoteModal({ q, onClose }: { q: QuoteDocData; onClose: () => void }) {
  useEffect(() => {
    document.body.classList.add("print-modal-open");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("print-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="print-modal-root fixed inset-0 z-[90] bg-[#1f2a33]/60 overflow-y-auto p-3 sm:p-8" onClick={onClose} data-testid="modal-quote">
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

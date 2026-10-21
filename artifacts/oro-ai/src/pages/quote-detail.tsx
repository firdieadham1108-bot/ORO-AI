import { Link, useParams } from "wouter";
import { useGetQuote, getGetQuoteQueryKey } from "@workspace/api-client-react";
import { Printer, ArrowLeft } from "lucide-react";
import { ErrorBox, Skeletons } from "@/components/shell";
import { rm, longDate, myTime } from "@/lib/util";

export default function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const q = useGetQuote(id, { query: { enabled: Number.isFinite(id), queryKey: getGetQuoteQueryKey(id) } });
  const x = q.data;
  return (
    <div className="page">
      <div className="page-head no-print">
        <Link href="/quotes" className="btn btn-quiet" data-testid="link-back"><ArrowLeft /> All quotations</Link>
        <button className="btn btn-primary" onClick={() => window.print()} disabled={!x} data-testid="button-print"><Printer /> Print</button>
      </div>
      {q.isLoading && <Skeletons n={2} />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {x && (
        <article className="quote-sheet" data-testid="quote-sheet">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div><h2 data-testid="text-company">{x.companyName}</h2><div style={{ fontSize: 12, color: "#707b7a", marginTop: 4 }}>Cheras, Kuala Lumpur</div></div>
            <div style={{ textAlign: "right" }}>
              <div className="eyebrow">Quotation</div>
              <div className="mono" style={{ fontSize: 15 }} data-testid="text-reference">{x.reference}</div>
              <div className="secondary-text">Issued {myTime(x.createdAt)}</div>
            </div>
          </div>
          <dl className="sheet-meta">
            <div><dt>Customer</dt><dd data-testid="text-customer">{x.customerName}</dd></div>
            <div><dt>Job location</dt><dd data-testid="text-location">{x.location}</dd></div>
            <div><dt>Requested date</dt><dd data-testid="text-date">{longDate(x.requestedDate)}</dd></div>
            <div><dt>Status</dt><dd><span className="badge badge-amber" data-testid="status-quote">Draft - awaiting manager approval</span></dd></div>
          </dl>
          <table className="q-table">
            <thead><tr><th>Service</th><th className="r">Qty</th><th className="r">Unit price</th><th className="r">Amount</th></tr></thead>
            <tbody><tr><td>{x.serviceName}</td><td className="r">{x.quantity}</td><td className="r">{rm(x.unitPrice)}</td><td className="r">{rm(x.totalPrice)}</td></tr></tbody>
          </table>
          <div className="q-total"><span style={{ fontSize: 13, fontWeight: 600 }}>Total</span><span data-testid="text-total">{rm(x.totalPrice)}</span></div>
          <p style={{ marginTop: 34, fontSize: 12, color: "#707b7a" }}>Don't just make promises. Keep them. Prices are from the approved CoolAir Services price list.</p>
        </article>
      )}
    </div>
  );
}

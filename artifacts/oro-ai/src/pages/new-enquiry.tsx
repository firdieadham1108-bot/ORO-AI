import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalyseEnquiry, useCreateQuote, useListServices, getListQuotesQueryKey, getListActivityQueryKey } from "@workspace/api-client-react";
import type { EnquiryAnalysis } from "@workspace/api-client-react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { PageHead, ErrorBox } from "@/components/shell";
import { rm } from "@/lib/util";

const SAMPLES = [
  "Boss, can you install 6 units of 1.5HP aircon at our Cheras office this Friday? Send quote please.",
  "Can you install aircon?",
];

export default function NewEnquiry() {
  const [, nav] = useLocation();
  const qc = useQueryClient();
  const services = useListServices();
  const analyse = useAnalyseEnquiry();
  const create = useCreateQuote();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<EnquiryAnalysis | null>(null);
  const [customer, setCustomer] = useState("");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState("");
  const [date, setDate] = useState("");
  const [loc, setLoc] = useState("");

  const run = () => {
    analyse.mutate({ data: { message } }, {
      onSuccess: (a) => {
        setResult(a);
        setCode(a.serviceCode ?? "");
        setQty(a.quantity != null ? String(a.quantity) : "");
        setDate(a.requestedDate ?? "");
        setLoc(a.location ?? "");
      },
    });
  };
  useEffect(() => { create.reset(); }, [customer, code, qty, date, loc]); // eslint-disable-line react-hooks/exhaustive-deps

  const svc = services.data?.find((s) => s.code === code);
  const n = Number(qty);
  const qtyOk = Number.isInteger(n) && n >= 1 && n <= 500;
  const total = svc && qtyOk ? svc.unitPrice * n : null;
  const missing: string[] = [];
  if (!customer.trim()) missing.push("Customer name");
  if (!code) missing.push("Service");
  if (!qtyOk) missing.push("Quantity (1 to 500)");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) missing.push("Requested date");
  if (!loc.trim()) missing.push("Location");
  const ready = missing.length === 0;

  const submit = () => {
    create.mutate({ data: { customerName: customer.trim(), serviceCode: code, quantity: n, requestedDate: date, location: loc.trim(), message } }, {
      onSuccess: (q) => {
        qc.invalidateQueries({ queryKey: getListQuotesQueryKey() });
        qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
        nav(`/quotes/${q.id}`);
      },
    });
  };

  return (
    <div className="page">
      <PageHead eyebrow="Step 1 to 3" title="New enquiry" sub="Paste the customer's message, check the details, then generate the quotation." />
      <div className="two-col">
        <div className="wide-stack">
          <div className="panel">
            <div className="panel-heading"><div><h2>Customer message</h2><p>Paste from WhatsApp or try a sample.</p></div></div>
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {SAMPLES.map((s, i) => <button key={i} className="btn" style={{ whiteSpace: "normal", textAlign: "left", height: "auto", padding: "8px 12px" }} onClick={() => setMessage(s)} data-testid={`button-sample-${i}`}>{s}</button>)}
            </div>
            <div className="field"><textarea value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Paste the customer's message here" data-testid="input-message" /></div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" disabled={!message.trim() || analyse.isPending} onClick={run} data-testid="button-analyse">
                {analyse.isPending ? <Loader2 className="spin" /> : <Sparkles />} {analyse.isPending ? "Analysing" : "Analyse Enquiry"}
              </button>
            </div>
            {analyse.isError && <div style={{ marginTop: 12 }}><ErrorBox error={analyse.error} onRetry={run} /></div>}
          </div>

          {result && (
            <div className="panel" data-testid="panel-details">
              <div className="panel-heading"><div><h2>Job details</h2><p>Review and edit anything that looks wrong.</p></div></div>
              {result.missing.length > 0 && (
                <div className="notice warn" style={{ marginBottom: 16 }} data-testid="list-missing">
                  <AlertTriangle />
                  <div>
                    <strong>Missing information:</strong>
                    <ul style={{ margin: "4px 0", paddingLeft: 18 }}>{result.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                    {result.clarification && <div data-testid="text-clarification" style={{ fontStyle: "italic" }}>"{result.clarification}"</div>}
                  </div>
                </div>
              )}
              <div className="form-grid">
                <div className="field"><label htmlFor="c">Customer name</label><input id="c" value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={160} data-testid="input-customer" /></div>
                <div className="field"><label htmlFor="s">Service</label>
                  <select id="s" value={code} onChange={(e) => setCode(e.target.value)} data-testid="select-service">
                    <option value="">Select a service</option>
                    {services.data?.map((s) => <option key={s.code} value={s.code}>{s.name}{s.specification ? ` (${s.specification})` : ""} - {rm(s.unitPrice)}</option>)}
                  </select>
                  {services.isError && <small>Could not load price list.</small>}
                </div>
                <div className="field"><label htmlFor="q">Quantity</label><input id="q" type="number" inputMode="numeric" min={1} max={500} value={qty} onChange={(e) => setQty(e.target.value)} data-testid="input-quantity" /></div>
                <div className="field"><label htmlFor="d">Requested date</label><input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-requested-date" /></div>
                <div className="field full"><label htmlFor="l">Location</label><input id="l" value={loc} onChange={(e) => setLoc(e.target.value)} maxLength={240} data-testid="input-location" /></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="panel" style={{ position: "sticky", top: 90 }}>
            <div className="panel-heading"><div><h2>Price preview</h2><p>Final price is confirmed by the server.</p></div></div>
            {!result ? (
              <div className="empty" style={{ padding: 12 }}>Analyse a message to see the price.</div>
            ) : (
              <>
                <div className="detail-sub">{svc ? `${qtyOk ? n : "?"} x ${rm(svc.unitPrice)} per ${svc.unit}` : "Choose a service"}</div>
                <div className="detail-number" data-testid="text-total-preview">{total != null ? rm(total) : "RM --"}</div>
                {!ready && <div className="notice warn" style={{ marginTop: 14 }}><AlertTriangle /><div>Still needed: {missing.join(", ")}</div></div>}
                {create.isError && <div style={{ marginTop: 12 }}><ErrorBox error={create.error} /></div>}
                <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={!ready || create.isPending} onClick={submit} data-testid="button-generate">
                  {create.isPending && <Loader2 className="spin" />} Generate Quotation
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

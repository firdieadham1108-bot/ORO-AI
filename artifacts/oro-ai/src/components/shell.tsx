import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useResetDemo } from "@workspace/api-client-react";
import { CalendarDays, FilePlus2, FileText, Activity, RotateCcw, Menu, X, AlertTriangle, Loader2 } from "lucide-react";
import { errText } from "@/lib/util";

const NAV = [
  { href: "/", label: "Staff availability", short: "Staff", icon: CalendarDays },
  { href: "/new-enquiry", label: "New enquiry", short: "Enquiry", icon: FilePlus2 },
  { href: "/quotes", label: "Quotations", short: "Quotes", icon: FileText },
  { href: "/activity", label: "Activity log", short: "Activity", icon: Activity },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const qc = useQueryClient();
  const reset = useResetDemo();
  const active = (h: string) => (h === "/" ? loc === "/" : loc.startsWith(h));
  const doReset = () => {
    if (!window.confirm("Reset all demo data? Quotations and activity created in this session will be removed.")) return;
    reset.mutate(undefined, {
      onSuccess: (r) => {
        qc.invalidateQueries();
        setMsg({ ok: true, t: r.message });
        setOpen(false);
        setTimeout(() => setMsg(null), 3500);
      },
      onError: (e) => { setMsg({ ok: false, t: errText(e) }); setTimeout(() => setMsg(null), 5000); },
    });
  };
  const ResetBtn = ({ cls = "" }: { cls?: string }) => (
    <button className={`btn ${cls}`} onClick={doReset} disabled={reset.isPending} data-testid="button-reset-demo">
      {reset.isPending ? <Loader2 className="spin" /> : <RotateCcw />} Reset Demo Data
    </button>
  );
  return (
    <>
      <div className="demo-banner" data-testid="text-demo-label">Demo Environment - Simulated Orbyte Data</div>
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/" className="brand">
            <span className="brand-mark">O</span>
            <span className="brand-word">ORO AI<small>COOLAIR SERVICES</small></span>
          </Link>
          <div className="nav-label">Workspace</div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-link ${active(n.href) ? "active" : ""}`} data-testid={`link-nav-${n.short.toLowerCase()}`}>
              <n.icon /> {n.label}
            </Link>
          ))}
          <div className="sidebar-foot">
            <div className="demo-note"><strong>Keep your promises</strong>Don't just make promises. Keep them.</div>
            <ResetBtn cls="w-full" />
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="crumb"><strong>CoolAir Services Sdn Bhd</strong><span className="hide-mobile">Cheras, Kuala Lumpur</span></div>
            <div className="top-actions">
              <button className="btn mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu /> Menu</button>
            </div>
          </header>
          {children}
          <footer style={{ padding: "0 34px 30px", fontSize: 11, color: "#848b85" }} className="no-print">
            Demo Environment - Simulated Orbyte Data. All names, prices and schedules are synthetic.
          </footer>
        </div>
        <nav className="mobile-bottom">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""}><n.icon />{n.short}</Link>
          ))}
        </nav>
        {open && (
          <div className="mobile-sheet" role="dialog" aria-label="Menu">
            <button className="btn" style={{ alignSelf: "flex-end" }} onClick={() => setOpen(false)} data-testid="button-close-menu"><X /> Close</button>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`nav-link ${active(n.href) ? "active" : ""}`} style={{ fontSize: 16, minHeight: 54 }}>
                <n.icon /> {n.label}
              </Link>
            ))}
            <div style={{ marginTop: "auto" }}><ResetBtn cls="w-full" /></div>
          </div>
        )}
        {msg && (
          <div className="toastline" role="status" style={msg.ok ? undefined : { background: "#9b4941" }}>
            {!msg.ok && <AlertTriangle size={14} style={{ display: "inline", marginRight: 6 }} />}{msg.t}
          </div>
        )}
      </div>
    </>
  );
}

export function PageHead({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="notice error" role="alert" data-testid="text-error">
      <AlertTriangle />
      <div style={{ flex: 1 }}>{errText(error)}</div>
      {onRetry && <button className="btn" onClick={onRetry} data-testid="button-retry">Try again</button>}
    </div>
  );
}

export function Skeletons({ n = 4 }: { n?: number }) {
  return <div className="grid">{Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton-box" />)}</div>;
}

export function Empty({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div style={{ fontWeight: 700, color: "#35434a", marginBottom: 4 }}>{title}</div>
      <div style={{ marginBottom: 14 }}>{text}</div>
      {children}
    </div>
  );
}

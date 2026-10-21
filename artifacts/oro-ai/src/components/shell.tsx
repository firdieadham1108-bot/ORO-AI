import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useResetDemo } from "@workspace/api-client-react";
import { RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { errText } from "@/lib/util";

export function Shell({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [gen, setGen] = useState(0);
  const qc = useQueryClient();
  const reset = useResetDemo();
  const doReset = () => {
    if (!window.confirm("Reset all demo data? The current enquiry and any approvals will be cleared.")) return;
    reset.mutate(undefined, {
      onSuccess: (r) => {
        qc.invalidateQueries();
        setGen((g) => g + 1);
        setMsg({ ok: true, t: r.message });
        setTimeout(() => setMsg(null), 3500);
      },
      onError: (e) => { setMsg({ ok: false, t: errText(e) }); setTimeout(() => setMsg(null), 5000); },
    });
  };
  return (
    <>
      <div className="demo-banner" data-testid="text-demo-label">Demo Environment - Simulated Orbyte Data</div>
      <div className="app-shell">
        <div className="workspace solo">
          <header className="topbar">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <span className="brand-mark">O</span>
              <span className="leading-tight">
                <span className="block text-[17px] font-extrabold tracking-tight text-[#28343d]" style={{ fontFamily: "Manrope" }}>ORO AI</span>
                <span className="hidden sm:block text-[11px] text-[#777f7d]">CoolAir Services Sdn Bhd · Cheras, Kuala Lumpur</span>
              </span>
            </Link>
            <button className="btn no-print" onClick={doReset} disabled={reset.isPending} data-testid="button-reset-demo">
              {reset.isPending ? <Loader2 className="spin" /> : <RotateCcw />} <span>Reset Demo Data</span>
            </button>
          </header>
          <div key={gen}>{children}</div>
          <footer className="no-print px-4 sm:px-8 pb-8 text-[11px] text-[#848b85]">
            Don't just make promises. Keep them. · Demo Environment - Simulated Orbyte Data. All names, prices and schedules are synthetic.
          </footer>
        </div>
        {msg && (
          <div className="toastline" role="status" style={msg.ok ? undefined : { background: "#9b4941" }}>
            {!msg.ok && <AlertTriangle size={14} style={{ display: "inline", marginRight: 6 }} />}{msg.t}
          </div>
        )}
      </div>
    </>
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

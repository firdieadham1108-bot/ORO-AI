import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useResetDemo } from "@workspace/api-client-react";
import { RotateCcw, AlertTriangle, Loader2, UserRound, ShieldCheck } from "lucide-react";
import { ROLES, useRole, type RoleKey } from "@/lib/role";
import { errText } from "@/lib/util";
import { WalletBadge } from "@/components/wallet-badge";

export function Shell({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [gen, setGen] = useState(0);
  const qc = useQueryClient();
  const reset = useResetDemo();
  // The sticky header sits just below the sticky demo banner, whose height changes when it wraps on phones.
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--banner-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const doReset = () => {
    if (!window.confirm("Reset the demo state? All quotes, approvals, leave events and activity go back to the starting data.")) return;
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
      <div className="demo-banner" ref={bannerRef}>
        <span data-testid="text-demo-label">Demo Environment - Simulated Orbyte Data</span>
        <WalletBadge />
      </div>
      <div className="app-shell">
        <div className="workspace solo">
          <header className="topbar !h-auto min-h-[58px] !py-2 flex-wrap gap-2">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <span className="brand-mark">O</span>
              <span className="leading-tight">
                <span className="block whitespace-nowrap text-[17px] font-extrabold tracking-tight text-[#28343d]" style={{ fontFamily: "Manrope" }}>ORO AI</span>
                <span className="hidden sm:block text-[11px] text-[#777f7d]">CoolAir Services Sdn Bhd · Cheras, Kuala Lumpur</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto no-print">
              <RoleSwitch />
              <button className="btn" onClick={doReset} disabled={reset.isPending} data-testid="button-reset-demo">
                {reset.isPending ? <Loader2 className="spin" /> : <RotateCcw />} <span className="hidden sm:inline">Reset Demo State</span><span className="sm:hidden">Reset</span>
              </button>
            </div>
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

function RoleSwitch() {
  const { role, setRole } = useRole();
  const options: Array<[RoleKey, typeof UserRound]> = [["sales", UserRound], ["manager", ShieldCheck]];
  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-[10px] uppercase tracking-wider text-[#7b857f]" style={{ fontFamily: "IBM Plex Mono" }}>Demo role</span>
      <div role="radiogroup" aria-label="Demo role" className="inline-flex rounded-lg border border-[#ded9ce] bg-[#f0ede4] p-0.5" data-testid="toggle-role">
        {options.map(([key, Icon]) => {
          const active = role === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => setRole(key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 sm:px-2.5 py-1.5 min-h-[38px] sm:min-h-0 text-[11px] font-semibold transition-colors ${
                active ? (key === "manager" ? "bg-[#2f6e52] text-white shadow-sm" : "bg-white text-[#35434a] shadow-sm") : "text-[#6b7570] hover:text-[#35434a]"
              }`}
              data-testid={`button-role-${key}`}
            >
              <Icon size={13} /> <span className="hidden sm:inline">{ROLES[key].label}</span><span className="sm:hidden">{key === "sales" ? "Sales (Mei)" : "Manager (Faizal)"}</span>
            </button>
          );
        })}
      </div>
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

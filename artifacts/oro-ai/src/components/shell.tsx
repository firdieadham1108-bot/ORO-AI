import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useResetDemo, useGetDashboardSummary } from "@workspace/api-client-react";
import {
  RotateCcw, AlertTriangle, Loader2, UserRound, ShieldCheck, LayoutDashboard, MessageSquarePlus, FileText,
  CalendarDays, ClipboardCheck, ShieldAlert, History, MoreHorizontal, CalendarClock, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, useRole, type RoleKey } from "@/lib/role";
import { errText } from "@/lib/util";
import { fullDay } from "@/lib/dates";
import { WalletBadge } from "@/components/wallet-badge";

type NavItem = { href: string; label: string; short: string; icon: LucideIcon; badge?: boolean };
const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/enquiry", label: "New Enquiry", short: "Enquiry", icon: MessageSquarePlus },
  { href: "/quotations", label: "Quotations", short: "Quotes", icon: FileText },
  { href: "/schedule", label: "Staff Schedule", short: "Schedule", icon: CalendarDays },
  { href: "/approvals", label: "Manager Approval", short: "Approvals", icon: ClipboardCheck, badge: true },
  { href: "/risk", label: "Risk Monitor", short: "Risk", icon: ShieldAlert },
  { href: "/activity", label: "Activity Log", short: "Activity", icon: History },
];
const isActive = (loc: string, href: string) => (href === "/" ? loc === "/" : loc === href || loc.startsWith(href + "/"));

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="wordmark" style={{ color: light ? "#F6F5F2" : "var(--navy)" }}>
      ORO <span style={{ color: "var(--gold)" }}>AI</span>
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [gen, setGen] = useState(0);
  const [more, setMore] = useState(false);
  const [location] = useLocation();
  const qc = useQueryClient();
  const reset = useResetDemo();
  const summary = useGetDashboardSummary();
  const pending = summary.data?.counts.pendingQuotations ?? 0;
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--banner-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { setMore(false); window.scrollTo(0, 0); }, [location]);
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
  const current = NAV.find((n) => isActive(location, n.href));
  const moreActive = ["/approvals", "/risk", "/activity"].some((h) => isActive(location, h));

  return (
    <>
      <div className="demo-banner" ref={bannerRef}>
        <span data-testid="text-demo-label">Demo Environment - Simulated Orbyte Data</span>
        <WalletBadge />
      </div>
      <div className="app-shell">
        <aside className="sidebar no-print" aria-label="Main navigation">
          <Link href="/" className="brand" data-testid="link-home">
            <span className="brand-mark">O</span>
            <span className="brand-text"><Wordmark light /><small>CoolAir Services · Cheras</small></span>
          </Link>
          <div className="nav-label">Workspace</div>
          <nav className="grid gap-0.5">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} title={n.label} className={`nav-link ${isActive(location, n.href) ? "active" : ""}`} data-testid={`nav-${n.short.toLowerCase()}`}>
                <n.icon /> <span className="nav-text">{n.label}</span>
                {n.badge && pending > 0 && <span className="nav-count" data-testid="badge-pending-count">{pending}</span>}
              </Link>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="demo-note"><strong>Simulated Orbyte link</strong>Staff, leave and job records are synthetic demo data.</div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="topbar-brand"><span className="brand-mark sm">O</span><Wordmark /></Link>
              <div className="crumb hide-mobile"><span>CoolAir Services</span><span aria-hidden>/</span><strong>{current?.label ?? "Not found"}</strong></div>
            </div>
            <div className="top-actions no-print">
              <span className="ref-chip" data-testid="text-ref-date" title="All dates are calculated from this demo reference date">
                <CalendarClock size={13} aria-hidden />
                <span className="ref-label">Ref. date: </span>{summary.data ? fullDay(summary.data.referenceDate) : "…"}
              </span>
              <RoleSwitch />
              <button className="btn btn-ghost" onClick={doReset} disabled={reset.isPending} data-testid="button-reset-demo" title="Reset Demo State">
                {reset.isPending ? <Loader2 className="spin" /> : <RotateCcw />} <span className="hidden xl:inline">Reset Demo State</span><span className="xl:hidden sr-only sm:not-sr-only">Reset</span>
              </button>
            </div>
          </header>
          <main key={gen}>{children}</main>
          <footer className="app-footer no-print">
            <strong>Don't just make promises. Keep them.</strong> · Demo Environment - Simulated Orbyte Data. All names, prices and schedules are synthetic.
          </footer>
        </div>

        <nav className="mobile-bottom no-print" aria-label="Mobile navigation">
          {NAV.slice(0, 4).map((n) => (
            <Link key={n.href} href={n.href} className={isActive(location, n.href) ? "active" : ""} data-testid={`tab-${n.short.toLowerCase()}`}>
              <n.icon /> {n.short}
            </Link>
          ))}
          <button className={moreActive || more ? "active" : ""} onClick={() => setMore(true)} data-testid="tab-more">
            <span className="relative"><MoreHorizontal />{pending > 0 && <span className="tab-dot" />}</span> More
          </button>
        </nav>
        {more && (
          <div className="sheet-backdrop no-print" onClick={() => setMore(false)}>
            <div className="sheet" role="dialog" aria-label="More pages" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-grip" />
              <div className="flex items-center justify-between mb-2">
                <div className="eyebrow !mb-0">More</div>
                <button className="btn btn-ghost !min-h-[36px]" onClick={() => setMore(false)} aria-label="Close"><X /></button>
              </div>
              {NAV.slice(4).map((n) => (
                <Link key={n.href} href={n.href} className={`sheet-link ${isActive(location, n.href) ? "active" : ""}`} data-testid={`sheet-${n.short.toLowerCase()}`}>
                  <n.icon /> <span className="flex-1">{n.label}</span>
                  {n.badge && pending > 0 && <span className="nav-count">{pending}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
        {msg && (
          <div className="toastline" role="status" style={msg.ok ? undefined : { background: "var(--danger)" }}>
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
    <div role="radiogroup" aria-label="Demo role" className="role-switch" data-testid="toggle-role">
      {options.map(([key, Icon]) => {
        const active = role === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            onClick={() => setRole(key)}
            className={`role-opt ${active ? (key === "manager" ? "on manager" : "on") : ""}`}
            data-testid={`button-role-${key}`}
            title={ROLES[key].label}
          >
            <Icon size={13} /> <span className="hidden 2xl:inline">{ROLES[key].label}</span><span className="2xl:hidden">{key === "sales" ? "Mei" : "Faizal"}</span>
          </button>
        );
      })}
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

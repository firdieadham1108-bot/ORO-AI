// BASELINE: port of artifacts/oro-ai/src/components/shell.tsx (+ wallet-badge.tsx) with the router,
// react-query and API hooks replaced by local state. Markup and class names are unchanged so the
// extracted app CSS renders it exactly like the live app. Navigation is a no-op (a mockup frame
// shows one page); the active item is passed in.
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import {
  RotateCcw, AlertTriangle, UserRound, ShieldCheck, LayoutDashboard, MessageSquarePlus, FileText,
  CalendarDays, ClipboardCheck, ShieldAlert, History, MoreHorizontal, CalendarClock, X, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, RoleProvider, useRole, type RoleKey, errText, fullDay } from "./lib";
import { REFERENCE_DATE } from "../_shared/sample-data";

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
const LOGO = "/__mockup/images/oro-logo.png";

/** Stand-in for wouter's <Link>: renders the same <a>, but never navigates (single-frame mockup). */
export function Link({ href, children, className, style, title, ...rest }: { href: string; children: ReactNode; className?: string; style?: CSSProperties; title?: string; [k: string]: unknown }) {
  void href;
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className={className} style={style} title={title} {...(rest as Record<string, unknown>)}>
      {children}
    </a>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="wordmark" style={{ color: light ? "#F6F5F2" : "var(--navy)" }}>
      ORO <span style={{ color: "var(--gold)" }}>AI</span>
    </span>
  );
}

function WalletBadge() {
  return (
    <span className="wallet-pill" title="Simulated usage-based pricing. Not real money." data-testid="badge-wallet">
      <Wallet size={12} aria-hidden />
      <span>Orbyte Credit Wallet:</span>
      <strong data-testid="text-wallet-balance">99.80 Credits</strong>
    </span>
  );
}

export function CurrentShell({ children, active, pending = 1, initialRole = "manager" }: { children: ReactNode; active: string; pending?: number; initialRole?: RoleKey }) {
  return (
    <RoleProvider initial={initialRole}>
      <ShellInner active={active} pending={pending}>{children}</ShellInner>
    </RoleProvider>
  );
}

function ShellInner({ children, active, pending }: { children: ReactNode; active: string; pending: number }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [more, setMore] = useState(false);
  const isActive = (href: string) => href === active;
  // The live app adds this class to <body> (main.tsx) so the DS primitives (.badge, .eyebrow...) resolve.
  useEffect(() => {
    document.body.classList.add("oro-library");
    document.documentElement.style.setProperty("--banner-h", "29px");
    return () => document.body.classList.remove("oro-library");
  }, []);
  const doReset = () => {
    if (!window.confirm("Reset the demo state? All quotes, approvals, leave events and activity go back to the starting data.")) return;
    setMsg({ ok: true, t: "Demo state reset (mockup: nothing was changed)." });
    setTimeout(() => setMsg(null), 3500);
  };
  const current = NAV.find((n) => isActive(n.href));
  const moreActive = ["/approvals", "/risk", "/activity"].some((h) => isActive(h));

  return (
    <div className="oro-current oro-library">
      <div className="demo-banner">
        <span data-testid="text-demo-label">Demo Environment - Simulated Orbyte Data</span>
        <WalletBadge />
      </div>
      <div className="app-shell">
        <aside className="sidebar no-print" aria-label="Main navigation">
          <Link href="/" className="brand" data-testid="link-home">
            <img className="brand-mark" src={LOGO} alt="ORO AI penguin logo" />
            <span className="brand-text"><Wordmark light /><small>CoolAir Services · Cheras</small></span>
          </Link>
          <div className="nav-label">Workspace</div>
          <nav className="grid gap-0.5">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} title={n.label} className={`nav-link ${isActive(n.href) ? "active" : ""}`} data-testid={`nav-${n.short.toLowerCase()}`}>
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
              <Link href="/" className="topbar-brand"><img className="brand-mark sm" src={LOGO} alt="ORO AI penguin logo" /><Wordmark /></Link>
              <div className="crumb hide-mobile"><span>CoolAir Services</span><span aria-hidden>/</span><strong>{current?.label ?? "Not found"}</strong></div>
            </div>
            <div className="top-actions no-print">
              <span className="ref-chip" data-testid="text-ref-date" title="All dates are calculated from this demo reference date">
                <CalendarClock size={13} aria-hidden />
                <span className="ref-label">Ref. date: </span>{fullDay(REFERENCE_DATE)}
              </span>
              <RoleSwitch />
              <button className="btn btn-ghost" onClick={doReset} data-testid="button-reset-demo" title="Reset Demo State">
                <RotateCcw /> <span className="hidden xl:inline">Reset Demo State</span><span className="xl:hidden sr-only sm:not-sr-only">Reset</span>
              </button>
            </div>
          </header>
          <main>{children}</main>
          <footer className="app-footer no-print">
            <strong>Don't just make promises. Keep them.</strong> · Demo Environment - Simulated Orbyte Data. All names, prices and schedules are synthetic.
          </footer>
        </div>

        <nav className="mobile-bottom no-print" aria-label="Mobile navigation">
          {NAV.slice(0, 4).map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""} data-testid={`tab-${n.short.toLowerCase()}`}>
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
                <Link key={n.href} href={n.href} className={`sheet-link ${isActive(n.href) ? "active" : ""}`} data-testid={`sheet-${n.short.toLowerCase()}`}>
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
    </div>
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

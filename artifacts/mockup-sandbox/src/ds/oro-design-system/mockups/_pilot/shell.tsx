// PILOT app shell: navy sidebar (desktop) / Sheet menu (phone), top bar with reference date and role,
// a persistent "simulated data" strip, and an inline explanation when a page outside the pilot is picked.
// Built only from DS components and theme tokens (sidebar*, card, border, muted, accent, primary).
import { type ReactNode, useEffect, useState } from "react";
import {
  CalendarClock, CalendarDays, ClipboardCheck, FileText, History, LayoutDashboard, Menu, MessageSquarePlus, ShieldAlert, ShieldCheck, UserRound, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { Badge } from "@workspace/oro-design-system/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@workspace/oro-design-system/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@workspace/oro-design-system/components/ui/toggle-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/oro-design-system/components/ui/sheet";
import { NAV, type NavKey, type Page, usePilot } from "./store";
import { REFERENCE_DATE } from "../_shared/sample-data";
import { longDate } from "./format";

const LOGO = "/__mockup/images/oro-logo.png";
const ICON: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard, enquiry: MessageSquarePlus, quotations: FileText, schedule: CalendarDays, approvals: ClipboardCheck, risk: ShieldAlert, activity: History,
};

export function PilotShell({ children }: { children: ReactNode }) {
  const { state, dashboard, navigate, explain, setRole } = usePilot();
  const [menuOpen, setMenuOpen] = useState(false);
  // DS primitives (.badge, .page-head, .empty, .skeleton) are scoped to .oro-library; portals (Sheet,
  // Dialog) render on <body>, so the class goes on <body> exactly as the live app does in main.tsx.
  useEffect(() => {
    document.body.classList.add("oro-library");
    return () => document.body.classList.remove("oro-library");
  }, []);
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [state.page]);

  const go = (key: NavKey) => {
    const item = NAV.find((n) => n.key === key)!;
    if (item.inPilot) navigate(key as Page);
    else explain(key);
    setMenuOpen(false);
  };
  const pending = dashboard.counts.pendingQuotations;
  const currentLabel = NAV.find((n) => n.key === state.page)?.label ?? "";

  const navButton = (n: (typeof NAV)[number], dark: boolean) => {
    const Icon = ICON[n.key];
    const active = n.key === state.page;
    return (
      <button
        key={n.key}
        type="button"
        onClick={() => go(n.key)}
        aria-current={active ? "page" : undefined}
        className={
          dark
            ? `flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors ${active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`
            : `flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors ${active ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-muted"}`
        }
      >
        <Icon className={`size-4 shrink-0 ${active ? (dark ? "text-sidebar-primary" : "text-accent-foreground") : ""}`} aria-hidden />
        <span className="flex-1 truncate">{n.label}</span>
        {n.key === "approvals" && pending > 0 && (
          <span className={`rounded-md px-1.5 font-mono text-xs font-semibold tabular-nums ${dark ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground"}`}>{pending}</span>
        )}
      </button>
    );
  };
  const navList = (dark: boolean) => {
    const label = dark ? "text-sidebar-foreground/50" : "text-muted-foreground";
    return (
      <nav className="grid gap-1" aria-label="Main navigation">
        <p className={`px-3 pb-1 font-mono text-xs uppercase tracking-wider ${label}`}>Pilot</p>
        {NAV.filter((n) => n.inPilot).map((n) => navButton(n, dark))}
        <p className={`px-3 pb-1 pt-4 font-mono text-xs uppercase tracking-wider ${label}`}>Current design</p>
        {NAV.filter((n) => !n.inPilot).map((n) => navButton(n, dark))}
      </nav>
    );
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <div className="hidden bg-sidebar text-sidebar-foreground md:block">
      <aside className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto px-4 py-5">
        <button type="button" onClick={() => navigate("dashboard")} className="flex items-center gap-3 rounded-md px-2 text-left">
          <img src={LOGO} alt="ORO AI penguin logo" className="size-10 shrink-0 rounded-lg object-contain" />
          <span className="min-w-0">
            <span className="ds-title block text-lg font-extrabold leading-tight">ORO <span className="text-sidebar-primary">AI</span></span>
            <span className="block truncate text-xs text-sidebar-foreground/70">CoolAir Services · Cheras</span>
          </span>
        </button>
        {navList(true)}
        <p className="mt-auto rounded-md border border-sidebar-border p-3 text-xs leading-relaxed text-sidebar-foreground/70">
          <span className="block font-medium text-sidebar-primary">Simulated Orbyte link</span>
          Staff, leave and job records are synthetic demo data. Nothing here creates a real booking.
        </p>
      </aside>
      </div>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <p className="border-b bg-accent px-4 py-1.5 text-center text-xs font-medium text-accent-foreground md:px-8">
          Demo environment · simulated Orbyte data · no real bookings, leave or payments
        </p>
        <header className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu /></Button>
            <img src={LOGO} alt="" aria-hidden className="size-8 rounded-md object-contain md:hidden" />
            <span className="ds-title text-base font-extrabold md:hidden">ORO <span className="text-accent-foreground">AI</span></span>
            <p className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <span>CoolAir Services</span><span aria-hidden>/</span><span className="font-medium text-foreground">{currentLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 font-mono font-medium sm:inline-flex" title="All dates are calculated from this demo reference date">
              <CalendarClock className="size-3.5" aria-hidden /> {longDate(REFERENCE_DATE)}
            </Badge>
            <ToggleGroup type="single" variant="outline" size="sm" value={state.role} onValueChange={(v) => v && setRole(v as "sales" | "manager")} aria-label="Demo role">
              <ToggleGroupItem value="sales" aria-label="Sales staff Mei" className="gap-1.5 px-2.5"><UserRound /> <span className="hidden sm:inline">Sales ·</span> Mei</ToggleGroupItem>
              <ToggleGroupItem value="manager" aria-label="Manager Faizal" className="gap-1.5 px-2.5"><ShieldCheck /> <span className="hidden sm:inline">Manager ·</span> Faizal</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-8 md:py-7">
          {state.notInPilot && (
            <Alert className="mb-5">
              <ShieldAlert className="size-4" />
              <AlertTitle>{NAV.find((n) => n.key === state.notInPilot)?.label} is not part of this pilot</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>Only Dashboard and New Enquiry were redesigned. The other five pages keep their current design until the pilot is approved.</span>
                <Button variant="ghost" size="sm" onClick={() => explain(null)}><X /> Dismiss</Button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
        <footer className="border-t px-4 py-4 text-xs text-muted-foreground md:px-8">
          <span className="font-medium text-foreground">Don't just make promises. Keep them.</span> · All names, prices and schedules are synthetic demo data.
        </footer>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2"><img src={LOGO} alt="" aria-hidden className="size-8 rounded-md object-contain" /> ORO AI</SheetTitle>
            <SheetDescription>CoolAir Services · Cheras</SheetDescription>
          </SheetHeader>
          <div className="mt-4">{navList(false)}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

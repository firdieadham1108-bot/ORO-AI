import { Suspense, useEffect, useState } from "react";
import { ALL_ENTRIES, DESIGN_SYSTEM, NAV_GROUPS } from "./registry";
import "../oro.css";

export function DesignSystemBrowser() {
  const read = () => new URLSearchParams(location.hash.slice(1)).get("page") || "overview";
  const [selected, setSelected] = useState(read);
  const [dark, setDark] = useState(() => new URLSearchParams(location.search).get("theme") === "dark");
  useEffect(() => {
    const handler = () => setSelected(read());
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const page = ALL_ENTRIES.find(p => p.id === selected) || ALL_ENTRIES[0];
  const Page = page.Page;
  return <div className="ds-shell oro-library">
    <aside className="ds-nav">
      <div className="flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}oro-logo.png`} width="44" height="44" alt="ORO AI penguin logo" className="rounded-xl" />
        <div><div className="ds-title text-lg font-extrabold">ORO <span style={{color:"var(--oro-gold)"}}>AI</span></div><div className="text-xs opacity-65">Design system</div></div>
      </div>
      <p className="text-xs mt-5 opacity-65 leading-relaxed">Extracted from the working app.<br />No screens changed.</p>
      <nav aria-label="Design system pages">
        {[{name:"Start here",entries:[ALL_ENTRIES[0]]},...NAV_GROUPS].map(group=><div key={group.name} className="mt-6">
          <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">{group.name}</div>
          {group.entries.map(entry=><a key={entry.id} href={`#page=${entry.id}`} aria-current={selected===entry.id?"page":undefined} className={`block px-3 py-2 rounded-lg text-sm mb-1 ${page.id===entry.id?"bg-sidebar-accent text-sidebar-accent-foreground":"hover:bg-sidebar-accent"}`}>{entry.name}</a>)}
        </div>)}
      </nav>
    </aside>
    <main className="ds-main">
      <header className="flex items-center justify-between gap-4 pb-5 border-b border-border mb-7">
        <div className="ds-label">{DESIGN_SYSTEM.title}</div>
        <button onClick={()=>setDark(!dark)} aria-pressed={dark} className="text-xs border border-border rounded-full px-4 py-2 bg-card">{dark?"Light theme":"Dark theme"}</button>
      </header>
      <Suspense fallback={<p role="status">Loading component…</p>}><Page /></Suspense>
      <footer className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground">Source-backed extraction · Five-family pilot · Application requires explicit approval.</footer>
    </main>
  </div>;
}

import { Link } from "wouter";
import { Compass, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page">
      <div className="panel max-w-lg mx-auto mt-10 text-center !py-12">
        <div className="empty-icon !w-12 !h-12"><Compass /></div>
        <div className="eyebrow">Error 404</div>
        <h1>This page is not on the schedule</h1>
        <p className="text-[13px] text-[var(--muted-ink)] mb-5">The link may be old, or the page was moved. Everything else is where you left it.</p>
        <Link href="/" className="btn btn-primary" data-testid="link-back-home"><LayoutDashboard /> Back to dashboard</Link>
      </div>
    </div>
  );
}

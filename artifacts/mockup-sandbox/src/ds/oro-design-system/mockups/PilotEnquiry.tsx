// PILOT (redesigned). New Enquiry built from the ORO design system only. Same component serves the
// desktop (1280x900) and phone (390x844) canvas frames. Navigation to Dashboard is local state.
// ?state=default (Friday conflict analysed) | empty | feasible | clarification | loading
import { PilotProvider, usePilot } from "./_pilot/store";
import { PilotShell } from "./_pilot/shell";
import { PilotDashboardPage } from "./_pilot/dashboard";
import { PilotEnquiryPage } from "./_pilot/enquiry";

function Router() {
  const { state } = usePilot();
  return state.page === "dashboard" ? <PilotDashboardPage /> : <PilotEnquiryPage />;
}

export default function PilotEnquiry() {
  return (
    <PilotProvider initialPage="enquiry">
      <PilotShell><Router /></PilotShell>
    </PilotProvider>
  );
}

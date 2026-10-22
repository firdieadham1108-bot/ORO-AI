import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "@/components/shell";
import NotFound from "@/pages/not-found";
import Workspace from "@/pages/workspace";
import Dashboard from "@/pages/dashboard";
import Quotations from "@/pages/quotations";
import Schedule from "@/pages/schedule";
import Approvals from "@/pages/approvals";
import RiskMonitor from "@/pages/risk-monitor";
import Activity from "@/pages/activity";
import { RoleProvider } from "@/lib/role";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/enquiry" component={Workspace} />
            <Route path="/quotations" component={Quotations} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/approvals" component={Approvals} />
            <Route path="/risk" component={RiskMonitor} />
            <Route path="/activity" component={Activity} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
      </RoleProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "@/components/shell";
import NotFound from "@/pages/not-found";
import Workspace from "@/pages/workspace";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell>
          <Switch>
            <Route path="/" component={Workspace} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell } from "@/components/shell";
import NotFound from "@/pages/not-found";
import Availability from "@/pages/availability";
import NewEnquiry from "@/pages/new-enquiry";
import Quotes from "@/pages/quotes";
import QuoteDetail from "@/pages/quote-detail";
import ActivityPage from "@/pages/activity";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell>
          <Switch>
            <Route path="/" component={Availability} />
            <Route path="/new-enquiry" component={NewEnquiry} />
            <Route path="/quotes" component={Quotes} />
            <Route path="/quotes/:id" component={QuoteDetail} />
            <Route path="/activity" component={ActivityPage} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

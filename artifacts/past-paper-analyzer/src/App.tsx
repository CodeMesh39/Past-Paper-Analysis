import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import UploadPapers from "@/pages/upload-papers";
import UploadSyllabus from "@/pages/upload-syllabus";
import Analysis from "@/pages/analysis";
import Dashboard from "@/pages/dashboard";
import Topics from "@/pages/topics";
import Planner from "@/pages/planner";
import Questions from "@/pages/questions";
import Export from "@/pages/export";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/upload" component={UploadPapers} />
        <Route path="/syllabus" component={UploadSyllabus} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/topics" component={Topics} />
        <Route path="/planner" component={Planner} />
        <Route path="/questions" component={Questions} />
        <Route path="/export" component={Export} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

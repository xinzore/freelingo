import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import { Home } from "@/pages/Home";
import { Lesson } from "@/pages/Lesson";
import { Profile } from "@/pages/Profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lesson/:id" component={Lesson} />
      <Route path="/profile" component={Profile} />
      {/* Mock leaderboard route for bottom nav to not break */}
      <Route path="/leaderboard">
        <div className="min-h-screen bg-background flex items-center justify-center text-center p-4">
          <div className="max-w-sm">
            <h1 className="text-3xl font-display font-bold mb-4">Ligler</h1>
            <p className="text-gray-500 mb-8">Bu özellik henüz geliştirme aşamasında. Çok yakında burada diğer oyuncularla yarışabileceksin!</p>
            <a href="/" className="text-primary font-bold hover:underline">Ana Sayfaya Dön</a>
          </div>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
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

import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";

// Pages
import { Home } from "@/pages/Home";
import { Lesson } from "@/pages/Lesson";
import { Profile } from "@/pages/Profile";
import { Achievements } from "@/pages/Achievements";
import { Notebook } from "@/pages/Notebook";
import { Leaderboard } from "@/pages/Leaderboard";
import { CommunityHub } from "@/pages/CommunityHub";
import { Studio } from "@/pages/Studio";
import { CommunityLesson } from "@/pages/CommunityLesson";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const verified = params.get("verified");
    if (verified) {
      if (verified === "success") {
        toast({ title: "✅ E-posta doğrulandı!", description: "Artık giriş yapabilirsin." });
        setAuthModalOpen(true);
      } else if (verified === "expired") {
        toast({ title: "⚠️ Bağlantının süresi dolmuş", description: "Yeniden kayıt olmayı dene.", variant: "destructive" });
      } else {
        toast({ title: "❌ Geçersiz bağlantı", description: "Doğrulama başarısız.", variant: "destructive" });
      }
      const clean = new URL(window.location.href);
      clean.searchParams.delete("verified");
      window.history.replaceState({}, "", clean.toString());
    }

    const token = params.get("reset-token");
    if (token) {
      setResetToken(token);
      setAuthModalOpen(true);
      const clean = new URL(window.location.href);
      clean.searchParams.delete("reset-token");
      window.history.replaceState({}, "", clean.toString());
    }
  }, []);

  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={() => <Home onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/lesson/:id" component={Lesson} />
          <Route path="/profile" component={() => <Profile onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/notebook" component={() => <Notebook onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/community" component={() => <CommunityHub onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/community/:id" component={() => <CommunityLesson onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/studio" component={() => <Studio onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>

      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setResetToken(undefined); }}
        resetToken={resetToken}
      />

      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

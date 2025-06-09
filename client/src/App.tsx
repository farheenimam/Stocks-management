import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

// Pages
import Dashboard from "@/pages/Dashboard";
import Stocks from "@/pages/Stocks";
import Portfolio from "@/pages/Portfolio";
import Watchlist from "@/pages/Watchlist";
import Analytics from "@/pages/Analytics";
import Competitions from "@/pages/Competitions";
import Alerts from "@/pages/Alerts";
import Recommendations from "@/pages/Recommendations";
import Subscriptions from "@/pages/Subscriptions";
import NotFound from "@/pages/not-found";

// Components
import Navigation from "@/components/Navigation";
import AuthModal from "@/components/AuthModal";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-primary-blue to-charcoal-gray flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4">StockPro</h1>
            <p className="text-xl mb-8">Professional Stock Trading Platform</p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="trading-button-primary px-8 py-3 text-lg"
            >
              Get Started
            </button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="main-content">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/stocks" component={Stocks} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/watchlist" component={Watchlist} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/competitions" component={Competitions} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/recommendations" component={Recommendations} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

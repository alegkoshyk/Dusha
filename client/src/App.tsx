import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Game from "@/pages/game";
import MobileGame from "@/pages/mobile-game";
import Results from "@/pages/results";
import BrandBoard from "@/pages/brand-board";
import { Auth } from "@/pages/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
// Lyceum pages
import LyceumHome from "@/pages/lyceum/LyceumHome";
import About from "@/pages/lyceum/About";
import Contacts from "@/pages/lyceum/Contacts";
import Preschool from "@/pages/lyceum/Preschool";
import GenericPage from "@/pages/lyceum/GenericPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Check if current route is a lyceum page
  const isLyceumRoute = location.startsWith("/lyceum");

  // Show lyceum pages without authentication
  if (isLyceumRoute) {
    return (
      <Switch>
        <Route path="/lyceum" component={LyceumHome} />
        <Route path="/lyceum/o-nas/misiya-ta-cinnosti" component={About} />
        <Route path="/lyceum/kontakti" component={Contacts} />
        <Route path="/lyceum/osvitni-poslugi/doshkilnij-licej2" component={Preschool} />
        <Route path="/lyceum/:rest*" component={GenericPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <>
      <Header />
      <main className="pt-16">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/mobile-game" component={MobileGame} />
          <Route path="/game/:sessionId" component={MobileGame} />
          <Route path="/game/:sessionId/results" component={BrandBoard} />
          <Route path="/brand-board/:sessionId" component={BrandBoard} />
          <Route path="/classic/:sessionId?" component={Game} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

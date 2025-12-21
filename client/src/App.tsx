import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { BrandSoulSpinner } from "@/components/BrandSoulSpinner";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Game from "@/pages/game";
import MobileGame from "@/pages/mobile-game";
import Results from "@/pages/results";
import BrandBoard from "@/pages/brand-board";
import BrandMaps from "@/pages/brand-maps";
import BrandChat from "@/pages/brand-chat";
import { Auth } from "@/pages/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CardsManagement from "@/pages/admin/CardsManagement";
import CardTypes from "@/pages/admin/CardTypes";
import CardOptionSets from "@/pages/admin/CardOptionSets";
import OptionsList from "@/pages/admin/OptionsList";
import Users from "@/pages/admin/Users";
import DatabaseSync from "@/pages/admin/DatabaseSync";
import AdminSettings from "@/pages/admin/Settings";
import BrandSpace from "@/pages/admin/BrandSpace";
import UserSettings from "@/pages/settings";
import Profile from "@/pages/profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <BrandSoulSpinner size={64} className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Завантаження...</p>
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
          <Route path="/brand-maps" component={BrandMaps} />
          <Route path="/brand-chat/:sessionId" component={BrandChat} />
          <Route path="/classic/:sessionId?" component={Game} />
          <Route path="/rcadmin" component={AdminDashboard} />
          <Route path="/rcadmin/cards" component={CardsManagement} />
          <Route path="/rcadmin/card-types" component={CardTypes} />
          <Route path="/rcadmin/card-option-sets" component={CardOptionSets} />
          <Route path="/rcadmin/options-list" component={OptionsList} />
          <Route path="/rcadmin/users" component={Users} />
          <Route path="/rcadmin/db-sync" component={DatabaseSync} />
          <Route path="/rcadmin/settings" component={AdminSettings} />
          <Route path="/rcadmin/brand-space" component={BrandSpace} />
          <Route path="/settings" component={UserSettings} />
          <Route path="/profile" component={Profile} />
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

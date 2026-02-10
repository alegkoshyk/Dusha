import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/useMobile";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/mobile/BottomNav";
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
import VisualMap from "@/pages/admin/VisualMap";
import SubscriptionPlans from "@/pages/admin/SubscriptionPlans";
import Transactions from "@/pages/admin/Transactions";
import BrandAnalysisSettings from "@/pages/admin/BrandAnalysisSettings";
import BrandAnalysisTemplates from "@/pages/admin/BrandAnalysisTemplates";
import UserSettings from "@/pages/settings";
import Profile from "@/pages/profile";
import MediaLibrary from "@/pages/media-library";
import Pricing from "@/pages/pricing";
import PaymentCallback from "@/pages/PaymentCallback";
import BrandEdit from "@/pages/brand-edit";
import BrandAnalysis from "@/pages/brand-analysis";
import Brands from "@/pages/brands";
import TargetAudience from "@/pages/target-audience";
import Products from "@/pages/products";
import Agents from "@/pages/agents";
import Briefs from "@/pages/briefs";
import BriefResponses from "@/pages/brief-responses";
import BriefPublic from "@/pages/brief-public";
import Quiz from "@/pages/quiz";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useMobile();
  
  useDeepLinks();

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
      {!isMobile && <Header />}
      <main className={isMobile ? "pb-20" : "pt-16"}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/brands" component={Brands} />
          <Route path="/mobile-game" component={MobileGame} />
          <Route path="/game/:sessionId" component={MobileGame} />
          <Route path="/game/:sessionId/results" component={BrandBoard} />
          <Route path="/brand-board/:sessionId" component={BrandBoard} />
          <Route path="/brand-maps" component={BrandMaps} />
          <Route path="/brand-chat/brand/:brandId" component={BrandChat} />
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
          <Route path="/rcadmin/visual-map" component={VisualMap} />
          <Route path="/rcadmin/subscriptions" component={SubscriptionPlans} />
          <Route path="/rcadmin/transactions" component={Transactions} />
          <Route path="/rcadmin/brand-analysis" component={BrandAnalysisSettings} />
          <Route path="/rcadmin/brand-analysis-templates" component={BrandAnalysisTemplates} />
          <Route path="/settings" component={UserSettings} />
          <Route path="/profile" component={Profile} />
          <Route path="/media" component={MediaLibrary} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/payment/callback" component={PaymentCallback} />
          <Route path="/brand/:brandId" component={BrandEdit} />
          <Route path="/target-audience/:brandId" component={TargetAudience} />
          <Route path="/products/:brandId" component={Products} />
          <Route path="/briefs/:brandId" component={Briefs} />
          <Route path="/brief-responses/:briefId" component={BriefResponses} />
          <Route path="/quiz/:brandId" component={Quiz} />
          <Route path="/agents" component={Agents} />
          <Route path="/brand-analysis" component={BrandAnalysis} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {isMobile && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/brief/:slug" component={BriefPublic} />
            <Route><Router /></Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuditLogProvider } from "@/hooks/useAuditLog";
import { NotificationsProvider } from "@/hooks/useNotifications";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import RulesEngine from "./pages/RulesEngine.tsx";
import RegulatoryReports from "./pages/RegulatoryReports.tsx";
import IdentityKYC from "./pages/IdentityKYC.tsx";
import CorporateKYB from "./pages/CorporateKYB.tsx";
import SystemAudit from "./pages/SystemAudit.tsx";
import Customers from "./pages/Customers.tsx";
import Customer360 from "./pages/Customer360.tsx";
import AlertWorkspace from "./pages/AlertWorkspace.tsx";
import SanctionsScreening from "./pages/SanctionsScreening.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Privacy from "./pages/Privacy.tsx";
import Accounts from "./pages/Accounts.tsx";
import PartnerBankDashboard from "./pages/PartnerBankDashboard.tsx";
import RoadmapGenerator from "./pages/RoadmapGenerator.tsx";
import Login from "./pages/Login.tsx";
import Settings from "./pages/Settings.tsx";

import AdminRoadmaps from "./pages/AdminRoadmaps.tsx";
import AdminAnalytics from "./pages/AdminAnalytics.tsx";
import CaseJourney from "./pages/CaseJourney.tsx";
import NotFound from "./pages/NotFound.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DemoGuide } from "./components/DemoGuide";
import { WhatsAppChat } from "./components/WhatsAppChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuditLogProvider>
      <NotificationsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/alerts" element={<Index />} />
            <Route path="/rules" element={<RulesEngine />} />
            <Route path="/reports/cbn" element={<RegulatoryReports />} />
            <Route path="/reports/nfiu" element={<RegulatoryReports />} />
            <Route path="/identity" element={<IdentityKYC />} />
            <Route path="/kyb/corporate" element={<CorporateKYB />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<Customer360 />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/audit" element={<SystemAudit />} />
            <Route path="/workspace" element={<AlertWorkspace />} />
            <Route path="/sanctions" element={<SanctionsScreening />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/partner-bank" element={<PartnerBankDashboard />} />
            <Route path="/roadmap" element={<RoadmapGenerator />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<ProtectedRoute requireAdmin={false}><Settings /></ProtectedRoute>} />

            <Route path="/admin/roadmaps" element={<ProtectedRoute><AdminRoadmaps /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/case/:caseId" element={<CaseJourney />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DemoGuide />
          <WhatsAppChat />
        </BrowserRouter>
      </TooltipProvider>
      </NotificationsProvider>
      </AuditLogProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

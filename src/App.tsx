import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import Contact from "./pages/Contact.tsx";
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
import DemoInbox from "./pages/DemoInbox";
import DemoEntry from "./pages/DemoEntry";
import { WhatsAppChat } from "./components/WhatsAppChat";
import { MarketingZone } from "./components/MarketingZone";
import { AppLayout, DemoLayout, LegacyRedirect, MarketingLayout } from "./components/layouts/ZoneLayouts";
import { APP_HOME, OPERATIONAL_BASES } from "./lib/zones";
import Pricing from "./pages/Pricing.tsx";
import Security from "./pages/Security.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>

      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationsProvider>
          <AuditLogProvider>
          <MarketingZone>
          <Routes>
            {/* Marketing zone */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/security" element={<Security />} />
              <Route path="/roadmap" element={<RoadmapGenerator />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
            <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
            <Route path="/book" element={<Navigate to="/contact" replace />} />

            {/* Internal zone */}
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<ProtectedRoute requireAdmin={false}><Settings /></ProtectedRoute>} />
            <Route path="/admin/roadmaps" element={<ProtectedRoute><AdminRoadmaps /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />

            {/* Demo zone: sample data */}
            <Route path="/demo" element={<DemoLayout />}>
              <Route index element={<DemoEntry />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inbox" element={<DemoInbox />} />
              <Route path="alerts" element={<Index />} />
              <Route path="workspace" element={<AlertWorkspace />} />
              <Route path="rules" element={<RulesEngine />} />
              <Route path="reports/cbn" element={<RegulatoryReports />} />
              <Route path="reports/nfiu" element={<RegulatoryReports />} />
              <Route path="identity" element={<IdentityKYC />} />
              <Route path="kyb/corporate" element={<CorporateKYB />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<Customer360 />} />
              <Route path="audit" element={<SystemAudit />} />
              <Route path="sanctions" element={<SanctionsScreening />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="partner-bank" element={<PartnerBankDashboard />} />
              <Route path="case/:caseId" element={<CaseJourney />} />
              <Route path="*" element={<LegacyRedirect to="/dashboard" />} />
            </Route>

            {/* Live zone: signed-in institution data */}
            <Route path="/app">
              {/* Old /app opened the dashboard; keep that link working in the demo */}
              <Route index element={<LegacyRedirect to="/dashboard" />} />
              <Route element={<AppLayout />}>
                <Route path="workspace" element={<AlertWorkspace />} />
                <Route path="*" element={<Navigate to={APP_HOME} replace />} />
              </Route>
            </Route>

            {/* Old top-level operational URLs → /demo */}
            {OPERATIONAL_BASES.map((base) => (
              <Route key={base} path={`${base}/*`} element={<LegacyRedirect />} />
            ))}

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DemoGuide />
          <WhatsAppChat />
          </MarketingZone>
          </AuditLogProvider>
          </NotificationsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

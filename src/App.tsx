import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import RulesEngine from "./pages/RulesEngine.tsx";
import RegulatoryReports from "./pages/RegulatoryReports.tsx";
import IdentityKYC from "./pages/IdentityKYC.tsx";
import SystemAudit from "./pages/SystemAudit.tsx";
import Customers from "./pages/Customers.tsx";
import Customer360 from "./pages/Customer360.tsx";
import AlertWorkspace from "./pages/AlertWorkspace.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rules" element={<RulesEngine />} />
            <Route path="/reports/cbn" element={<RegulatoryReports />} />
            <Route path="/reports/nfiu" element={<RegulatoryReports />} />
            <Route path="/identity" element={<IdentityKYC />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<Customer360 />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/audit" element={<SystemAudit />} />
            <Route path="/workspace" element={<AlertWorkspace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

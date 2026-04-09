import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import RulesEngine from "./pages/RulesEngine.tsx";
import RegulatoryReports from "./pages/RegulatoryReports.tsx";
import IdentityKYC from "./pages/IdentityKYC.tsx";
import SystemAudit from "./pages/SystemAudit.tsx";
import Customers from "./pages/Customers.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/dashboard" element={<Index />} />
          <Route path="/audit" element={<SystemAudit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

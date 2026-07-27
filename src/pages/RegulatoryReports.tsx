import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ComplianceTimeline } from '@/components/ComplianceTimeline';
import { ComplianceMetrics } from '@/components/ComplianceMetrics';
import { CTRManagement } from '@/components/CTRManagement';
import { STRManagement } from '@/components/STRManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const RegulatoryReports = () => {
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Regulatory Reports & Roadmap</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleExportPDF} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download CBN compliance report
              </Button>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Reference Circular</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">CBN Circular BSD/DIR/PUB/LAB/019/002</p>
                <p className="text-xs text-muted-foreground mt-1">AML/CFT/CPF Compliance Framework — Implementation Roadmap</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Report Generated</p>
                <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <Tabs defaultValue="roadmap" className="space-y-4">
              <TabsList>
                <TabsTrigger value="roadmap" className="text-xs">Roadmap & Metrics</TabsTrigger>
                <TabsTrigger value="ctr" className="text-xs">CTR (Currency Transaction Reports)</TabsTrigger>
                <TabsTrigger value="str" className="text-xs">STR Management</TabsTrigger>
              </TabsList>

              <TabsContent value="roadmap" className="space-y-6">
                <ComplianceTimeline />
                <ComplianceMetrics />
              </TabsContent>

              <TabsContent value="ctr">
                <CTRManagement />
              </TabsContent>

              <TabsContent value="str">
                <STRManagement />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RegulatoryReports;

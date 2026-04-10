import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RulesTable } from '@/components/RulesTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

const RulesEngine = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Rules Engine</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            <RulesTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RulesEngine;

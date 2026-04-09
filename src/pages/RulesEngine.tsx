import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RulesTable } from '@/components/RulesTable';
import { Bell } from 'lucide-react';

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
            <button className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
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

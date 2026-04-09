import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AlertInbox } from '@/components/AlertInbox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell } from 'lucide-react';

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Alert Inbox</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-risk-critical animate-pulse-soft" />
              </button>
            </div>
          </header>
          <main className="flex-1">
            <AlertInbox />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;

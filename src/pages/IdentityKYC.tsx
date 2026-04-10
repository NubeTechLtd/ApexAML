import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { VerificationQueue } from '@/components/VerificationQueue';
import { EDDWorkspace } from '@/components/EDDWorkspace';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { mockKYCCustomers, type KYCCustomer } from '@/data/mockKYC';

const IdentityKYC = () => {
  const [selected, setSelected] = useState<KYCCustomer | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">Identity & KYC Ops</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
            <div className="min-h-[280px]">
              <VerificationQueue
                customers={mockKYCCustomers}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
              />
            </div>
            <div className="border-t pt-6">
              <EDDWorkspace customer={selected} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default IdentityKYC;

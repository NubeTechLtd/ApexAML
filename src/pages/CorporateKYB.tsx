import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { AuditBell } from '@/components/AuditBell';
import { CorporateQueue } from '@/components/kyb/CorporateQueue';
import { CorporateEDDWorkspace } from '@/components/kyb/CorporateEDDWorkspace';
import { Building2 } from 'lucide-react';
import { mockCorporateEntities, type CorporateEntity } from '@/data/mockKYB';

const CorporateKYB = () => {
  const [entities, setEntities] = useState<CorporateEntity[]>(mockCorporateEntities);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = entities.find(e => e.id === selectedId) ?? null;

  const update = (patch: Partial<CorporateEntity>) => {
    if (!selectedId) return;
    setEntities(prev => prev.map(e => (e.id === selectedId ? { ...e, ...patch } : e)));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-14 flex items-center justify-between border-b px-6 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-sm font-semibold text-foreground">Corporate KYB</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  Know Your Business — CAC verification, beneficial ownership & director screening
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AuditBell />
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 min-h-0">
            <div className="w-[320px] border-r flex flex-col bg-muted/20 shrink-0">
              <CorporateQueue entities={entities} selectedId={selectedId} onSelect={e => setSelectedId(e.id)} />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <CorporateEDDWorkspace entity={selected} onUpdate={update} />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CorporateKYB;

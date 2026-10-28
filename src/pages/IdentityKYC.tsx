import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { VerificationQueue } from '@/components/VerificationQueue';
import { EDDWorkspace } from '@/components/EDDWorkspace';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { AuditBell } from '@/components/AuditBell';
import { Fingerprint } from 'lucide-react';
import type { KYCCustomer } from '@/data/models/kyc';
import { useDemoCollection } from '@/data-layer/demoDataset';
import { SEED_KYC } from '@/data-layer/seed/dataset';
import { useDataProvider } from '@/data-layer/hooks';
import type { AdverseMediaStatus } from '@/components/VerificationQueue';

const IdentityKYC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customers, setCustomers] = useDemoCollection<KYCCustomer[]>('kyc_queue', () => SEED_KYC);
  const selected = customers.find(c => c.id === selectedId) ?? null;
  const [adverseMedia, setAdverseMedia] = useState<Record<string, AdverseMediaStatus>>({});

  const provider = useDataProvider();

  useEffect(() => {
    let cancelled = false;
    provider.adverseMedia.latestLevels(SEED_KYC.map(c => c.bvn))
      .then((map) => { if (!cancelled) setAdverseMedia(map as Record<string, AdverseMediaStatus>); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [provider]);

  const handleSelect = (c: KYCCustomer) => setSelectedId(c.id);

  const handleTierUpgrade = (newTier: string) => {
    if (!selectedId) return;
    setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, kycTier: newTier } : c));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-14 flex items-center justify-between border-b px-6 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Fingerprint className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-sm font-semibold text-foreground">Identity & KYC Ops</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Verification & Enhanced Due Diligence</p>
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
              <VerificationQueue
                customers={customers}
                selectedId={selectedId}
                onSelect={handleSelect}
                adverseMedia={adverseMedia}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <EDDWorkspace customer={selected} onTierUpgrade={handleTierUpgrade} />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default IdentityKYC;

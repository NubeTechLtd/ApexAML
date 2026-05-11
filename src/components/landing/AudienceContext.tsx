import { createContext, useContext, useState, ReactNode } from 'react';

export type AudienceKey = 'dmb' | 'fintech' | 'psp' | 'mfb';

export interface AudienceProfile {
  key: AudienceKey;
  label: string;
  shortLabel: string;
  description: string;
  features: { title: string; desc: string }[];
}

export const AUDIENCES: Record<AudienceKey, AudienceProfile> = {
  dmb: {
    key: 'dmb',
    label: 'Deposit Money Bank',
    shortLabel: 'DMB',
    description: 'Tier-1/2 commercial banks regulated under CBN BOFIA.',
    features: [
      { title: 'Identity & KYC Ops', desc: 'Enterprise-grade BVN/NIN orchestration across millions of retail and corporate accounts with batch reverification.' },
      { title: 'AI STR Co-Pilot', desc: 'Drafts NFIU-grade STRs at branch volume — auto-routes to your central compliance team for board-level sign-off.' },
      { title: 'No-Code Rules Engine', desc: 'Replace your aging mainframe rules with versioned, examiner-defensible logic without involving IT.' },
      { title: 'Immutable Audit Trail', desc: 'Survives BOFIA inspections and external auditors — every analyst action cryptographically sealed.' },
    ],
  },
  fintech: {
    key: 'fintech',
    label: 'Licensed Fintech',
    shortLabel: 'Fintech',
    description: 'API-first lenders, neobanks, and wallet providers under CBN sandbox or full licensing.',
    features: [
      { title: 'Identity & KYC Ops', desc: 'Real-time BVN/NIN verification via API — onboard a customer in under 90 seconds with tiered KYC progression.' },
      { title: 'AI STR Co-Pilot', desc: 'Generative AI drafts STRs from your transaction stream — perfect for lean compliance teams of 1-3 analysts.' },
      { title: 'No-Code Rules Engine', desc: 'Iterate on fraud rules in production without redeploying your core. Catch P2P and crypto layering as it emerges.' },
      { title: 'Immutable Audit Trail', desc: 'Investor-ready: every customer interaction timestamped for due diligence, audits, and CBN renewal.' },
    ],
  },
  psp: {
    key: 'psp',
    label: 'Payment Service Provider',
    shortLabel: 'PSP',
    description: 'Switching, processing, and acquiring providers including agency banking & POS aggregators.',
    features: [
      { title: 'Identity & KYC Ops', desc: 'Verify agents, merchants, and end-customers through a unified BVN/NIN flow — flag mule terminals automatically.' },
      { title: 'AI STR Co-Pilot', desc: 'Detects and drafts STRs for POS structuring across agent networks — ApexAML-trained on Nigerian typology T-NG-204.' },
      { title: 'No-Code Rules Engine', desc: 'Set velocity, geography, and basket-size rules per merchant tier without engineering tickets.' },
      { title: 'Immutable Audit Trail', desc: 'Settle disputes with chargeback-proof records — every authorization and reversal logged forever.' },
    ],
  },
  mfb: {
    key: 'mfb',
    label: 'Microfinance Bank',
    shortLabel: 'MFB',
    description: 'Tier-1/2/3 microfinance banks under CBN MFB framework.',
    features: [
      { title: 'Identity & KYC Ops', desc: 'Affordable tiered KYC — onboard rural customers with NIN-only Tier 1, upgrade as they transact.' },
      { title: 'AI STR Co-Pilot', desc: 'No need for a senior analyst — AI drafts the STR, your compliance officer reviews and submits to NFIU.' },
      { title: 'No-Code Rules Engine', desc: 'Pre-built MFB-specific rules: cooperative pooling, group-loan layering, savings-account smurfing.' },
      { title: 'Immutable Audit Trail', desc: 'Survive CBN MFB inspections without scrambling — examiner-ready exports in two clicks.' },
    ],
  },
};

interface AudienceContextValue {
  audience: AudienceKey | null;
  setAudience: (key: AudienceKey | null) => void;
  profile: AudienceProfile | null;
}

const AudienceContext = createContext<AudienceContextValue | undefined>(undefined);

export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<AudienceKey | null>(null);
  const profile = audience ? AUDIENCES[audience] : null;
  return (
    <AudienceContext.Provider value={{ audience, setAudience, profile }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error('useAudience must be used within AudienceProvider');
  return ctx;
}

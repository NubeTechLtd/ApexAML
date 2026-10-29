import { Link } from 'react-router-dom';
import { ShieldCheck, Building2, Plug, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FACTS = [
  { icon: ShieldCheck, title: 'Built around CBN Circular BSD/DIR/PUB/LAB/019/002', copy: "The CBN’s 2025 draft standards for Automated AML Solutions inform our focus on real-time alerts, dynamic rules, NIN/BVN-linked onboarding and audit-ready reporting." },
  { icon: Building2, title: 'UK-governed by NubeTech Ltd', copy: 'NubeTech Ltd, registered in England and Wales, company number 11844857.' },
  { icon: Plug, title: 'Identity and sanctions integrations', copy: 'Designed to integrate with identity-verification and sanctions-screening vendors. No named vendor integration is currently verified live. The platform includes sanctions-name screening against stored lists, with ingestion paths for OFAC, UN and EU public lists and NFIU uploads.' },
];

export function SocialProofSection() {
  return <section className="py-24 px-6 border-y border-border" aria-label="Early-stage programme">
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="grid md:grid-cols-3 gap-8">
        {FACTS.map(({ icon: Icon, title, copy }) => <div key={title} className="space-y-4">
          <Icon className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-on-dark leading-relaxed">{copy}</p>
        </div>)}
      </div>
      <Button asChild size="lg"><Link to="/contact">Pilot programme open <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </div>
  </section>;
}

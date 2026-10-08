import { Check, X, Sparkles } from 'lucide-react';

type Tone = 'bad' | 'mid' | 'ok';

interface Row {
  feature: string;
  manual: { value: string; tone?: Tone };
  enterprise: { value: string; tone?: Tone };
  apexaml: string;
}

const ROWS: Row[] = [
  {
    feature: 'Setup Time',
    manual: { value: '6–12 months hiring', tone: 'bad' },
    enterprise: { value: '18–24 months', tone: 'bad' },
    apexaml: '48-hour API integration',
  },
  {
    feature: 'Monthly Cost',
    manual: { value: '₦3–8M salary/analyst', tone: 'mid' },
    enterprise: { value: 'From ₦1,100,000/month + ₦79,000,000+ implementation — enterprise only', tone: 'bad' },
    apexaml: 'From ₦550,000/month + ₦100,000 onboarding — 14-day free trial',
  },
  {
    feature: 'Nigerian Competitor Pricing',
    manual: { value: 'Autogon: From ₦2,500,000/month + ₦31,600,000 setup fee', tone: 'bad' },
    enterprise: { value: 'ComplyAdvantage: From ₦157,984/month — sanctions screening only, no case management or goAML export', tone: 'mid' },
    apexaml: 'Full case management + goAML export from ₦550,000/month',
  },
  {
    feature: 'goAML XML Export',
    manual: { value: 'Manual, error-prone', tone: 'bad' },
    enterprise: { value: 'Yes', tone: 'ok' },
    apexaml: 'One-click, auto-formatted',
  },
  {
    feature: 'Nigerian Typology Library',
    manual: { value: 'Ad-hoc', tone: 'bad' },
    enterprise: { value: 'Generic global', tone: 'mid' },
    apexaml: '8 Nigerian-specific rules pre-loaded',
  },
  {
    feature: 'CBN Roadmap Support',
    manual: { value: 'None', tone: 'bad' },
    enterprise: { value: 'None', tone: 'bad' },
    apexaml: 'Template included, co-authored',
  },
  {
    feature: 'AI STR Drafting',
    manual: { value: '3–5 hours per STR', tone: 'bad' },
    enterprise: { value: 'Partial', tone: 'mid' },
    apexaml: '11 minutes average',
  },
];

function ToneCell({ value, tone }: { value: string; tone?: 'bad' | 'mid' | 'ok' }) {
  return (
    <div className="flex items-start gap-2">
      {tone === 'bad' ? (
        <X className="h-3.5 w-3.5 text-risk-high shrink-0 mt-0.5" />
      ) : tone === 'ok' ? (
        <Check className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-white/30 shrink-0 mt-2" />
      )}
      <span className="text-sm text-white/55 leading-relaxed">{value}</span>
    </div>
  );
}

export function ComparisonSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">The Comparison</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Why Nigerian fintechs choose ApexAML
          </h2>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr]">
            {/* Header row */}
            <div className="p-5 border-b border-white/10" />
            <div className="p-5 border-b border-l border-white/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">In-house</p>
              <p className="text-sm text-white/80 font-semibold mt-1">Manual Compliance Team</p>
            </div>
            <div className="p-5 border-b border-l border-white/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Legacy vendor</p>
              <p className="text-sm text-white/80 font-semibold mt-1">Enterprise AML</p>
              <p className="text-[10px] text-white/30 mt-0.5">NICE Actimize, etc.</p>
            </div>
            <div className="relative p-5 border-b border-l border-primary/30 bg-primary/[0.07]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 shadow-lg">
                <Sparkles className="h-3 w-3" /> Recommended
              </span>
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">Modern platform</p>
              <p className="text-sm text-white font-semibold mt-1">ApexAML</p>
              <p className="text-[10px] text-primary/70 mt-0.5">Built for Nigeria</p>
            </div>

            {/* Body rows */}
            {ROWS.map((row, i) => (
              <div key={row.feature} className="contents">
                <div className={`p-5 ${i < ROWS.length - 1 ? 'border-b' : ''} border-white/10 flex items-center`}>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">{row.feature}</p>
                </div>
                <div className={`p-5 ${i < ROWS.length - 1 ? 'border-b' : ''} border-l border-white/10`}>
                  <ToneCell value={row.manual.value} tone={row.manual.tone} />
                </div>
                <div className={`p-5 ${i < ROWS.length - 1 ? 'border-b' : ''} border-l border-white/10`}>
                  <ToneCell value={row.enterprise.value} tone={row.enterprise.tone} />
                </div>
                <div className={`p-5 ${i < ROWS.length - 1 ? 'border-b border-primary/15' : ''} border-l border-primary/30 bg-primary/[0.07]`}>
                  <div className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-risk-low shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-sm text-risk-low font-medium leading-relaxed">{row.apexaml}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked cards — mobile */}
        <div className="md:hidden space-y-4">
          {[
            { title: 'Manual Compliance Team', subtitle: 'In-house', key: 'manual' as const, recommended: false },
            { title: 'Enterprise AML', subtitle: 'NICE Actimize, etc.', key: 'enterprise' as const, recommended: false },
            { title: 'ApexAML', subtitle: 'Built for Nigeria', key: 'apexaml' as const, recommended: true },
          ].map((col) => (
            <div
              key={col.key}
              className={`relative rounded-2xl border p-5 ${
                col.recommended
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {col.recommended && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3" /> Recommended
                </span>
              )}
              <p className={`text-sm font-semibold ${col.recommended ? 'text-white' : 'text-white/80'}`}>{col.title}</p>
              <p className={`text-[10px] mt-0.5 ${col.recommended ? 'text-primary/70' : 'text-white/30'}`}>{col.subtitle}</p>
              <div className="mt-4 space-y-3 divide-y divide-white/5">
                {ROWS.map((row) => (
                  <div key={row.feature} className="pt-3 first:pt-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{row.feature}</p>
                    {col.key === 'apexaml' ? (
                      <div className="flex items-start gap-2 mt-1.5">
                        <Check className="h-3.5 w-3.5 text-risk-low shrink-0 mt-0.5" strokeWidth={3} />
                        <span className="text-sm text-risk-low font-medium">{row.apexaml}</span>
                      </div>
                    ) : (
                      <div className="mt-1.5">
                        <ToneCell value={row[col.key].value} tone={row[col.key].tone} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-white/40">
          All prices NGN.{" "}
          <span className="text-primary/80">
            Founding-client pricing locked in while the CBN's 2025 draft standards for Automated AML Solutions are
            finalised.
          </span>
        </p>
      </div>
    </section>
  );
}

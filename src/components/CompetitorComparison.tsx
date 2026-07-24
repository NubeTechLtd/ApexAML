import { BarChart3, Check, Zap } from "lucide-react";

type Marker = "check" | "bolt" | "none";

interface Row {
  feature: string;
  apex: { value: string; marker?: Marker };
  autogon: { value: string; marker?: Marker };
}

const ROWS: Row[] = [
  { feature: "Year-one total cost (Growth equivalent)", apex: { value: "₦33,950,000", marker: "check" }, autogon: { value: "₦61,600,000" } },
  { feature: "Setup / onboarding fee", apex: { value: "₦350,000", marker: "check" }, autogon: { value: "₦31,600,000" } },
  { feature: "Time to go live", apex: { value: "5 business days", marker: "check" }, autogon: { value: "4–6 weeks" } },
  { feature: "NFIU goAML XML export", apex: { value: "Confirmed", marker: "check" }, autogon: { value: "Not published" } },
  { feature: "AI STR narrative drafting", apex: { value: "11 minutes", marker: "check" }, autogon: { value: "Not available" } },
  { feature: "IMTO Regulatory Pack (CBN IMTO §4.2)", apex: { value: "6 pre-built rules", marker: "check" }, autogon: { value: "Not available" } },
  { feature: "Case management workspace", apex: { value: "Full workspace", marker: "check" }, autogon: { value: "Not published" } },
  { feature: "Explainable alert UI", apex: { value: "Plain-English typology cards", marker: "check" }, autogon: { value: "Not published" } },
  { feature: "Transparent public pricing", apex: { value: "Yes", marker: "check" }, autogon: { value: "Demo only" } },
  { feature: "Data residency (NDPA 2023)", apex: { value: "AWS af-south-1", marker: "check" }, autogon: { value: "US-incorporated" } },
  { feature: "Live Nigerian clients", apex: { value: "Building", marker: "bolt" }, autogon: { value: "Several deployed", marker: "check" } },
  { feature: "Proprietary ML engine", apex: { value: "Rules + Claude API", marker: "bolt" }, autogon: { value: "Proprietary ML", marker: "check" } },
];

function MarkerIcon({ marker }: { marker?: Marker }) {
  if (marker === "check") return <Check className="h-3.5 w-3.5 text-risk-low shrink-0 mt-0.5" strokeWidth={3} />;
  if (marker === "bolt") return <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" strokeWidth={2.5} />;
  return <span className="h-1.5 w-1.5 rounded-full bg-white/30 shrink-0 mt-2" />;
}

export function CompetitorComparison() {
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">How we compare</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            ApexAML vs Autogon OmniGuard — the honest comparison
          </h2>
          <p className="text-sm text-white/55">
            Both platforms target CBN compliance. Here is what actually differs.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-[1.4fr_1fr_1fr]">
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Feature</p>
            </div>
            <div className="p-4 border-b border-l border-primary/30 bg-primary/[0.05]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">ApexAML</p>
            </div>
            <div className="p-4 border-b border-l border-white/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Autogon OmniGuard</p>
            </div>

            {ROWS.map((row, i) => {
              const isLast = i === ROWS.length - 1;
              const bgAlt = i % 2 === 1 ? "bg-white/[0.015]" : "";
              return (
                <div key={row.feature} className="contents">
                  <div className={`p-4 ${!isLast ? "border-b" : ""} border-white/10 flex items-center ${bgAlt}`}>
                    <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">{row.feature}</p>
                  </div>
                  <div className={`p-4 ${!isLast ? "border-b border-primary/15" : ""} border-l border-primary/30 bg-primary/[0.05]`}>
                    <div className="flex items-start gap-2">
                      <MarkerIcon marker={row.apex.marker} />
                      <span className="text-sm text-white font-medium leading-relaxed">{row.apex.value}</span>
                    </div>
                  </div>
                  <div className={`p-4 ${!isLast ? "border-b" : ""} border-l border-white/10 ${bgAlt}`}>
                    <div className="flex items-start gap-2">
                      <MarkerIcon marker={row.autogon.marker} />
                      <span className="text-sm text-white/60 leading-relaxed">{row.autogon.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile stacked */}
        <div className="md:hidden space-y-3">
          {ROWS.map((row, i) => (
            <div key={row.feature} className={`rounded-xl border border-white/10 p-4 ${i % 2 === 1 ? "bg-white/[0.02]" : "bg-white/[0.04]"}`}>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{row.feature}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border-l-2 border-primary/40 pl-2">
                  <p className="text-[9px] uppercase tracking-wider text-primary font-semibold mb-1">ApexAML</p>
                  <div className="flex items-start gap-1.5">
                    <MarkerIcon marker={row.apex.marker} />
                    <span className="text-xs text-white font-medium">{row.apex.value}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-semibold mb-1">Autogon</p>
                  <div className="flex items-start gap-1.5">
                    <MarkerIcon marker={row.autogon.marker} />
                    <span className="text-xs text-white/60">{row.autogon.value}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Highlighted summary card */}
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.08] to-amber-400/[0.03] p-6 md:p-8">
          <p className="text-sm md:text-base text-white/85 leading-relaxed">
            <span className="text-amber-300 font-semibold">ApexAML saves Nigerian institutions ₦27,650,000 in year one</span> compared to Autogon. We have the IMTO Regulatory Pack, the goAML XML export, and the AI STR co-pilot that Autogon does not offer. They have more clients and proprietary ML. We are building both. In the meantime, you get more for significantly less.
          </p>
        </div>

        <p className="text-[11px] text-white/40 leading-relaxed max-w-3xl">
          Autogon pricing based on publicly reported ₦31,600,000 setup fee and ₦2,500,000/month for commercial banks as reported in industry press, July 2026. Features based on published product information. Last updated July 2026.
        </p>
      </div>
    </section>
  );
}

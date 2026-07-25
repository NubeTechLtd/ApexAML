import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  FileCode2,
  ShieldCheck,
  Sun,
  Download,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onBookDemo: () => void;
}

const SLIDES = [
  {
    title: "Monday morning. 3 critical alerts from overnight.",
    caption:
      "Your compliance team sees their priorities the moment they log in. No hunting through spreadsheets.",
    visual: "briefing",
  },
  {
    title: "47 POS transactions. ₦14.8M. One beneficiary.",
    caption:
      "ApexAML explains every alert in plain English — not just the code. Your analysts understand why something was flagged, not just that it was.",
    visual: "alert",
  },
  {
    title: "STR drafted in 11 minutes. Not 3 hours.",
    caption:
      "The AI co-pilot reads the transaction data, the customer history, and the typology context — then drafts the complete NFIU report. Your analyst reviews and approves.",
    visual: "copilot",
  },
  {
    title: "One click. NFIU goAML XML. Filed.",
    caption:
      "The goAML 3.x XML file the NFIU portal requires — generated automatically from the case data. No manual XML. No formatting errors. No missed deadlines.",
    visual: "export",
  },
  {
    title: "Every action. Every decision. On record for CBN.",
    caption:
      "Every alert opened, every note added, every STR exported is logged with a timestamp, analyst name, and SHA-256 hash. This is what you show a CBN examiner.",
    visual: "audit",
  },
] as const;

export function ProductTourModal({ open, onClose, onBookDemo }: Props) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setI(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, SLIDES.length - 1));
      else if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <button
        onClick={onClose}
        aria-label="Close tour"
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-4xl bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest text-white/50">
              Product tour · Slide {i + 1} of {SLIDES.length}
            </span>
            <span className="text-[11px] text-white/40">~2 min</span>
          </div>
          <div className="flex gap-1">
            {SLIDES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  idx <= i ? "bg-[#D4A843]" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 md:px-10 pb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 mb-6 leading-tight">
            {slide.title}
          </h2>

          <div className="rounded-xl bg-slate-900 border border-white/10 p-5 md:p-6 mb-5 min-h-[280px]">
            <SlideVisual kind={slide.visual} />
          </div>

          <p className="text-sm md:text-base text-white/70 leading-relaxed">
            {slide.caption}
          </p>

          {isLast && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => {
                  onClose();
                  onBookDemo();
                }}
                className="bg-primary hover:bg-primary/90 rounded-xl font-semibold"
              >
                Book a live demo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  onClose();
                  navigate("/roadmap");
                }}
                className="rounded-xl bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                Generate your free CBN roadmap <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-900/50">
          <Button
            variant="ghost"
            onClick={() => setI((v) => Math.max(v - 1, 0))}
            disabled={i === 0}
            className="text-white/70 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === i ? "bg-[#D4A843] w-6" : "bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => setI((v) => Math.min(v + 1, SLIDES.length - 1))}
            disabled={isLast}
            className="text-white/70 hover:text-white disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SlideVisual({ kind }: { kind: string }) {
  if (kind === "briefing") {
    return (
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Sun className="h-4 w-4 text-[#D4A843]" />
          Daily briefing · Monday 8:04 AM WAT
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Critical" value="3" tone="red" />
          <StatChip label="High" value="8" tone="amber" />
          <StatChip label="Medium" value="14" tone="slate" />
        </div>
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 space-y-1">
          <div className="flex items-center gap-2 text-red-300 text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> CRITICAL · ALT-2026-0417
          </div>
          <div className="text-white font-semibold text-sm">
            Adebayo Ogunlesi — POS Round-Trip suspected
          </div>
          <div className="text-white/60 text-xs">
            47 transactions · ₦14,820,000 · Lekki merchant cluster
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-white/60 text-xs">
          ALT-2026-0416 — Cross-border IMTO velocity, ₦6.2M via 3 hops
        </div>
      </div>
    );
  }

  if (kind === "alert") {
    return (
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <div className="text-white text-sm font-semibold">
            ALT-2026-0417 · Adebayo Ogunlesi
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Under Review
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/60">
          {["New", "Triage", "Under Review", "STR Draft", "Filed"].map((s, idx) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  idx <= 2 ? "bg-[#D4A843]" : "bg-white/10",
                )}
              />
              <span className={idx <= 2 ? "text-white" : "text-white/40"}>{s}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[#D4A843]/40 bg-[#D4A843]/5 p-3">
          <div className="flex items-center gap-2 text-[#D4A843] text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> What this means
          </div>
          <p className="text-white/80 text-xs leading-relaxed">
            <span className="font-semibold text-white">POS Round-Trip</span> is a
            layering technique where funds move through multiple POS terminals to
            the same beneficiary within 24 hours — a common indicator of merchant
            collusion or terminal-based structuring under NFIU typology TR-04.
          </p>
        </div>
      </div>
    );
  }

  if (kind === "copilot") {
    return (
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A843]" />
          </div>
          <div className="text-white text-sm font-semibold">
            AI STR Co-Pilot · Drafting narrative
          </div>
          <span className="ml-auto text-[10px] text-emerald-400">11:24 elapsed</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/80 leading-relaxed space-y-2">
          <div>
            <span className="text-[#D4A843]">Section 5.2 — Reason for Suspicion</span>
          </div>
          <p>
            Between 03 and 06 Feb 2026, subject{" "}
            <span className="text-white">Adebayo O. Ogunlesi</span> (BVN 22XXXXXX514)
            executed <span className="text-white">47 POS transactions</span>{" "}
            aggregating <span className="text-white">₦14,820,000</span> across 6
            merchant terminals within Lekki Phase 1...
          </p>
          <p className="text-white/50">
            All transactions terminated at beneficiary account 30XXXXXX82 held with
            <span className="animate-pulse">▍</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-white/70">
            Typology matched: NFIU TR-04 · CBN Circular BSD/DIR/PUB/LAB/019/002
          </span>
        </div>
      </div>
    );
  }

  if (kind === "export") {
    return (
      <div className="space-y-4 text-left">
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-semibold text-sm">
              STR filed with NFIU
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              Ref NFIU/STR/2026/00417 · Confirmation received
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-4 flex items-center gap-3">
          <FileCode2 className="h-8 w-8 text-[#D4A843]" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-mono truncate">
              ALT-2026-0417_goAML_v3.xml
            </div>
            <div className="text-white/50 text-xs">12.4 KB · goAML 3.x schema</div>
            <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-400" />
            </div>
          </div>
          <Download className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
    );
  }

  // audit
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center gap-2 text-white text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-[#D4A843]" />
        System audit trail — ALT-2026-0417
      </div>
      {[
        { t: "08:04:12", who: "adaeze.o@bank", act: "Opened alert" },
        { t: "08:11:47", who: "adaeze.o@bank", act: "Added note · POS cluster verified" },
        { t: "08:23:02", who: "system", act: "AI STR draft generated" },
        { t: "08:34:19", who: "kunle.a@bank (MLRO)", act: "Approved STR" },
        { t: "08:35:00", who: "system", act: "goAML XML exported & filed" },
      ].map((row, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 text-xs rounded border border-white/5 bg-white/[0.02] px-3 py-2"
        >
          <span className="text-white/40 font-mono w-16">{row.t}</span>
          <span className="text-white/80 flex-1">{row.act}</span>
          <span className="text-white/50">{row.who}</span>
          <Hash className="h-3 w-3 text-emerald-400/70" />
          <span className="font-mono text-emerald-400/70 text-[10px]">
            a7f{idx}c…{idx}9e2
          </span>
        </div>
      ))}
      <div className="text-[10px] text-white/40 pt-1">
        Immutable · SHA-256 hashed · CBN examiner-ready
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "amber" | "slate";
}) {
  const tones = {
    red: "border-red-500/40 bg-red-500/10 text-red-300",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    slate: "border-white/10 bg-white/5 text-white/70",
  };
  return (
    <div className={cn("rounded-lg border p-2.5", tones[tone])}>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default ProductTourModal;

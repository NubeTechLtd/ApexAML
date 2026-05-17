import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/whatsapp";

interface FAQ {
  q: string;
  a: React.ReactNode;
  cta?: React.ReactNode;
}

const FAQS: FAQ[] = [
  {
    q: "Does ApexAML satisfy the June 2026 CBN circular requirements?",
    a: (
      <div className="space-y-3">
        <p>
          Yes. ApexAML was engineered specifically to satisfy the 10 capability areas mandated by Circular{" "}
          <span className="font-mono text-white/80 text-[12px]">BSD/DIR/PUB/LAB/019/002</span>:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] text-white/55 list-disc list-inside marker:text-primary">
          <li>Tiered CDD with BVN/NIN linkage</li>
          <li>Enhanced Due Diligence workflows</li>
          <li>PEP &amp; sanctions screening</li>
          <li>Beneficial-owner identification</li>
          <li>Transaction monitoring (Nigerian typologies)</li>
          <li>STR submission via NFIU goAML</li>
          <li>Currency Transaction Reporting (CTR)</li>
          <li>Independent immutable audit trail</li>
          <li>AML/CFT training &amp; board oversight</li>
          <li>5-year examiner-ready record retention</li>
        </ul>
      </div>
    ),
  },
  {
    q: "Where is our data stored — is it in Nigeria?",
    a: (
      <p>
        ApexAML is hosted on AWS <span className="text-white/80 font-mono text-[12px]">af-south-1</span> (Cape Town) —
        the closest AWS region with dedicated data-residency guarantees acceptable under the Nigeria Data Protection Act
        2023. PII never crosses borders without your written instruction, and we sign a data processing addendum (DPA)
        at contract signing.
      </p>
    ),
  },
  {
    q: "How long does integration take?",
    a: (
      <p>
        <span className="text-white/80 font-semibold">48 hours</span> for API-first fintechs (Paystack, Flutterwave,
        Mono, Okra). For legacy core banking systems (Finacle, T24, Flexcube) we typically deliver in{" "}
        <span className="text-white/80 font-semibold">2 weeks</span> via batch SFTP or middleware adapters. No vendor
        middleware required.
      </p>
    ),
  },
  {
    q: "What does it cost — is it affordable for a tier-3 MFB?",
    a: (
      <p>
        Pricing starts from <span className="text-white/80 font-semibold">₦550,000/month</span> — less than the loaded
        cost of a single compliance analyst (₦3–8M/year salary plus benefits). For institutions submitting their CBN
        roadmap before <span className="text-primary font-semibold">June 10, 2026</span>, the first month is free.
      </p>
    ),
  },
  {
    q: "Can ApexAML submit STRs directly to the NFIU goAML portal?",
    a: (
      <p>
        Today, ApexAML exports each STR as a fully-validated{" "}
        <span className="text-white/80 font-mono text-[12px]">goAML XML</span> file ready for one-click upload via the
        NFIU portal — no manual reformatting, no rejected submissions. Direct API submission to NFIU is on our{" "}
        <span className="text-primary font-semibold">Q3 2026</span> roadmap, pending NFIU API access.
      </p>
    ),
  },
  {
    q: "Is ApexAML CBN-approved?",
    a: (
      <p>
        The CBN does not maintain an official certified-vendor list for AML platforms. ApexAML is built exactly to the
        specifications laid out in Circular{" "}
        <span className="font-mono text-white/80 text-[12px]">BSD/DIR/PUB/LAB/019/002</span>, and we provide a
        clause-by-clause compliance mapping document with every deployment so your compliance officer can demonstrate
        fitness during examination.
      </p>
    ),
  },
  {
    q: "What happens during a CBN examiner visit?",
    a: (
      <div className="space-y-2">
        <p>
          Examiners typically request: (a) the institution's AML policy, (b) a sample of recent STRs, (c) the
          case-management trail for flagged customers, and (d) evidence of independent review. ApexAML produces all four
          on demand:
        </p>
        <ul className="space-y-1 text-[13px] text-white/55 list-disc list-inside marker:text-primary">
          <li>
            One-click <span className="text-white/80">examiner pack</span> exporting any date range as a sealed PDF
            bundle
          </li>
          <li>Cryptographically-sealed audit trail proving no record was tampered with</li>
          <li>Per-customer case file with full investigator notes, reviewer sign-off, and STR linkage</li>
          <li>Live dashboard your compliance officer can present directly to the examiner</li>
        </ul>
      </div>
    ),
  },
  {
    q: "Is ApexAML SOC 2 or ISO 27001 certified?",
    a: (
      <p>
        ApexAML is architected from the ground up to meet SOC 2 Type II and ISO 27001 standards. We enforce AES-256
        encryption at rest, TLS 1.3 in transit, strict role-based access controls (RBAC), and immutable audit logging.
        We are currently undergoing our formal readiness assessments for both certifications. In the interim, we provide
        a comprehensive Vendor Security Questionnaire and our AWS infrastructure compliance reports during procurement.
      </p>
    ),
  },
];

export function FAQSection() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Common questions</h2>
          <p className="text-white/45 text-sm max-w-xl mx-auto">
            Straight answers from our compliance team. Still unsure?{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Message us on WhatsApp
            </a>
            .
          </p>
        </div>

        <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-2">
          {FAQS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`faq-${i}`}
              className="rounded-xl border border-white/[0.08] border-l-2 border-l-transparent data-[state=open]:border-l-primary data-[state=open]:bg-white/[0.02] bg-white/[0.015] overflow-hidden transition-colors"
            >
              <AccordionTrigger className="px-5 py-4 text-left text-sm sm:text-base font-medium text-white hover:no-underline hover:bg-white/[0.02] min-h-[60px]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1 text-sm text-white/55 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <p className="text-sm text-white/50">Need a faster answer?</p>
          <Button
            asChild
            size="sm"
            className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-xs font-semibold h-10 px-4 group"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={16} />
              Message us on WhatsApp
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

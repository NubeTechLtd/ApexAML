import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

const SECTIONS = [
  {
    h: "1. Who we are",
    p: 'NubeTech Ltd (Trading as "ApexAML", "we") is a Nigerian-incorporated software vendor providing AML compliance technology to regulated financial institutions. We act as a Data Processor on behalf of our institutional clients, who remain the Data Controller for their customers\' personal data.',
  },
  {
    h: "2. Data we collect from this website",
    p: "When you submit a lead-capture form on this website (Book Demo, Roadmap Template, or our contact and demo booking forms), we collect: full name, work email, institution name, institution type, phone number, current AML setup, compliance timeline, and your consent state. We do not place advertising cookies and we do not sell your data.",
  },
  {
    h: "3. Lawful basis & purpose",
    p: "Under the Nigeria Data Protection Act 2023, we process this data based on your explicit consent (Section 25(1)(a)) for the sole purpose of (i) responding to your enquiry, (ii) scheduling a product demonstration, and (iii) sending the requested materials. We will not contact you for unrelated marketing without further consent.",
  },
  {
    h: "4. Where your data is stored",
    p: "All personal data submitted via this website is stored on AWS Cape Town (af-south-1) — the closest AWS region with data-residency commitments compatible with NDPA 2023. PII never crosses borders without your written instruction. Backups are encrypted at rest using AES-256.",
  },
  {
    h: "5. Retention",
    p: "Lead data is retained for 24 months from the date of last contact, after which it is deleted. You may request deletion at any time by emailing privacy@apexaml.com — we will action verified requests within 30 days as required by NDPA Section 36.",
  },
  {
    h: "6. Your rights",
    p: "You have the right to access, rectify, port, restrict processing of, object to, or delete your personal data. To exercise any right contact our Data Protection Officer at privacy@apexaml.com. You may also lodge a complaint with the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.",
  },
  {
    h: "7. Contact",
    p: "Data Protection Officer — privacy@apexaml.com. NubeTech Ltd (trading as ApexAML), Lagos, Nigeria.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground">
      <Seo
        title="Privacy Policy | ApexAML"
        description="How ApexAML collects, processes and stores personal data under the Nigeria Data Protection Act 2023. Data residency, lawful basis, and your NDPA rights."
        path="/privacy"
      />
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-base text-white tracking-tight">ApexAML</span>
          </Link>
          <Button asChild size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-primary">
            NDPR Compliant
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-white/45">
            Effective date: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="space-y-7">
          {SECTIONS.map(({ h, p }) => (
            <section key={h} className="space-y-2">
              <h2 className="text-base font-semibold text-white">{h}</h2>
              <p className="text-sm text-white/60 leading-relaxed">{p}</p>
            </section>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-white/70 space-y-1">
            <p className="font-medium text-white">Need to exercise a data right?</p>
            <p>
              Email{" "}
              <a href="mailto:privacy@apexaml.com" className="text-primary hover:underline">
                privacy@apexaml.com
              </a>{" "}
              — we respond within 30 days.
            </p>
          </div>
        </div>

        <p className="text-xs text-white/30 pt-6 border-t border-white/[0.06]">
          A signed Data Processing Agreement (DPA) is provided to all institutional clients at contract signing. Request
          a copy at{" "}
          <a href="mailto:privacy@apexaml.com" className="text-primary hover:underline">
            privacy@apexaml.com
          </a>
          .
        </p>
      </main>
    </div>
  );
}

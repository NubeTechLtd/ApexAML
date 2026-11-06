import { useEffect, useRef, useState } from "react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock, FileText, Loader2, Mail, ShieldCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Seo } from "@/components/Seo";
import { CompanyFooterLine } from "@/components/CompanyFooterLine";
import { BookDemoSheet } from "@/components/landing/BookDemoSheet";
import { WhatsAppIcon } from "@/components/landing/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { publicSubmitErrorMessage, submitPublicForm } from "@/lib/publicSubmit";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { HoneypotField } from "@/components/HoneypotField";
import logo from "@/assets/logo.svg";

const ORG_TYPES = ["PSP", "MFB", "IMTO", "Bank", "Other"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  organisation: z.string().trim().min(2, "Please enter your organisation").max(150),
  organisationType: z.enum(ORG_TYPES, { errorMap: () => ({ message: "Please choose an organisation type" }) }),
  role: z.string().trim().min(2, "Please enter your role").max(100),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
  phone: z.string().trim().max(20).regex(/^\+?[0-9 ()-]{7,20}$/, "Please enter a valid phone number").optional().or(z.literal("")),
});

type FormState = { name: string; email: string; organisation: string; organisationType: string; role: string; message: string; phone: string };
const EMPTY: FormState = { name: "", email: "", organisation: "", organisationType: "", role: "", message: "", phone: "" };

const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-muted-on-dark h-11 rounded-lg";
const labelCls = "text-white/70 text-xs uppercase tracking-wider";

export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const turnstile = useRef<TurnstileInstance>();

  useEffect(() => { void trackEvent("contact_page_view", { source: "contact_page" }); }, []);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setServerError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { name, organisation, organisationType, ...rest } = parsed.data;
    const result = await submitPublicForm("contact", {
      ...rest, full_name: name, institution_name: organisation, institution_type: organisationType,
    }, { turnstile, website });
    setSubmitting(false);
    if (!result.ok) {
      setServerError(result.reason === "rate_limited"
        ? "You've sent several messages in a short time. Please try again later, or chat with us on WhatsApp."
        : result.reason?.startsWith("verification")
          ? publicSubmitErrorMessage(result)
          : "We couldn't send your message. Please try again, or email hello@apexaml.com.");
      return;
    }
    void trackEvent("contact_form_submitted", { source: "contact_page", metadata: { organisation_type: parsed.data.organisationType } });
    setDone(true);
  };

  const field = (id: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`ct-${id}`} className={labelCls}>{label}</Label>
      <Input id={`ct-${id}`} value={form[id]} onChange={(e) => set(id)(e.target.value)} className={inputCls}
        aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `ct-${id}-err` : undefined} {...props} />
      {errors[id] && <p id={`ct-${id}-err`} className="text-xs text-roadmap-warning">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground">
      <Seo title="Contact ApexAML | Talk to our team"
        description="Tell us about your institution and we will respond within one business day. Book a 30-minute walkthrough, chat on WhatsApp or email hello@apexaml.com."
        path="/contact" />
      <header className="border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ApexAML" className="h-7 w-7" />
            <span className="font-bold text-lg tracking-tight text-white">ApexAML</span>
          </Link>
          <Button asChild size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl space-y-3 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Talk to ApexAML</h1>
          <p className="text-base text-white/70">Tell us about your institution and we will respond within one business day.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8">
            {done ? (
              <div role="status" className="space-y-4 py-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-risk-low" />
                <h2 className="text-xl font-semibold text-white">Thank you — your message has been sent</h2>
                <p className="text-sm text-white/70">Our team will reply to {form.email} within one business day.</p>
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5" onClick={() => { setForm(EMPTY); setDone(false); }}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("name", "Name", { autoComplete: "name", maxLength: 100 })}
                  {field("email", "Work email", { type: "email", autoComplete: "email", maxLength: 255 })}
                  {field("organisation", "Organisation", { autoComplete: "organization", maxLength: 150 })}
                  <div className="space-y-2">
                    <Label className={labelCls}>Organisation type</Label>
                    <Select value={form.organisationType} onValueChange={set("organisationType")}>
                      <SelectTrigger className={inputCls} aria-label="Organisation type" aria-invalid={!!errors.organisationType}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.organisationType && <p className="text-xs text-roadmap-warning">{errors.organisationType}</p>}
                  </div>
                  {field("role", "Role", { autoComplete: "organization-title", maxLength: 100 })}
                  {field("phone", "Phone number (optional, for our team to call you)", { type: "tel", autoComplete: "tel", maxLength: 20 })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ct-message" className={labelCls}>Message</Label>
                  <Textarea id="ct-message" value={form.message} onChange={(e) => set("message")(e.target.value)} maxLength={2000} rows={5}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-muted-on-dark rounded-lg" aria-invalid={!!errors.message} />
                  {errors.message && <p className="text-xs text-roadmap-warning">{errors.message}</p>}
                </div>
                {/* Honeypot: hidden from people, filled by bots */}
                <HoneypotField id="ct-website" value={website} onChange={setWebsite} />
                <TurnstileWidget ref={turnstile} action="contact" />
                {serverError && <p role="alert" className="text-sm text-roadmap-warning">{serverError}</p>}
                <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : "Send message"}
                </Button>
              </form>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
              <Button onClick={() => setDemoOpen(true)} className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg">
                <CalendarCheck className="h-4 w-4" />Book a 30-minute walkthrough
              </Button>
              <Button asChild variant="outline" className="w-full h-11 border-white/20 bg-transparent text-white hover:bg-white/5 hover:text-white rounded-lg">
                <Link to="/roadmap"><FileText className="h-4 w-4" />Get the free compliance roadmap</Link>
              </Button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-whatsapp text-green-control-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                <WhatsAppIcon size={18} />Chat on WhatsApp
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 text-sm">
              <div className="flex gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-white/70">General enquiries</p>
                  <a href="mailto:hello@apexaml.com" className="text-primary underline underline-offset-2">hello@apexaml.com</a>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-white/70">Data and privacy enquiries only</p>
                  <a href="mailto:privacy@apexaml.com" className="text-primary underline underline-offset-2">privacy@apexaml.com</a>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p className="text-white/70">Mon to Fri, 9am to 5pm UK time</p>
              </div>
              <div className="flex gap-3">
                <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p className="text-white/70">NubeTech Ltd, registered in England and Wales, company number 11844857, United Kingdom</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-on-dark">
          <CompanyFooterLine className="text-muted-on-dark" />
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-muted-on-dark-hover transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-muted-on-dark-hover transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      <BookDemoSheet open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}

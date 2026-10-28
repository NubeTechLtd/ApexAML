import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Seo } from "@/components/Seo";
import { CompanyFooterLine } from "@/components/CompanyFooterLine";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { hasDemoEntry, markDemoEntry, setDemoSessionId } from "@/data-layer/demoStore";

const ORG_TYPES = ["PSP", "MFB", "IMTO", "Bank", "Other"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  organisationType: z.enum(ORG_TYPES, { errorMap: () => ({ message: "Please choose an organisation type" }) }),
  role: z.string().trim().min(2, "Please enter your role").max(100),
});

type FormState = { name: string; email: string; organisationType: string; role: string };

export default function DemoEntry() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: "", email: "", organisationType: "", role: "" });
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [alreadyIn] = useState(hasDemoEntry);

  useEffect(() => { if (!alreadyIn) void trackEvent("demo_entry_view", { source: "demo_entry" }); }, [alreadyIn]);
  if (alreadyIn) return <Navigate to="/demo/dashboard" replace />;

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
    const { data, error } = await supabase.functions.invoke("start-demo-session", { body: { ...parsed.data, website } });
    setSubmitting(false);
    if (error || !data?.ok || !data.sessionId) {
      const status = (error as { context?: Response } | null)?.context?.status;
      setServerError(status === 429
        ? "Several demo sessions were started from here recently. Please wait a few minutes and try again."
        : "We couldn't start the demo. Please try again.");
      return;
    }
    setDemoSessionId(data.sessionId);
    markDemoEntry(data.sessionId);
    void trackEvent("demo_entry_submitted", { source: "demo_entry", metadata: { organisation_type: parsed.data.organisationType } });
    navigate("/demo/dashboard");
  };

  const field = (id: "name" | "email" | "role", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`de-${id}`}>{label}</Label>
      <Input id={`de-${id}`} value={form[id]} onChange={(e) => set(id)(e.target.value)}
        aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `de-${id}-err` : undefined} {...props} />
      {errors[id] && <p id={`de-${id}-err`} className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-2.5rem)] bg-background text-foreground flex flex-col">
      <Seo title="Try the ApexAML demo" description="Explore ApexAML on sample data: alerts, case investigation, STR drafting, CTR filing and the audit trail." path="/demo" />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Try the ApexAML demo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us who you are and we'll open a demo workspace with a fictional microfinance bank. Everything you do stays in your browser.
          </p>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {field("name", "Name", { autoComplete: "name", maxLength: 100 })}
            {field("email", "Work email", { type: "email", autoComplete: "email", maxLength: 255 })}
            <div className="space-y-2">
              <Label htmlFor="de-org">Organisation type</Label>
              <Select value={form.organisationType} onValueChange={set("organisationType")}>
                <SelectTrigger id="de-org" aria-invalid={!!errors.organisationType}><SelectValue placeholder="Choose one" /></SelectTrigger>
                <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {errors.organisationType && <p className="text-xs text-destructive">{errors.organisationType}</p>}
            </div>
            {field("role", "Role", { autoComplete: "organization-title", maxLength: 100 })}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="de-website">Website</label>
              <input id="de-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Open the demo
            </Button>
          </form>
        </div>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-muted-foreground"><CompanyFooterLine /></footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Database, KeyRound, Lock, ScrollText, ShieldCheck, Users } from "lucide-react";
import { Seo } from "@/components/Seo";
import { MarketingPageShell } from "@/components/landing/MarketingPageShell";

const ITEMS = [
  { icon: Database, title: "Hosting", body: "Hosted on Supabase (AWS Ireland, eu-west-1), encrypted in transit and at rest. Data residency in Nigeria is not currently offered. Contact us about your requirements." },
  { icon: Users, title: "Institution isolation", body: "Every customer record, case, report and file belongs to one institution. Database rules only let members of that institution see or change it." },
  { icon: KeyRound, title: "Roles", body: "Analysts, compliance officers and institution administrators each get their own permissions. Activity logs are visible only to compliance officers and administrators." },
  { icon: ScrollText, title: "Activity log", body: "Actions are written to an append-only, hash-chained activity log. Entries cannot be edited or deleted from inside the app, and the chain can be checked from the audit page." },
  { icon: Lock, title: "Staff access", body: "ApexAML staff have no automatic access to customer data. Support access needs two-factor sign-in, a written reason, is limited to one institution, expires, and is logged." },
  { icon: ShieldCheck, title: "Core banking connections", body: "Incoming transactions must be signed with the institution's own key and a fresh timestamp. Repeat deliveries are ignored and every refused request is logged." },
];

export default function Security() {
  return (
    <MarketingPageShell>
      {() => (
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Seo title="Security at ApexAML | Hosting, isolation and access control"
            description="How ApexAML hosts and protects institution data: AWS Ireland hosting, per-institution isolation, role-based access, an append-only activity log and logged staff access."
            path="/security" />
          <div className="max-w-2xl space-y-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Security</h1>
            <p className="text-base text-white/70">How we host and protect your institution's data.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map(({ icon: Icon, title, body }) => (
              <section key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/70">{body}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 text-sm text-white/70">
            Sub-processors and your data rights are listed in our{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      )}
    </MarketingPageShell>
  );
}

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyFooterLine } from "@/components/CompanyFooterLine";
import { BookDemoSheet } from "@/components/landing/BookDemoSheet";
import logo from "@/assets/logo.svg";

/** Header + footer shared by standalone marketing pages (same look as Contact). */
export function MarketingPageShell({ children }: { children: (openBooking: (message?: string) => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const openBooking = (m?: string) => { setMessage(m); setOpen(true); };

  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground">
      <header className="border-b border-white/[0.06] bg-[hsl(220,25%,6%)]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ApexAML" className="h-7 w-7" />
            <span className="font-bold text-lg tracking-tight text-white">ApexAML</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
              <Link to="/demo?demo=true">Try the demo</Link>
            </Button>
            <Button size="sm" onClick={() => openBooking()} className="bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
              Book a walkthrough
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
              <Link to="/"><ArrowLeft className="h-4 w-4" />Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>{children(openBooking)}</main>

      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-on-dark">
          <CompanyFooterLine className="text-muted-on-dark" />
          <div className="flex gap-5">
            <Link to="/pricing" className="hover:text-muted-on-dark-hover transition-colors">Pricing</Link>
            <Link to="/security" className="hover:text-muted-on-dark-hover transition-colors">Security</Link>
            <Link to="/privacy" className="hover:text-muted-on-dark-hover transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-muted-on-dark-hover transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      <BookDemoSheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setMessage(undefined); }} prefilledMessage={message} />
    </div>
  );
}

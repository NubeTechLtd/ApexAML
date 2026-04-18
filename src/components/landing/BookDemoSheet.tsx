import { useState } from 'react';
import { Loader2, CheckCircle2, CalendarCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INSTITUTIONS = ['DMB', 'Fintech', 'PSP', 'MMO', 'MFB', 'IMTO'];

export function BookDemoSheet({ open, onOpenChange }: Props) {
  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('leads').insert({
      email,
      full_name: fullName,
      institution_name: institutionName,
      institution_type: institutionType,
      phone: `+234${phone.replace(/^\+?234/, '')}`,
      source: 'book_demo_sheet',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    setDone(true);
    toast({ title: 'Demo requested', description: "We'll reach out within 24 hours." });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setDone(false); }}>
      <SheetContent className="bg-[hsl(220,25%,8%)] border-l border-white/10 text-white sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <SheetTitle className="text-white text-xl">Book a Sentinel Demo</SheetTitle>
          <SheetDescription className="text-white/50">
            30-minute walkthrough tailored to your institution. We'll reach out within 24 hours.
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="mt-10 flex flex-col items-center justify-center text-center space-y-4 py-10">
            <div className="h-14 w-14 rounded-full bg-risk-low/15 border border-risk-low/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-risk-low" />
            </div>
            <h3 className="text-white font-semibold text-lg">Request received</h3>
            <p className="text-white/50 text-sm max-w-xs">
              A Sentinel specialist will email you to schedule your private walkthrough.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bd-name" className="text-white/70 text-xs uppercase tracking-wider">Full Name</Label>
              <Input id="bd-name" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bd-inst" className="text-white/70 text-xs uppercase tracking-wider">Institution Name</Label>
              <Input id="bd-inst" required value={institutionName} onChange={(e) => setInstitutionName(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-xs uppercase tracking-wider">Institution Type</Label>
              <Select value={institutionType} onValueChange={setInstitutionType} required>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-lg">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(220,25%,10%)] border-white/10 text-white">
                  {INSTITUTIONS.map((i) => (
                    <SelectItem key={i} value={i} className="focus:bg-white/10 focus:text-white">{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bd-email" className="text-white/70 text-xs uppercase tracking-wider">Work Email</Label>
              <Input id="bd-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bank.com"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bd-phone" className="text-white/70 text-xs uppercase tracking-wider">Phone</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-white/[0.06] text-white/60 text-sm font-mono">+234</span>
                <Input id="bd-phone" required value={phone} onChange={(e) => setPhone(e.target.value.replace(/^\+?234/, ''))}
                  placeholder="8012345678" inputMode="tel"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-l-none rounded-r-lg" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 font-semibold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Demo'}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

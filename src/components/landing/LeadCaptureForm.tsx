import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NDPRConsent } from './NDPRConsent';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_URL } from '@/lib/whatsapp';

const INSTITUTIONS = ['DMB', 'Fintech', 'PSP', 'MMO', 'MFB', 'IMTO'];
const SETUPS = ['Manual spreadsheets', 'Legacy software', 'No formal system', 'Other'];
const TIMELINES = [
  { value: 'before_june', label: 'Before June 10 roadmap deadline' },
  { value: 'within_6_months', label: 'Within 6 months' },
  { value: 'exploring', label: 'Exploring options' },
];

const inputCls = 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg';
const labelCls = 'text-white/70 text-xs uppercase tracking-wider';

export function LeadCaptureForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState('');
  const [currentSetup, setCurrentSetup] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !consent) return;
    setSubmitting(true);
    const { error } = await supabase.from('leads').insert({
      email,
      full_name: fullName,
      institution_name: institutionName,
      institution_type: institutionType,
      compliance_timeline: timeline,
      current_setup: currentSetup,
      phone: `+234${phone.replace(/^\+?234/, '')}`,
      ndpr_consent: consent,
      source: 'final_cta_2step',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    setDone(true);
    toast({ title: 'Request received', description: "We'll be in touch within 24 hours." });
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 space-y-6"
      >
        <div className="flex items-center justify-center gap-2 text-risk-low">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-semibold text-base">You're on the list</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-4 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold">Option 1</p>
              <p className="text-sm text-white/70">We'll email you within 24 hours.</p>
            </div>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/15 transition-colors p-4 text-left group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white">
              <WhatsAppIcon size={16} />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-xs uppercase tracking-wider text-[hsl(142,70%,55%)] font-semibold">Option 2 — Faster</p>
              <p className="text-sm text-white/80 font-medium">
                Get a faster response — message us on WhatsApp
                <ArrowRight className="inline h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium ml-2">Step {step} / 2</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleStep1}
            className="space-y-4 text-left"
          >
            <div className="space-y-2">
              <Label htmlFor="lc-name" className={labelCls}>Full Name</Label>
              <Input id="lc-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-inst" className={labelCls}>Institution Name</Label>
              <Input id="lc-inst" required value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Institution Type</Label>
              <Select value={institutionType} onValueChange={setInstitutionType} required>
                <SelectTrigger className={inputCls}>
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
              <Label htmlFor="lc-email" className={labelCls}>Work Email</Label>
              <Input id="lc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@bank.com" className={inputCls} />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!consent || !institutionType}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 font-semibold group disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>

            <NDPRConsent checked={consent} onCheckedChange={setConsent} id="ndpr-step1" />
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleFinalSubmit}
            className="space-y-5 text-left"
          >
            <div className="space-y-3">
              <Label className={labelCls}>How soon do you need to comply?</Label>
              <RadioGroup value={timeline} onValueChange={setTimeline} required className="space-y-2">
                {TIMELINES.map((t) => (
                  <label
                    key={t.value}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-3 cursor-pointer transition-colors"
                  >
                    <RadioGroupItem value={t.value} id={`tl-${t.value}`} className="border-white/30 text-primary" />
                    <span className="text-sm text-white/80">{t.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className={labelCls}>Current AML setup</Label>
              <Select value={currentSetup} onValueChange={setCurrentSetup} required>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select your current system" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(220,25%,10%)] border-white/10 text-white">
                  {SETUPS.map((s) => (
                    <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lc-phone" className={labelCls}>Phone</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-white/[0.06] text-white/60 text-sm font-mono">+234</span>
                <Input
                  id="lc-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/^\+?234/, ''))}
                  placeholder="8012345678"
                  inputMode="tel"
                  className={`${inputCls} rounded-l-none`}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setStep(1)}
                className="bg-transparent border-white/15 text-white/70 hover:bg-white/5 hover:text-white rounded-lg h-12"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!consent || !timeline || !currentSetup || submitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 font-semibold disabled:opacity-40"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Private Access'}
              </Button>
            </div>

            <NDPRConsent checked={consent} onCheckedChange={setConsent} id="ndpr-step2" />
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, CalendarCheck, ArrowLeft, ArrowRight, Calendar, Clock, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledMessage?: string;
}

const INSTITUTION_TYPES = ['DMB', 'Fintech', 'PSP', 'MFB', 'IMTO', 'Other'];
const ROLES = ['CCO', 'Head of Compliance', 'Compliance Manager', 'CEO/MD', 'CTO', 'Other'];
const SLOT_HOURS = [10, 12, 14, 16]; // WAT (UTC+1)

// Build next 10 working days (Mon-Fri) starting from tomorrow
function buildSlots(): { date: Date; slots: Date[] }[] {
  const out: { date: Date; slots: Date[] }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (out.length < 10) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const day = new Date(cursor);
      const slots = SLOT_HOURS.map((h) => {
        // Construct a UTC moment for h:00 WAT (UTC+1) → UTC = h - 1
        const d = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h - 1, 0, 0));
        return d;
      });
      out.push({ date: day, slots });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function fmtSlotTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
}
function fmtDayLabel(d: Date) {
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Africa/Lagos' });
  const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
  return { wd, dm };
}
function fmtConfirmedLabel(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Africa/Lagos' });
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' });
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
  return `${day}, ${date} at ${time}`;
}

export function BookDemoSheet({ open, onOpenChange, prefilledMessage }: Props) {
  const [step, setStep] = useState(1);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [role, setRole] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [focusAreas, setFocusAreas] = useState(prefilledMessage ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const { toast } = useToast();

  const weekGrid = useMemo(() => buildSlots(), []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedSlot(null);
        setConfirmedAt(null);
        setSubmitting(false);
      }, 250);
    }
  }, [open]);

  // Load booked slots when entering Step 2
  useEffect(() => {
    if (step !== 2) return;
    setLoadingSlots(true);
    const start = weekGrid[0].slots[0].toISOString();
    const end = weekGrid[weekGrid.length - 1].slots[3].toISOString();
    supabase
      .from('demo_slot_availability')
      .select('slot_datetime, status')
      .gte('slot_datetime', start)
      .lte('slot_datetime', end)
      .in('status', ['booked', 'blocked'])
      .then(({ data }) => {
        setBookedSlots(new Set((data ?? []).map((r) => new Date(r.slot_datetime).toISOString())));
        setLoadingSlots(false);
      });
  }, [step, weekGrid]);

  const canContinueStep1 = institutionName.trim().length >= 2 && institutionType && role;
  const canContinueStep2 = !!selectedSlot;
  const canSubmitStep3 = fullName.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const handleSubmit = async () => {
    if (!canSubmitStep3 || !selectedSlot || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('send-demo-confirmation', {
      body: {
        institutionName,
        institutionType,
        role,
        fullName,
        email,
        whatsapp: whatsapp || undefined,
        focusAreas: focusAreas || undefined,
        slotDatetime: selectedSlot,
      },
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      const reason = (data as { reason?: string })?.reason;
      toast({
        title: reason === 'slot_taken' ? 'Slot just got booked' : 'Booking failed',
        description: reason === 'slot_taken'
          ? 'Please pick another slot.'
          : 'Please try again or message us on WhatsApp.',
        variant: 'destructive',
      });
      if (reason === 'slot_taken') {
        setBookedSlots((prev) => new Set(prev).add(selectedSlot));
        setSelectedSlot(null);
        setStep(2);
      }
      return;
    }
    setConfirmedAt(selectedSlot);
    setStep(4);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[hsl(220,25%,8%)] border-l border-white/10 text-white sm:max-w-lg w-full overflow-y-auto p-0">
        <div className="p-6">
          {/* Header */}
          <SheetHeader className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-white text-lg">Book a 30-minute walkthrough</SheetTitle>
                <SheetDescription className="text-white/50 text-xs">
                  {step === 4 ? 'Confirmed' : `Step ${step} of 3 · then run a 30-45 day pilot on your own data`}
                </SheetDescription>
              </div>
            </div>
            {step !== 4 && (
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      step >= s ? 'bg-primary' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </SheetHeader>

          {prefilledMessage && step === 1 && (
            <div className="mb-5 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-white/80">
              {prefilledMessage}
            </div>
          )}

          {/* STEP 1 — Qualification */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Institution Name</Label>
                <Input
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. First Bank Nigeria"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Institution Type</Label>
                <Select value={institutionType} onValueChange={setInstitutionType}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,25%,10%)] border-white/10 text-white">
                    {INSTITUTION_TYPES.map((i) => (
                      <SelectItem key={i} value={i} className="focus:bg-white/10 focus:text-white">{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Your Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-11 rounded-lg">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,25%,10%)] border-white/10 text-white">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="focus:bg-white/10 focus:text-white">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 font-semibold disabled:opacity-40"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 2 — Scheduling */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Clock className="h-3.5 w-3.5" /> All times shown in WAT (West Africa Time)
              </div>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12 text-white/40">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {weekGrid.map(({ date, slots }) => {
                    const { wd, dm } = fmtDayLabel(date);
                    return (
                      <div key={date.toISOString()} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-white font-semibold text-sm">{wd}</span>
                          <span className="text-white/40 text-xs">{dm}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {slots.map((slot) => {
                            const iso = slot.toISOString();
                            const isBooked = bookedSlots.has(iso);
                            const isSelected = selectedSlot === iso;
                            return (
                              <button
                                key={iso}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setSelectedSlot(iso)}
                                className={`
                                  h-9 rounded-md text-xs font-medium transition-all border
                                  ${isBooked
                                    ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed line-through'
                                    : isSelected
                                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
                                      : 'bg-white/[0.04] border-white/10 text-white/80 hover:border-primary/50 hover:bg-primary/10'}
                                `}
                              >
                                {fmtSlotTime(slot)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canContinueStep2}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 font-semibold disabled:opacity-40"
                >
                  Confirm this slot <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Contact details */}
          {step === 3 && (
            <div className="space-y-5">
              {selectedSlot && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-white/80 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{fmtConfirmedLabel(selectedSlot)} WAT</span>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Work Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bank.com"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">WhatsApp Number <span className="text-white/30 normal-case">(optional)</span></Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+234 801 234 5678" inputMode="tel"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-xs uppercase tracking-wider">What do you most want to see?</Label>
                <Textarea value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. AI STR co-pilot, IMTO module, transaction monitoring..."
                  rows={3}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 rounded-lg resize-none" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}
                  className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmitStep3 || submitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 font-semibold disabled:opacity-40">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Book a 30-minute walkthrough <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 — Confirmation */}
          {step === 4 && confirmedAt && (
            <div className="py-4 text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"
              >
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              </motion.div>
              <div className="space-y-1.5">
                <h3 className="text-white font-semibold text-lg">Demo confirmed</h3>
                <p className="text-primary text-sm font-medium">{fmtConfirmedLabel(confirmedAt)} WAT</p>
                <p className="text-white/50 text-xs">A calendar invite and preparation guide have been sent to <strong className="text-white/80">{email}</strong></p>
              </div>

              <div className="text-left rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">Before the call</div>
                {[
                  'Review your last 30 days of alert volume',
                  'Note your current STR turnaround time',
                  'List your top 3 compliance pain points',
                  'Have one sample alert ready to walk through',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-white/75">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400/70 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button asChild variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200">
                  <a href={buildWhatsAppUrl(`Hi, I just booked a demo for ${fmtConfirmedLabel(confirmedAt)} WAT — please add me to a WhatsApp reminder.`)} target="_blank" rel="noreferrer">
                    Get WhatsApp reminder
                  </a>
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                  <X className="h-4 w-4" /> Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickDemoBar({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('leads').insert({ email, source: 'navbar' });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    setDone(true);
    setEmail('');
    toast({ title: "You're on the list!", description: "We'll be in touch shortly." });
    setTimeout(() => { onClose(); setDone(false); }, 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-16 inset-x-0 z-40 h-[60px] bg-white/[0.05] backdrop-blur-xl border-b border-white/10"
        >
          <div className="mx-auto max-w-6xl h-full flex items-center justify-between gap-4 px-6">
            {done ? (
              <div className="flex items-center gap-2 text-risk-low text-sm font-medium mx-auto">
                <CheckCircle2 className="h-4 w-4" />
                Thanks — we'll be in touch shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-1 max-w-xl mx-auto">
                <span className="hidden sm:inline text-xs uppercase tracking-wider text-white/50 font-medium whitespace-nowrap">
                  Quick Demo Request
                </span>
                <Input
                  type="email"
                  required
                  autoFocus
                  placeholder="your@bank.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 rounded-lg h-9 text-sm focus-visible:ring-primary/40"
                />
                <Button type="submit" disabled={submitting} size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold h-9 px-4 whitespace-nowrap">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Request Demo <ArrowRight className="h-3.5 w-3.5 ml-1" /></>}
                </Button>
              </form>
            )}
            <button
              onClick={onClose}
              aria-label="Dismiss"
              className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

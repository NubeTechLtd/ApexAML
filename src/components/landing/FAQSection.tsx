import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_URL } from '@/lib/whatsapp';

interface QA {
  q: string;
  a: React.ReactNode;
  cta?: React.ReactNode;
}

const FAQS: QA[] = [
  {
    q: 'How quickly can we go live?',
    a: '48 hours for a sandbox API connection. 2–3 weeks for a fully tuned production deployment with your transaction patterns and Nigerian typology rules dialled in.',
  },
  {
    q: 'Do you support NFIU goAML XML format?',
    a: 'Yes — every Suspicious Transaction Report is exported in the NFIU-mandated goAML XML schema. One-click submission, no manual reformatting.',
  },
  {
    q: 'Will my customer data leave Nigeria?',
    a: 'No. Sentinel is hosted on AWS af-south-1 (Cape Town) with NDPR-compliant data residency. PII never crosses borders without your written instruction.',
  },
  {
    q: 'How do I get in touch quickly?',
    a: 'WhatsApp is fastest — our compliance team responds within 2 hours on business days.',
    cta: (
      <Button
        asChild
        size="sm"
        className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg text-xs font-semibold h-9 px-4 mt-3 group"
      >
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={16} />
          Message us on WhatsApp
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </Button>
    ),
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors min-h-[60px]"
                >
                  <span className="text-sm sm:text-base font-medium text-white">{item.q}</span>
                  <span className="shrink-0 h-7 w-7 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/60">
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-white/55 leading-relaxed">
                        {item.a}
                        {item.cta}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

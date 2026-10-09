import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onBookDemo: () => void;
  onVisibilityChange?: (visible: boolean) => void;
}

const DISMISS_KEY = 'apexaml_sticky_bar_dismissed';

export function StickyComplianceBar({ onBookDemo, onVisibilityChange }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? scrolled / max : 0;
      setVisible(pct >= 0.5);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    onVisibilityChange?.(visible && !dismissed);
  }, [visible, dismissed, onVisibilityChange]);

  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-40 h-16 bg-[hsl(220,25%,8%)]/95 backdrop-blur-xl border-t border-primary/20 shadow-[0_-8px_30px_-10px_hsl(var(--primary)/0.2)]"
          role="region"
          aria-label="Compliance standards notice"
        >
          <div className="mx-auto max-w-6xl h-full flex items-center justify-between gap-3 px-4 sm:px-6">
            {/* LEFT — Draft standards */}
            <div className="flex items-center gap-2 shrink-0">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-xs sm:text-sm font-medium text-white">
                <span className="text-white/70">The CBN's </span>
                <span className="text-primary font-bold">2025 draft standards</span>
                <span className="text-white/70"> for Automated AML Solutions</span>
              </p>
            </div>

            {/* CENTER — Tagline (desktop only) */}
            <p className="hidden lg:block text-sm text-white/80 font-medium">
              Then run a 30-45 day pilot on your own data
            </p>

            {/* RIGHT — Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onBookDemo}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold h-9 px-3 sm:px-4"
              >
                Book a 30-minute walkthrough
              </Button>
              <button
                type="button"
                aria-label="Dismiss bar"
                onClick={handleClose}
                className="ml-1 h-9 w-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

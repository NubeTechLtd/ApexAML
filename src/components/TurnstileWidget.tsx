import { forwardRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile';
import type { PublicFormId } from '@/lib/publicSubmit';

interface Props {
  /** Form id, sent to Cloudflare as the action and checked by the server. */
  action: PublicFormId;
  className?: string;
  /** Marketing surfaces are always dark; other pages follow the visitor's theme. */
  theme?: 'dark' | 'auto';
}

/**
 * Cloudflare Turnstile check for public forms. It stays hidden unless Cloudflare
 * needs the visitor to click, so form layouts are unchanged for most visitors.
 */
export const TurnstileWidget = forwardRef<TurnstileInstance | undefined, Props>(({ action, className, theme = 'dark' }, ref) => (
  <Turnstile
    ref={ref}
    siteKey={TURNSTILE_SITE_KEY}
    className={className}
    options={{ action, theme, appearance: 'interaction-only', size: 'flexible' }}
  />
));
TurnstileWidget.displayName = 'TurnstileWidget';

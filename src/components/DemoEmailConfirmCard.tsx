import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { getDemoNotificationCredentials } from '@/data-layer/demoStore';
import { resendDemoConfirmation, useDemoEmailConfirmation, verifyDemoEmailCode, type ConfirmationSendStatus } from '@/data-layer/demoEmailConfirmation';

const minutes = (s?: number) => Math.max(1, Math.ceil((s ?? 3600) / 60));

function sendMessage(status: ConfirmationSendStatus | undefined, email: string, retry?: number): string {
  switch (status) {
    case 'sent': return `We sent a six-digit code to ${email}. It is valid for 30 minutes.`;
    case 'address_limit': return `A code was already sent to this address in the last hour. You can request a new one in about ${minutes(retry)} minutes.`;
    case 'ip_limit': return `Too many codes were requested from your network. You can request a new one in about ${minutes(retry)} minutes.`;
    case 'suppressed': return `We can't send email to ${email || 'this address'}, so demo notifications will stay in the Demo Inbox.`;
    case 'failed': return 'We could not send the code just now. Please try again shortly.';
    default: return `Request a code to confirm ${email || 'your email'}.`;
  }
}

/** Confirm the demo email address; until then notifications appear only in the Demo Inbox. */
export function DemoEmailConfirmCard() {
  const state = useDemoEmailConfirmation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'verify' | 'resend' | null>(null);
  const [error, setError] = useState('');
  if (!getDemoNotificationCredentials()) return null;

  if (state?.confirmed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Email confirmed. Demo notifications are also emailed to <span className="font-medium">{state.email}</span>.</p>
      </div>
    );
  }

  const email = state?.email ?? '';
  const verify = async () => {
    setBusy('verify'); setError('');
    const r = await verifyDemoEmailCode(code);
    setBusy(null);
    if (r.confirmed) return;
    setCode('');
    setError(r.reason === 'expired' ? 'This code has expired. Request a new code.'
      : r.reason === 'too_many_attempts' ? 'Too many incorrect attempts. Request a new code.'
      : r.reason === 'invalid_code' ? `That code isn't right.${r.attemptsLeft !== undefined ? ` ${r.attemptsLeft} attempt${r.attemptsLeft === 1 ? '' : 's'} left.` : ''}`
      : 'We could not check the code. Please try again.');
  };
  const resend = async () => {
    setBusy('resend'); setError('');
    await resendDemoConfirmation();
    setBusy(null);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-3">
          <div>
            <p className="font-medium text-foreground">Confirm your email to receive demo notifications</p>
            <p className="mt-1 text-muted-foreground">Until you confirm, demo notifications appear only in the Demo Inbox. {sendMessage(state?.lastSend?.status, email, state?.lastSend?.retryAfterSeconds)}</p>
          </div>
          {state?.lastSend?.status !== 'suppressed' && (
            <div className="flex flex-wrap items-center gap-3">
              <InputOTP maxLength={6} value={code} onChange={(v) => setCode(v.replace(/\D/g, ''))} aria-label="Six-digit confirmation code" inputMode="numeric">
                <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
              <Button size="sm" onClick={verify} disabled={code.length !== 6 || busy !== null}>
                {busy === 'verify' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={resend} disabled={busy !== null}>
                {busy === 'resend' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Send a new code
              </Button>
            </div>
          )}
          {error && <p role="alert" className="text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/** Compact banner link shown until the address is confirmed. */
export function DemoEmailConfirmLink() {
  const state = useDemoEmailConfirmation();
  if (!getDemoNotificationCredentials() || state?.confirmed) return null;
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
      <Link to="/demo/inbox"><MailCheck className="h-3.5 w-3.5" /> Confirm email</Link>
    </Button>
  );
}

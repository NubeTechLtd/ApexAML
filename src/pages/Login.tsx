import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { OtpInput } from '@/components/auth/OtpInput';

type Step = 'password' | 'mfa';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('password');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'unauthorized'
      ? 'Your account does not have admin access. Contact hello@apexaml.com.'
      : searchParams.get('mfa') === 'required'
        ? 'Two-factor authentication is required. Sign in again and enter your 6-digit code.'
        : null,
  );

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') return;
    if (searchParams.get('mfa') === 'required') return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/admin/roadmaps', { replace: true });
    });
  }, [navigate, searchParams]);

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setLoading(false);
      setError('Invalid email or password. Contact your ApexAML administrator.');
      return;
    }

    // Determine whether this account has a verified TOTP factor pending verification.
    const [{ data: factorsData }, { data: aalData }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setLoading(false);

    const totp = factorsData?.totp?.find((f) => f.status === 'verified') ?? factorsData?.totp?.[0];
    if (totp && aalData?.nextLevel === 'aal2' && aalData?.currentLevel !== 'aal2') {
      setFactorId(totp.id);
      setCode('');
      setStep('mfa');
      return;
    }

    navigate('/admin/roadmaps', { replace: true });
  };

  const verifyCode = async (otp: string) => {
    if (!factorId || otp.length < 6) return;
    setError(null);
    setLoading(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: otp,
    });
    setLoading(false);
    if (verifyError) {
      setCode('');
      triggerShake();
      setError('Incorrect code — please try again');
      return;
    }
    navigate('/admin/roadmaps', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Seo
        title="Sign in | ApexAML"
        description="Sign in to the ApexAML compliance platform. Restricted to authorised compliance officers and admin users at customer institutions."
        path="/login"
      />
      <Card className="w-full max-w-[400px] p-8">
        {step === 'password' ? (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold tracking-tight">ApexAML</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ApexAML Admin — Compliance Intelligence Platform
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@apexaml.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              ApexAML admin access is restricted. Contact{' '}
              <a href="mailto:hello@apexaml.com" className="underline hover:text-foreground">
                hello@apexaml.com
              </a>{' '}
              for access.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <ShieldCheck className="h-7 w-7 text-primary mb-2" />
              <h1 className="text-xl font-semibold tracking-tight">Two-factor authentication</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyCode(code);
              }}
              className="space-y-5"
            >
              <OtpInput
                autoFocus
                value={code}
                onChange={setCode}
                onComplete={verifyCode}
                disabled={loading}
                shake={shake}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || code.length < 6}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify →'}
              </Button>
            </form>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              Lost access to your authenticator app? Email{' '}
              <a href="mailto:hello@apexaml.com" className="underline hover:text-foreground">
                hello@apexaml.com
              </a>{' '}
              from your registered address to have two-factor authentication reset.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

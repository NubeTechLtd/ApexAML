import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShieldCheck, ShieldAlert, LifeBuoy } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { OtpInput } from '@/components/auth/OtpInput';
import { toast } from '@/hooks/use-toast';

type Factor = { id: string; status: string; friendly_name?: string | null };

export default function Settings() {
  const [searchParams] = useSearchParams();
  const setupRequired = searchParams.get('setup') === 'mfa';

  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removePassword, setRemovePassword] = useState('');
  const [removing, setRemoving] = useState(false);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === 'verified') ?? null;
    setFactor(verified as Factor | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const startEnrollment = async () => {
    setError(null);
    setEnrolling(true);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setEnrolling(false);
    if (enrollError || !data) {
      setError(enrollError?.message ?? 'Could not start enrollment. Please try again.');
      return;
    }
    setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode('');
  };

  const confirmEnrollment = async (otp: string) => {
    if (!enrollment || otp.length < 6) return;
    setError(null);
    setVerifying(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code: otp,
    });
    setVerifying(false);
    if (verifyError) {
      setCode('');
      setError('Incorrect code — please try again');
      return;
    }
    setEnrollment(null);
    await loadFactors();
    toast({ title: 'Two-factor authentication enabled' });
  };

  const removeFactor = async () => {
    if (!factor) return;
    setError(null);
    setRemoving(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setRemoving(false);
      setError('Could not confirm your account. Please sign in again.');
      return;
    }
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email,
      password: removePassword,
    });
    if (pwError) {
      setRemoving(false);
      setError('Password incorrect. 2FA was not removed.');
      return;
    }
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setRemoving(false);
    setRemovePassword('');
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    await loadFactors();
    toast({ title: 'Two-factor authentication removed' });
  };

  return (
    <SidebarProvider>
      <Seo
        title="Account settings | ApexAML"
        description="Manage your ApexAML account security, including two-factor authentication for admin access."
        path="/settings"
      />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold">Account Settings</h1>
            </div>
            <ThemeToggle />
          </header>

          <div className="mx-auto max-w-2xl p-6 space-y-6">
            {setupRequired && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  Your organisation requires two-factor authentication for admin accounts. Please set
                  it up to continue.
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Two-Factor Authentication</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Time-based one-time passwords (TOTP) via Google Authenticator, Authy or 1Password.
                  </p>
                </div>
                {factor && (
                  <Badge className="bg-risk-low/15 text-risk-low border-risk-low/30 shrink-0">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    Active
                  </Badge>
                )}
              </div>

              <Separator className="my-5" />

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking your security settings…
                </div>
              ) : factor ? (
                <div className="space-y-4">
                  <p className="text-sm text-risk-low font-medium">
                    Two-factor authentication is active
                  </p>
                  <RecoveryNotice />
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm font-medium">Remove 2FA</p>
                    <p className="text-xs text-muted-foreground">
                      Confirm your password to disable two-factor authentication on this account.
                    </p>
                    <div className="space-y-1.5">
                      <Label htmlFor="removePassword">Password</Label>
                      <Input
                        id="removePassword"
                        type="password"
                        autoComplete="current-password"
                        value={removePassword}
                        onChange={(e) => setRemovePassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={removing || removePassword.length < 6}
                      onClick={removeFactor}
                    >
                      {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove 2FA'}
                    </Button>
                  </div>
                </div>
              ) : enrollment ? (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app, then enter the 6-digit code to
                    finish setup.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={enrollment.qr}
                      alt="TOTP enrollment QR code for ApexAML two-factor authentication"
                      className="h-48 w-48 rounded-lg bg-card p-2 border"
                    />
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Manual entry key</p>
                    <p className="mt-1 break-all font-mono text-sm">{enrollment.secret}</p>
                  </div>
                  <OtpInput
                    autoFocus
                    value={code}
                    onChange={setCode}
                    onComplete={confirmEnrollment}
                    disabled={verifying}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={verifying || code.length < 6}
                      onClick={() => confirmEnrollment(code)}
                    >
                      {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm code →'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await supabase.auth.mfa.unenroll({ factorId: enrollment.id });
                        setEnrollment(null);
                        setCode('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your account does not have two-factor authentication enabled.
                  </p>
                  <Button onClick={startEnrollment} disabled={enrolling}>
                    {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable 2FA →'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function RecoveryNotice() {
  return (
    <div className="rounded-lg border border-risk-medium/40 bg-risk-medium/5 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <LifeBuoy className="h-4 w-4" /> If you lose your authenticator app
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        ApexAML does not issue self-service backup codes. Keep your authenticator app backed up. If
        you lose access to it, email{' '}
        <a href="mailto:hello@apexaml.com" className="underline hover:text-foreground">
          hello@apexaml.com
        </a>{' '}
        from your registered address and an administrator will verify your identity and reset
        two-factor authentication for your account.
      </p>
    </div>
  );
}

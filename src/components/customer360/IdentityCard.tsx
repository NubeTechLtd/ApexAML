import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, User, CheckCircle2 } from 'lucide-react';
import type { Customer360Data } from '@/data/mockCustomer360';

const livenessColors: Record<string, string> = {
  Pass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Fail: 'bg-destructive/10 text-destructive border-destructive/20',
  Pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
};

export function Customer360IdentityCard({ customer }: { customer: Customer360Data }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" /> Identity & KYC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID photo + Liveness */}
        <div className="flex items-start gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <User className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Badge variant="outline" className={`text-xs ${livenessColors[customer.livenessCheck]}`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Liveness Check: {customer.livenessCheck}
            </Badge>
            <p className="text-xs text-muted-foreground">ID Photo on file</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">BVN</p>
            <p className="font-mono font-medium text-foreground">{customer.bvn}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">NIN</p>
            <p className="font-mono font-medium text-foreground">{customer.nin}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date of Birth</p>
            <p className="font-medium text-foreground">{customer.dob}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Active Alerts</p>
            <p className="font-medium text-foreground">{customer.alerts}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Registered Address</p>
          <p className="text-sm text-foreground">{customer.address}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const TYPOLOGIES = [
  'POS Round-Trip',
  'BDC Smurfing',
  'USSD Layering',
  'Dormant Activation',
  'Crypto P2P',
  'Salary Mule',
  'Real Estate Front',
  'PEP Spending Spike',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRuleSheet({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [typology, setTypology] = useState('');
  const [threshold, setThreshold] = useState('');
  const [riskTier, setRiskTier] = useState('');
  const [channel, setChannel] = useState('');
  const [active, setActive] = useState(true);

  const handleCreate = () => {
    if (!name || !typology) return;
    toast({
      title: 'Rule Created',
      description: `"${name}" added to the rulebook and ${active ? 'activated' : 'saved as draft'}.`,
    });
    onOpenChange(false);
    setName(''); setTypology(''); setThreshold(''); setRiskTier(''); setChannel(''); setActive(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">New Detection Rule</SheetTitle>
              <SheetDescription className="text-xs">Define a new transaction monitoring rule.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Name</Label>
            <Input placeholder="e.g. POS Round-Trip Detection" value={name} onChange={e => setName(e.target.value)} className="h-10 bg-background" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Typology</Label>
            <Select value={typology} onValueChange={setTypology}>
              <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Select typology…" /></SelectTrigger>
              <SelectContent>
                {TYPOLOGIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Threshold (₦)</Label>
            <Input type="number" placeholder="5,000,000" value={threshold} onChange={e => setThreshold(e.target.value)} className="h-10 bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Risk Tier</Label>
              <Select value={riskTier} onValueChange={setRiskTier}>
                <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="ussd">USSD</SelectItem>
                  <SelectItem value="mobile">Mobile Banking</SelectItem>
                  <SelectItem value="internet">Internet Banking</SelectItem>
                  <SelectItem value="atm">ATM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active on Save</p>
              <p className="text-xs text-muted-foreground">Rule will start triggering alerts immediately</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="border-t px-6 py-4 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={!name || !typology}>Create Rule</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

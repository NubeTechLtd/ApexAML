import { useState } from 'react';
import {
  Zap, Bolt, GitBranch, Clock, ShieldAlert, Plus, Trash2, GripVertical, ArrowDown,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Operator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
type ConditionField = 'amount' | 'count' | 'velocity' | 'risk_score' | 'sender_country';

interface ConditionRow {
  id: string;
  field: ConditionField;
  operator: Operator;
  value: string;
}

const OPERATORS: { v: Operator; l: string }[] = [
  { v: 'gt', l: 'Greater Than' },
  { v: 'gte', l: '≥' },
  { v: 'lt', l: 'Less Than' },
  { v: 'lte', l: '≤' },
  { v: 'eq', l: 'Equals' },
];

const FIELDS: { v: ConditionField; l: string; unit?: string }[] = [
  { v: 'amount', l: 'Amount', unit: '₦' },
  { v: 'count', l: 'Txn Count' },
  { v: 'velocity', l: 'Velocity' },
  { v: 'risk_score', l: 'Risk Score' },
  { v: 'sender_country', l: 'Sender Country' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function ChainConnector({ label }: { label?: string }) {
  return (
    <div className="relative flex flex-col items-center py-1">
      <div className="h-5 w-px bg-gradient-to-b from-primary/40 via-primary/60 to-primary/40" />
      {label && (
        <Badge variant="outline" className="my-0.5 h-5 px-2 text-[9px] font-bold tracking-widest border-primary/30 bg-primary/5 text-primary">
          {label}
        </Badge>
      )}
      <div className="h-5 w-px bg-gradient-to-b from-primary/40 via-primary/60 to-primary/40" />
      <ArrowDown className="h-3 w-3 -mt-1.5 text-primary/70" />
    </div>
  );
}

interface BlockProps {
  icon: React.ReactNode;
  label: string;
  tone: 'trigger' | 'condition' | 'time' | 'action';
  children: React.ReactNode;
  onRemove?: () => void;
  draggable?: boolean;
}

const TONES: Record<BlockProps['tone'], string> = {
  trigger: 'border-l-primary bg-gradient-to-br from-primary/10 via-card to-card',
  condition: 'border-l-amber-500 bg-gradient-to-br from-amber-500/10 via-card to-card',
  time: 'border-l-cyan-500 bg-gradient-to-br from-cyan-500/10 via-card to-card',
  action: 'border-l-rose-500 bg-gradient-to-br from-rose-500/10 via-card to-card',
};

function LogicBlock({ icon, label, tone, children, onRemove, draggable }: BlockProps) {
  return (
    <div className={cn(
      'relative rounded-xl border border-border/60 border-l-4 shadow-sm hover:shadow-md transition-shadow',
      'backdrop-blur-sm',
      TONES[tone],
    )}>
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-2">
          {draggable && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 cursor-grab" />}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-background/60 border border-border/50">
            {icon}
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Remove block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </div>
  );
}

export function NewRuleSheet({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  // Visual chain state
  const [trigger, setTrigger] = useState<string>('pos');
  const [conditions, setConditions] = useState<ConditionRow[]>([
    { id: uid(), field: 'amount', operator: 'gt', value: '5000000' },
  ]);
  const [timeWindow, setTimeWindow] = useState('24');
  const [timeUnit, setTimeUnit] = useState('hours');
  const [action, setAction] = useState('escalate_critical');

  const addCondition = () => {
    setConditions(c => [...c, { id: uid(), field: 'amount', operator: 'gt', value: '' }]);
  };
  const removeCondition = (id: string) => {
    setConditions(c => c.length > 1 ? c.filter(r => r.id !== id) : c);
  };
  const updateCondition = (id: string, patch: Partial<ConditionRow>) => {
    setConditions(c => c.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const handleCreate = () => {
    if (!name) return;
    toast({
      title: 'Rule Created',
      description: `"${name}" compiled with ${conditions.length} condition${conditions.length > 1 ? 's' : ''} and ${active ? 'activated' : 'saved as draft'}.`,
    });
    onOpenChange(false);
    setName('');
    setConditions([{ id: uid(), field: 'amount', operator: 'gt', value: '5000000' }]);
    setActive(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Visual Rule Builder</SheetTitle>
                <SheetDescription className="text-xs">No-code DAG composer · drag, connect, deploy.</SheetDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono tracking-wider border-primary/30 text-primary bg-primary/5">
              DAG · v2
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-muted/30 via-background to-muted/20">
          {/* Rule Name */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Name</Label>
            <Input
              placeholder="e.g. POS Round-Trip Detection"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 bg-background"
            />
          </div>

          {/* Visual Logic Chain */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Logic Chain
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {conditions.length + 3} nodes · DAG compiled
              </span>
            </div>

            <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-4 space-y-0">
              {/* TRIGGER */}
              <LogicBlock icon={<Bolt className="h-3.5 w-3.5 text-primary" />} label="Trigger" tone="trigger" draggable>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-muted-foreground">When transaction occurs via</span>
                  <Select value={trigger} onValueChange={setTrigger}>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pos">POS</SelectItem>
                      <SelectItem value="imto">IMTO</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="ussd">USSD</SelectItem>
                      <SelectItem value="mobile">Mobile Banking</SelectItem>
                      <SelectItem value="atm">ATM</SelectItem>
                      <SelectItem value="any">Any Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </LogicBlock>

              {/* CONDITIONS */}
              {conditions.map((cond, i) => {
                const fieldMeta = FIELDS.find(f => f.v === cond.field);
                return (
                  <div key={cond.id}>
                    <ChainConnector label="AND" />
                    <LogicBlock
                      icon={<GitBranch className="h-3.5 w-3.5 text-amber-500" />}
                      label={i === 0 ? 'Condition' : `Condition ${i + 1}`}
                      tone="condition"
                      onRemove={conditions.length > 1 ? () => removeCondition(cond.id) : undefined}
                      draggable
                    >
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Select value={cond.field} onValueChange={(v: ConditionField) => updateCondition(cond.id, { field: v })}>
                          <SelectTrigger className="h-8 w-auto min-w-[110px] bg-background font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELDS.map(f => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground text-xs">is</span>
                        <Select value={cond.operator} onValueChange={(v: Operator) => updateCondition(cond.id, { operator: v })}>
                          <SelectTrigger className="h-8 w-auto min-w-[120px] bg-background font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1 min-w-[140px]">
                          {fieldMeta?.unit && (
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                              {fieldMeta.unit}
                            </span>
                          )}
                          <Input
                            value={cond.value}
                            onChange={e => updateCondition(cond.id, { value: e.target.value })}
                            placeholder="value"
                            className={cn('h-8 bg-background font-mono text-sm', fieldMeta?.unit && 'pl-6')}
                          />
                        </div>
                      </div>
                    </LogicBlock>
                  </div>
                );
              })}

              {/* + Add Condition */}
              <div className="relative flex flex-col items-center py-2">
                <div className="h-4 w-px bg-border" />
                <button
                  onClick={addCondition}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all hover:shadow-md hover:shadow-primary/20"
                >
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  Add Condition
                </button>
                <div className="h-4 w-px bg-border" />
              </div>

              {/* TIME WINDOW */}
              <LogicBlock icon={<Clock className="h-3.5 w-3.5 text-cyan-500" />} label="Time Window" tone="time" draggable>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-muted-foreground">WITHIN</span>
                  <Input
                    type="number"
                    value={timeWindow}
                    onChange={e => setTimeWindow(e.target.value)}
                    className="h-8 w-20 bg-background font-mono font-medium"
                  />
                  <Select value={timeUnit} onValueChange={setTimeUnit}>
                    <SelectTrigger className="h-8 w-auto min-w-[110px] bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </LogicBlock>

              <ChainConnector label="THEN" />

              {/* ACTION */}
              <LogicBlock icon={<ShieldAlert className="h-3.5 w-3.5 text-rose-500" />} label="Action" tone="action" draggable>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-muted-foreground">Execute</span>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="h-8 w-auto min-w-[200px] bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escalate_critical">Escalate to Critical</SelectItem>
                      <SelectItem value="escalate_high">Escalate to High</SelectItem>
                      <SelectItem value="freeze_account">Freeze Account</SelectItem>
                      <SelectItem value="hold_transaction">Hold Transaction</SelectItem>
                      <SelectItem value="notify_compliance">Notify Compliance Officer</SelectItem>
                      <SelectItem value="auto_str">Auto-draft STR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </LogicBlock>
            </div>
          </div>

          {/* Activate */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
            <div>
              <p className="text-sm font-medium text-foreground">Active on Save</p>
              <p className="text-xs text-muted-foreground">Rule will start triggering alerts immediately</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="border-t px-6 py-4 flex gap-3 shrink-0 bg-card">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={!name}>
            <Zap className="h-4 w-4 mr-1.5" />
            Compile & Deploy Rule
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

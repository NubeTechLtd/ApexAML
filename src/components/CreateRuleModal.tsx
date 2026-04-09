import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Condition {
  id: number;
  field: string;
  operator: string;
  value: string;
  connector: 'AND' | 'OR';
}

const fieldOptions = [
  'Transaction Volume',
  'Transaction Amount',
  'Transaction Count',
  'Account Age (days)',
  'Sender Risk Score',
  'Recipient Country Risk',
  'Channel Type',
  'Customer Tier',
];

const operatorOptions = ['>', '<', '>=', '<=', '=', '!=', 'contains', 'in'];

interface CreateRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRuleModal({ open, onOpenChange }: CreateRuleModalProps) {
  const { toast } = useToast();
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [framework, setFramework] = useState<'banks' | 'fintechs'>('banks');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, field: '', operator: '', value: '', connector: 'AND' },
  ]);

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: Date.now(), field: '', operator: '', value: '', connector: 'AND' },
    ]);
  };

  const removeCondition = (id: number) => {
    if (conditions.length > 1) {
      setConditions((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const updateCondition = (id: number, key: keyof Condition, value: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    );
  };

  const handleCreate = () => {
    toast({
      title: 'Rule Created',
      description: `"${ruleName}" has been created and is ready for activation.`,
    });
    onOpenChange(false);
    setRuleName('');
    setDescription('');
    setSeverity('');
    setConditions([{ id: 1, field: '', operator: '', value: '', connector: 'AND' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Create New Rule
          </DialogTitle>
          <DialogDescription>
            Define conditions to automatically detect suspicious transaction patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Rule Name
              </Label>
              <Input
                placeholder="e.g. High-Value Transfers"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alert Severity
              </Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select severity…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-critical))]" /> Critical
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-high))]" /> High
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-medium))]" /> Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-low))]" /> Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </Label>
            <Input
              placeholder="Briefly describe what this rule detects…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background"
            />
          </div>

          <Separator />

          {/* Logic Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conditions
              </Label>
              <Badge variant="outline" className="text-[10px] font-normal">
                {conditions.length} condition{conditions.length !== 1 && 's'}
              </Badge>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id}>
                  {index > 0 && (
                    <div className="flex justify-center py-1.5">
                      <Select
                        value={condition.connector}
                        onValueChange={(v) => updateCondition(condition.id, 'connector', v)}
                      >
                        <SelectTrigger className="w-20 h-7 text-xs bg-muted border-0 font-semibold text-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                    <span className="text-xs font-semibold text-primary shrink-0 w-5">IF</span>

                    <Select
                      value={condition.field}
                      onValueChange={(v) => updateCondition(condition.id, 'field', v)}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs bg-background">
                        <SelectValue placeholder="Select field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(v) => updateCondition(condition.id, 'operator', v)}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs bg-background">
                        <SelectValue placeholder="Op" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      className="w-28 h-8 text-xs bg-background"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCondition(condition.id)}
                      disabled={conditions.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 border-dashed" onClick={addCondition}>
              <Plus className="h-3 w-3" /> Add Condition
            </Button>
          </div>

          {/* THEN action */}
          <div className="rounded-lg border bg-primary/5 p-4 space-y-3">
            <Label className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Then Trigger
            </Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select alert severity to trigger…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical Alert — Immediate escalation</SelectItem>
                <SelectItem value="high">High Alert — Priority review queue</SelectItem>
                <SelectItem value="medium">Medium Alert — Standard review queue</SelectItem>
                <SelectItem value="low">Low Alert — Informational only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Framework Toggle */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Regulatory Framework
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFramework('banks')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 transition-colors ${
                  framework === 'banks'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${
                    framework === 'banks' ? 'border-primary' : 'border-muted-foreground/40'
                  }`}>
                    {framework === 'banks' && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Banks</span>
                  <Badge variant="outline" className="ml-auto text-[9px]">Sept 2027</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground pl-5">
                  CBN AML/CFT framework for commercial & merchant banks
                </p>
              </button>
              <button
                onClick={() => setFramework('fintechs')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 transition-colors ${
                  framework === 'fintechs'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${
                    framework === 'fintechs' ? 'border-primary' : 'border-muted-foreground/40'
                  }`}>
                    {framework === 'fintechs' && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Fintechs / MMOs</span>
                  <Badge variant="outline" className="ml-auto text-[9px]">Mar 2028</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground pl-5">
                  CBN framework for fintechs, PSPs & mobile money operators
                </p>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!ruleName || !severity}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

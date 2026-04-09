import { useState } from 'react';
import { Plus, Zap, X, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

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

  // Logic builder state
  const [ifField, setIfField] = useState('');
  const [ifOperator, setIfOperator] = useState('');
  const [ifValue, setIfValue] = useState('');
  const [andField, setAndField] = useState('');
  const [andOperator, setAndOperator] = useState('');
  const [andValue, setAndValue] = useState('');
  const [andUnit, setAndUnit] = useState('');
  const [thenAction, setThenAction] = useState('');

  const handleCreate = () => {
    toast({
      title: 'Rule Created',
      description: `"${ruleName}" has been created and is ready for activation.`,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setRuleName('');
    setDescription('');
    setSeverity('');
    setIfField(''); setIfOperator(''); setIfValue('');
    setAndField(''); setAndOperator(''); setAndValue(''); setAndUnit('');
    setThenAction('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Create New Rule</SheetTitle>
              <SheetDescription className="text-xs">
                Define conditions to automatically detect suspicious activity.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-7">
            {/* Basic Info */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Name</Label>
                <Input
                  placeholder="e.g. Structuring below 5M NGN"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="h-10 bg-background shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="h-10 bg-background shadow-sm">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-critical))]" /> Critical</span></SelectItem>
                      <SelectItem value="high"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-high))]" /> High</span></SelectItem>
                      <SelectItem value="medium"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-medium))]" /> Medium</span></SelectItem>
                      <SelectItem value="low"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-low))]" /> Low</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Framework</Label>
                  <Select value={framework} onValueChange={(v: 'banks' | 'fintechs') => setFramework(v)}>
                    <SelectTrigger className="h-10 bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banks">Banks (Sept 2027)</SelectItem>
                      <SelectItem value="fintechs">Fintechs/MMOs (Mar 2028)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                <Input
                  placeholder="Briefly describe what this rule detects…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 bg-background shadow-sm"
                />
              </div>
            </motion.div>

            <Separator />

            {/* Visual Logic Builder */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Logic</Label>
                <Badge variant="outline" className="text-[10px] font-normal gap-1">
                  <Zap className="h-2.5 w-2.5" /> Visual Builder
                </Badge>
              </div>

              {/* Connector line container */}
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-[27px] top-[44px] bottom-[44px] w-px bg-border z-0" />

                <div className="space-y-0 relative z-10">
                  {/* ROW 1: IF */}
                  <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">IF</Badge>
                      <span className="text-[11px] text-muted-foreground">Primary condition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={ifField} onValueChange={setIfField}>
                        <SelectTrigger className="flex-1 h-9 text-xs bg-background shadow-sm border-border">
                          <SelectValue placeholder="Select metric…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Transaction Volume">Transaction Volume</SelectItem>
                          <SelectItem value="Velocity">Velocity</SelectItem>
                          <SelectItem value="Risk Score">Risk Score</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={ifOperator} onValueChange={setIfOperator}>
                        <SelectTrigger className="w-[130px] h-9 text-xs bg-background shadow-sm border-border">
                          <SelectValue placeholder="Operator…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Greater Than">Greater Than</SelectItem>
                          <SelectItem value="Less Than">Less Than</SelectItem>
                          <SelectItem value="Equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Value"
                        value={ifValue}
                        onChange={(e) => setIfValue(e.target.value)}
                        className="w-24 h-9 text-xs bg-background shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Connector: AND badge */}
                  <div className="flex items-center justify-center py-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-px w-6 bg-border" />
                      <Badge variant="outline" className="text-[10px] font-bold text-primary bg-background border-primary/20 shadow-sm px-3 py-0.5">
                        AND
                      </Badge>
                      <div className="h-px w-6 bg-border" />
                    </div>
                  </div>

                  {/* ROW 2: AND - Timeframe */}
                  <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 px-2.5 py-0.5 rounded-md shadow-sm">AND</Badge>
                      <span className="text-[11px] text-muted-foreground">Timeframe constraint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={andField} onValueChange={setAndField}>
                        <SelectTrigger className="flex-1 h-9 text-xs bg-background shadow-sm border-border">
                          <SelectValue placeholder="Timeframe…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Observation Window">Observation Window</SelectItem>
                          <SelectItem value="Rolling Period">Rolling Period</SelectItem>
                          <SelectItem value="Since Last Alert">Since Last Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={andOperator} onValueChange={setAndOperator}>
                        <SelectTrigger className="w-[110px] h-9 text-xs bg-background shadow-sm border-border">
                          <SelectValue placeholder="is within" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="is within">is within</SelectItem>
                          <SelectItem value="exceeds">exceeds</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Value"
                        value={andValue}
                        onChange={(e) => setAndValue(e.target.value)}
                        className="w-20 h-9 text-xs bg-background shadow-sm"
                      />
                      <Select value={andUnit} onValueChange={setAndUnit}>
                        <SelectTrigger className="w-[90px] h-9 text-xs bg-background shadow-sm border-border">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Days">Days</SelectItem>
                          <SelectItem value="Hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Connector: THEN arrow */}
                  <div className="flex items-center justify-center py-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-px w-6 bg-border" />
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 shadow-sm">
                        <ArrowRight className="h-2.5 w-2.5 text-primary" />
                        <span className="text-[10px] font-bold text-primary">THEN</span>
                      </div>
                      <div className="h-px w-6 bg-border" />
                    </div>
                  </div>

                  {/* ROW 3: THEN */}
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">THEN</Badge>
                      <span className="text-[11px] text-muted-foreground">Action to take</span>
                    </div>
                    <Select value={thenAction} onValueChange={setThenAction}>
                      <SelectTrigger className="w-full h-10 text-sm bg-background shadow-sm border-border font-medium">
                        <SelectValue placeholder="Select action…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Escalate to High">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-high))]" />
                            Escalate to High Priority
                          </span>
                        </SelectItem>
                        <SelectItem value="Flag for Review">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-medium))]" />
                            Flag for Manual Review
                          </span>
                        </SelectItem>
                        <SelectItem value="Auto-Block">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--risk-critical))]" />
                            Auto-Block Transaction
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>

            <Separator />

            {/* Live Preview */}
            {(ifField || thenAction) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Preview</Label>
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-foreground leading-relaxed font-mono">
                  <span className="text-primary font-bold">IF</span>{' '}
                  <span className="text-foreground">{ifField || '___'}</span>{' '}
                  <span className="text-muted-foreground">{ifOperator || '___'}</span>{' '}
                  <span className="font-semibold">{ifValue || '___'}</span>
                  <br />
                  <span className="text-primary font-bold">AND</span>{' '}
                  <span className="text-foreground">{andField || '___'}</span>{' '}
                  <span className="text-muted-foreground">{andOperator || '___'}</span>{' '}
                  <span className="font-semibold">{andValue || '___'}</span>{' '}
                  <span className="text-foreground">{andUnit || '___'}</span>
                  <br />
                  <span className="text-primary font-bold">THEN</span>{' '}
                  <span className="font-semibold">{thenAction || '___'}</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-card flex items-center justify-between shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!ruleName || !severity || !thenAction}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Create Rule
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type MilestoneStatus = 'not-started' | 'in-progress' | 'complete' | 'overdue';

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
  owner: string;
  progress: number;
  evidenceFile: string | null;
}

const initialMilestones: Milestone[] = [
  { id: '1', name: 'Risk-Based Approach (RBA) Framework', dueDate: '2026-09-30', status: 'in-progress', owner: 'Amina Bello', progress: 65, evidenceFile: null },
  { id: '2', name: 'Customer Due Diligence (CDD/EDD)', dueDate: '2026-09-30', status: 'in-progress', owner: 'Chukwu Emeka', progress: 50, evidenceFile: 'CDD_Policy_v3.pdf' },
  { id: '3', name: 'Transaction Monitoring & STR Filing', dueDate: '2026-12-31', status: 'in-progress', owner: 'Fatima Yusuf', progress: 40, evidenceFile: null },
  { id: '4', name: 'Sanctions & PEP Screening', dueDate: '2026-09-30', status: 'complete', owner: 'Olusegun Adeyemi', progress: 100, evidenceFile: 'Sanctions_Config_Report.pdf' },
  { id: '5', name: 'Record Keeping & Data Retention', dueDate: '2026-06-30', status: 'overdue', owner: 'Ngozi Okafor', progress: 30, evidenceFile: null },
  { id: '6', name: 'Staff Training & Awareness', dueDate: '2027-03-31', status: 'not-started', owner: 'Ibrahim Musa', progress: 0, evidenceFile: null },
  { id: '7', name: 'Internal Audit & Independent Testing', dueDate: '2027-06-30', status: 'not-started', owner: 'Aisha Balogun', progress: 0, evidenceFile: null },
  { id: '8', name: 'Correspondent Banking Due Diligence', dueDate: '2027-03-31', status: 'in-progress', owner: 'Tunde Bakare', progress: 25, evidenceFile: null },
  { id: '9', name: 'Beneficial Ownership Transparency', dueDate: '2027-06-30', status: 'not-started', owner: 'Chidinma Eze', progress: 0, evidenceFile: null },
  { id: '10', name: 'NFIU & goAML Integration', dueDate: '2026-12-31', status: 'in-progress', owner: 'Yemi Akinwale', progress: 55, evidenceFile: 'goAML_Integration_Spec.pdf' },
];

const statusConfig: Record<MilestoneStatus, { label: string; className: string }> = {
  'not-started': { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  'in-progress': { label: 'In Progress', className: 'bg-[hsl(var(--risk-medium)/0.15)] text-[hsl(var(--risk-medium))]' },
  'complete': { label: 'Complete', className: 'bg-[hsl(var(--risk-low)/0.15)] text-[hsl(var(--risk-low))]' },
  'overdue': { label: 'Overdue', className: 'bg-[hsl(var(--risk-critical)/0.15)] text-[hsl(var(--risk-critical))]' },
};

export function ComplianceTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const overallProgress = Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length);

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleFileUpload = (id: string, file: File) => {
    if (file.type !== 'application/pdf') return;
    updateMilestone(id, { evidenceFile: file.name });
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <Card className="print-timeline-card">
      {/* Print-only header */}
      <div className="hidden print:block p-6 pb-0">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold">APEXAML</h1>
            <p className="text-xs text-muted-foreground mt-0.5">AML/CFT Compliance Platform</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold">CBN Circular BSD/DIR/PUB/LAB/019/002</p>
            <p className="text-muted-foreground">AML/CFT/CPF Compliance Framework</p>
            <p className="text-muted-foreground mt-1">Generated: {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2 flex-row items-center justify-between print:pt-0">
        <CardTitle className="text-base">Implementation Milestone Tracker</CardTitle>
        <Button size="sm" onClick={handleExportPDF} className="gap-1.5 print:hidden">
          <Printer className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Overall Compliance Progress</span>
            <span className="font-semibold text-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
        </div>

        {/* Milestone table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">#</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Capability Area</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Due Date</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">Owner</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2 min-w-[120px]">Progress</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2 print:hidden">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, i) => (
                  <tr
                    key={m.id}
                    className={cn(
                      'border-b last:border-b-0 transition-colors',
                      m.status === 'overdue' && 'animate-pulse-subtle bg-[hsl(var(--risk-critical)/0.04)]'
                    )}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground font-medium">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground max-w-[200px]">{m.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(m.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5">
                      {/* Print: just badge */}
                      <span className="hidden print:inline">
                        <Badge variant="outline" className={cn('text-[10px] border-0', statusConfig[m.status].className)}>
                          {statusConfig[m.status].label}
                        </Badge>
                      </span>
                      {/* Screen: select */}
                      <div className="print:hidden">
                        <Select
                          value={m.status}
                          onValueChange={(v) => updateMilestone(m.id, {
                            status: v as MilestoneStatus,
                            ...(v === 'complete' ? { progress: 100 } : {}),
                          })}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{m.owner}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {/* Print: just text */}
                        <span className="hidden print:inline text-foreground font-medium">{m.progress}%</span>
                        {/* Screen: slider */}
                        <div className="print:hidden flex items-center gap-2 w-full">
                          <Slider
                            value={[m.progress]}
                            max={100}
                            step={5}
                            onValueChange={([v]) => updateMilestone(m.id, { progress: v, ...(v === 100 ? { status: 'complete' } : {}) })}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-medium text-foreground w-8 text-right">{m.progress}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 print:hidden">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        ref={el => { fileInputRefs.current[m.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(m.id, file);
                        }}
                      />
                      {m.evidenceFile ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <FileText className="h-3 w-3 text-[hsl(var(--risk-low))]" />
                          <span className="text-foreground truncate max-w-[100px]" title={m.evidenceFile}>{m.evidenceFile}</span>
                          <button onClick={() => updateMilestone(m.id, { evidenceFile: null })} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] gap-1"
                          onClick={() => fileInputRefs.current[m.id]?.click()}
                        >
                          <Upload className="h-3 w-3" />
                          Upload
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block text-[10px] text-muted-foreground border-t pt-3 mt-4">
          <p>This document is generated by ApexAML AML/CFT Compliance Platform for submission to the Central Bank of Nigeria.</p>
          <p>Reference: CBN Circular BSD/DIR/PUB/LAB/019/002 — AML/CFT/CPF Compliance Framework Implementation Roadmap</p>
        </div>
      </CardContent>
    </Card>
  );
}

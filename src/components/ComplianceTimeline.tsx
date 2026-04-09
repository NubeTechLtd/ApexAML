import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const milestones = [
  {
    date: 'June 10, 2026',
    title: 'Roadmap Submitted',
    description: 'Implementation roadmap filed with CBN detailing phased compliance plan, risk assessment methodology, and technology deployment schedule.',
    status: 'completed' as const,
  },
  {
    date: 'September 2027',
    title: 'Bank Full Compliance',
    description: 'All licensed banks must achieve full compliance with automated transaction monitoring, STR filing via goAML, and enhanced KYC/CDD processes.',
    status: 'in-progress' as const,
  },
  {
    date: 'March 2028',
    title: 'MMO/PSPs Full Compliance',
    description: 'Mobile Money Operators and Payment Service Providers must achieve parity with bank-grade AML/CFT controls, including real-time screening and NFIU integration.',
    status: 'upcoming' as const,
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    dotClass: 'bg-[hsl(var(--risk-low))] text-[hsl(var(--risk-low-foreground))]',
    lineClass: 'bg-[hsl(var(--risk-low))]',
    label: 'Completed',
    labelClass: 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))]',
  },
  'in-progress': {
    icon: Clock,
    dotClass: 'bg-[hsl(var(--risk-medium))] text-[hsl(var(--risk-medium-foreground))]',
    lineClass: 'bg-[hsl(var(--risk-medium)/0.4)]',
    label: 'In Progress',
    labelClass: 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))]',
  },
  upcoming: {
    icon: Circle,
    dotClass: 'bg-muted text-muted-foreground',
    lineClass: 'bg-border',
    label: 'Upcoming',
    labelClass: 'bg-muted text-muted-foreground',
  },
};

export function ComplianceTimeline() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Implementation Roadmap</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span className="font-medium text-foreground">33% Complete</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-[hsl(var(--risk-low))] transition-all" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-0">
          {milestones.map((m, i) => {
            const config = statusConfig[m.status];
            const Icon = config.icon;
            const isLast = i === milestones.length - 1;

            return (
              <div key={m.date} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Vertical connector */}
                {!isLast && (
                  <div className={cn('absolute left-[15px] top-[34px] w-0.5 bottom-0', config.lineClass)} />
                )}

                {/* Dot */}
                <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.dotClass)}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{m.date}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', config.labelClass)}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

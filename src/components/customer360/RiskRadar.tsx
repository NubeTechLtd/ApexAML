import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const axisExplanations: Record<string, string> = {
  'PEP Exposure': 'Proximity to politically exposed persons through ownership, family, or transactions.',
  'Cross-Border Vol.': 'Volume and frequency of international wire transfers relative to account tier.',
  'Cash Intensity': 'Proportion of cash deposits/withdrawals versus digital transactions.',
  'BVN/NIN Integrity': 'Verification quality — mismatches, re-verification failures, or data staleness.',
  'Peer Deviation': 'How far this customer\'s behaviour deviates from similar-tier customers.',
  'Channel Conc.': 'Over-reliance on a single channel (POS, USSD, mobile) for transactions.',
};

interface Props {
  radarScores: { axis: string; value: number }[];
  riskLevel: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const { axis, value } = payload[0].payload;
  const isHigh = value > 70;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md max-w-[220px]">
      <p className={`text-sm font-semibold ${isHigh ? 'text-destructive' : 'text-foreground'}`}>
        {axis}: {value}/100
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
        {axisExplanations[axis] ?? ''}
      </p>
    </div>
  );
}

export function Customer360RiskRadar({ radarScores, riskLevel }: Props) {
  const hasHighAxis = radarScores.some(s => s.value > 70);
  const strokeColor = hasHighAxis ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const fillColor = hasHighAxis ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" /> CBN Risk Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarScores} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="Risk"
              dataKey="value"
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {radarScores.map(s => (
            <div key={s.axis} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${s.value > 70 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
              <span className="text-muted-foreground">{s.axis}</span>
              <span className={`font-semibold ${s.value > 70 ? 'text-destructive' : 'text-foreground'}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

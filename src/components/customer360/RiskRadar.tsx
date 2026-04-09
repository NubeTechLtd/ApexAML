import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  radarScores: { axis: string; value: number }[];
  riskLevel: string;
}

export function Customer360RiskRadar({ radarScores, riskLevel }: Props) {
  const isHigh = riskLevel === 'High';
  const strokeColor = isHigh ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))';
  const fillColor = isHigh ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" /> Behavioral Risk Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarScores} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="Risk"
              dataKey="value"
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {radarScores.map(s => (
            <div key={s.axis} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
              <span className="text-muted-foreground">{s.axis}</span>
              <span className="font-semibold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

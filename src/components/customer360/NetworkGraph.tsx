import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Customer360Data } from '@/data/mockCustomer360';

interface NetworkNode {
  id: string;
  label: string;
  type: 'customer' | 'linked_account' | 'employer' | 'relative' | 'business' | 'bdc';
  riskScore: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  relationship: string;
}

const nodeTypeColors: Record<string, string> = {
  customer: 'hsl(213, 55%, 50%)',       // blue
  linked_account: 'hsl(172, 66%, 40%)', // teal
  employer: 'hsl(215, 14%, 55%)',       // gray
  relative: 'hsl(142, 61%, 45%)',       // green
  business: 'hsl(35, 85%, 50%)',        // amber
  bdc: 'hsl(var(--destructive))',       // red — Bureau de Change
};

const nodeTypeLabels: Record<string, string> = {
  customer: 'Customer',
  linked_account: 'Linked Account',
  employer: 'Employer',
  relative: 'Family Member',
  business: 'Associated Business',
  bdc: 'Bureau de Change (BDC)',
};

const relationshipLabels: Record<string, string> = {
  transfer: 'Transfer',
  shared_device: 'Shared Device',
  shared_address: 'Shared Address',
  family: 'Family',
  employment: 'Employment',
  beneficial_owner: 'Beneficial Owner',
  bdc_payout: 'BDC Payout',
};

function nodeRadius(score: number): number {
  return Math.max(18, Math.min(36, 14 + score * 0.24));
}

function buildGraph(customer: Customer360Data): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const cx = 300, cy = 200;
  const nodes: NetworkNode[] = [
    { id: 'center', label: customer.name, type: 'customer', riskScore: customer.riskScore, x: cx, y: cy, vx: 0, vy: 0 },
  ];
  const edges: NetworkEdge[] = [];

  const connected: { id: string; label: string; type: NetworkNode['type']; riskScore: number; relationship: string }[] = [];

  customer.connectedEntities.forEach(e => {
    let type: NetworkNode['type'] = 'linked_account';
    let relationship = 'transfer';
    let riskScore = 35 + Math.floor(Math.random() * 40);

    if (e.type === 'Shared Device ID') { type = 'linked_account'; relationship = 'shared_device'; riskScore = 55 + Math.floor(Math.random() * 30); }
    else if (e.type === 'Frequent Transfer Target') {
      const isBiz = e.label.includes('Ltd') || e.label.includes('Ventures') || e.label.includes('Trust') || e.label.includes('Holdings') || e.label.includes('Enterprises');
      type = isBiz ? 'business' : 'relative';
      relationship = isBiz ? 'beneficial_owner' : 'transfer';
    }
    else if (e.type === 'Shared Address') { type = 'linked_account'; relationship = 'shared_address'; }
    else if (e.type === 'Common IP Address') { type = 'linked_account'; relationship = 'shared_device'; riskScore = 60; }
    else if (e.type === 'Common Beneficiary') { type = 'business'; relationship = 'beneficial_owner'; }
    else if (e.type === 'Bureau de Change (BDC)') { type = 'bdc'; relationship = 'bdc_payout'; riskScore = 92; }

    connected.push({ id: e.id, label: e.label, type, riskScore, relationship });
  });

  // Ensure at least 5 varied nodes
  const synthetics: typeof connected = [
    { id: 'syn-employer', label: 'Zenith Consulting Ltd', type: 'employer', riskScore: 22, relationship: 'employment' },
    { id: 'syn-relative', label: 'Funke ' + customer.name.split(' ').pop(), type: 'relative', riskScore: 18, relationship: 'family' },
    { id: 'syn-biz', label: customer.name.split(' ')[0] + ' Holdings', type: 'business', riskScore: 45, relationship: 'beneficial_owner' },
    { id: 'syn-acct', label: 'Acc-' + customer.bvn.slice(-4), type: 'linked_account', riskScore: 38, relationship: 'transfer' },
    { id: 'syn-rel2', label: 'Amaka ' + customer.name.split(' ').pop(), type: 'relative', riskScore: 15, relationship: 'family' },
  ];
  while (connected.length < 5) {
    const s = synthetics.shift();
    if (!s) break;
    connected.push(s);
  }

  const finalConnected = connected.slice(0, 7);
  const angleStep = (2 * Math.PI) / finalConnected.length;

  finalConnected.forEach((c, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const radius = 130 + Math.random() * 30;
    nodes.push({ id: c.id, label: c.label, type: c.type, riskScore: c.riskScore, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, vx: 0, vy: 0 });
    edges.push({ source: 'center', target: c.id, relationship: c.relationship });
  });

  return { nodes, edges };
}

function simulate(nodes: NetworkNode[], edges: NetworkEdge[], iterations = 60): NetworkNode[] {
  const ns = nodes.map(n => ({ ...n }));
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        let dx = ns[j].x - ns[i].x;
        let dy = ns[j].y - ns[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 3000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (i !== 0) { ns[i].vx -= fx; ns[i].vy -= fy; }
        ns[j].vx += fx; ns[j].vy += fy;
      }
    }
    edges.forEach(e => {
      const s = ns.find(n => n.id === e.source)!;
      const t = ns.find(n => n.id === e.target)!;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 140) * 0.02;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    });
    ns.forEach((n, i) => {
      if (i === 0) return;
      n.vx *= 0.7; n.vy *= 0.7;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(60, Math.min(540, n.x));
      n.y = Math.max(50, Math.min(350, n.y));
    });
  }
  return ns;
}

interface Props {
  customer: Customer360Data;
}

export function NetworkGraph({ customer }: Props) {
  const { nodes: rawNodes, edges } = useMemo(() => buildGraph(customer), [customer]);
  const nodes = useMemo(() => simulate(rawNodes, edges), [rawNodes, edges]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          {Object.entries(nodeTypeLabels).filter(([k]) => k !== 'customer').map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: nodeTypeColors[key], opacity: 0.7 }} />
              {label}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg viewBox="0 0 600 400" className="w-full max-w-[600px] mx-auto" style={{ minHeight: 380 }}>
            {/* Edges with labels */}
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.source)!;
              const t = nodes.find(n => n.id === e.target)!;
              const color = nodeTypeColors[nodes.find(n => n.id === e.target)?.type || 'linked_account'];
              const mx = (s.x + t.x) / 2;
              const my = (s.y + t.y) / 2;
              const dimmed = hoveredNode && hoveredNode !== e.source && hoveredNode !== e.target;

              return (
                <g key={i}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={dimmed ? 0.1 : 0.5}
                    strokeDasharray={e.relationship === 'shared_device' ? '6,3' : undefined}
                  />
                  {!dimmed && (
                    <text x={mx} y={my - 5} textAnchor="middle" className="text-[7px] fill-muted-foreground select-none pointer-events-none">
                      {relationshipLabels[e.relationship] || e.relationship}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const r = nodeRadius(node.riskScore);
              const fill = nodeTypeColors[node.type];
              const isHovered = hoveredNode === node.id;
              const dimmed = hoveredNode && !isHovered && !edges.some(e => (e.source === hoveredNode && e.target === node.id) || (e.target === hoveredNode && e.source === node.id));

              return (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: dimmed ? 0.2 : 1 }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle cx={node.x} cy={node.y} r={r} fill={fill} fillOpacity={0.15} stroke={fill} strokeWidth={isHovered ? 2.5 : 1.5} />
                      <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[9px] font-semibold fill-foreground select-none pointer-events-none">
                        {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                      </text>
                      <circle cx={node.x + r * 0.7} cy={node.y - r * 0.7} r={8} fill={fill} fillOpacity={0.9} />
                      <text x={node.x + r * 0.7} y={node.y - r * 0.7 + 1} textAnchor="middle" dominantBaseline="central" className="text-[7px] font-bold fill-white select-none pointer-events-none">
                        {node.riskScore}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="space-y-1">
                    <p className="font-semibold text-sm">{node.label}</p>
                    <p className="text-xs text-muted-foreground">Type: {nodeTypeLabels[node.type]}</p>
                    <p className="text-xs text-muted-foreground">Risk Score: {node.riskScore}/100</p>
                    {node.id !== 'center' && (
                      <p className="text-xs text-primary cursor-pointer hover:underline">View Profile →</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

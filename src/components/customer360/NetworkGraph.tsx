import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Customer360Data } from '@/data/mockCustomer360';

/* ── Types ─────────────────────────────────────────── */

interface NetworkNode {
  id: string;
  label: string;
  type: 'customer' | 'linked_account' | 'employer' | 'relative' | 'business';
  riskScore: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  relationship: 'transfer' | 'shared_device' | 'shared_address' | 'family' | 'employment' | 'beneficial_owner';
}

const relationshipColors: Record<string, string> = {
  transfer: 'hsl(var(--primary))',
  shared_device: 'hsl(var(--destructive))',
  shared_address: 'hsl(var(--risk-medium, 45 93% 47%))',
  family: 'hsl(142, 71%, 45%)',
  employment: 'hsl(217, 91%, 60%)',
  beneficial_owner: 'hsl(280, 67%, 55%)',
};

const relationshipLabels: Record<string, string> = {
  transfer: 'Transfer',
  shared_device: 'Shared Device',
  shared_address: 'Shared Address',
  family: 'Family',
  employment: 'Employment',
  beneficial_owner: 'Beneficial Owner',
};

const nodeTypeLabels: Record<string, string> = {
  customer: 'Customer',
  linked_account: 'Linked Account',
  employer: 'Employer',
  relative: 'Relative',
  business: 'Business',
};

function riskColor(score: number): string {
  if (score >= 70) return 'hsl(var(--destructive))';
  if (score >= 40) return 'hsl(var(--risk-medium, 45 93% 47%))';
  return 'hsl(142, 71%, 45%)';
}

function nodeRadius(score: number): number {
  return Math.max(18, Math.min(36, 14 + score * 0.24));
}

/* ── Generate graph data from customer ─────────────── */

function buildGraph(customer: Customer360Data): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const cx = 300, cy = 200;
  const nodes: NetworkNode[] = [
    { id: 'center', label: customer.name, type: 'customer', riskScore: customer.riskScore, x: cx, y: cy, vx: 0, vy: 0 },
  ];
  const edges: NetworkEdge[] = [];

  const connected: { id: string; label: string; type: NetworkNode['type']; riskScore: number; relationship: NetworkEdge['relationship'] }[] = [];

  // Map connected entities to graph nodes
  customer.connectedEntities.forEach((e) => {
    let type: NetworkNode['type'] = 'linked_account';
    let relationship: NetworkEdge['relationship'] = 'transfer';
    let riskScore = 35 + Math.floor(Math.random() * 40);

    if (e.type === 'Shared Device ID') { type = 'linked_account'; relationship = 'shared_device'; riskScore = 55 + Math.floor(Math.random() * 30); }
    else if (e.type === 'Frequent Transfer Target') { type = e.label.includes(' ') && !e.label.includes('Ltd') && !e.label.includes('Ventures') && !e.label.includes('Trust') ? 'relative' : 'business'; relationship = e.label.includes('Trust') || e.label.includes('Ventures') ? 'beneficial_owner' : 'transfer'; }
    else if (e.type === 'Shared Address') { type = 'linked_account'; relationship = 'shared_address'; }
    else if (e.type === 'Common IP Address') { type = 'linked_account'; relationship = 'shared_device'; riskScore = 60; }
    else if (e.type === 'Common Beneficiary') { type = 'business'; relationship = 'beneficial_owner'; }

    connected.push({ id: e.id, label: e.label, type, riskScore, relationship });
  });

  // Always ensure at least 4 nodes — add synthetic ones if needed
  const synthetics: typeof connected = [
    { id: 'syn-employer', label: 'Zenith Consulting Ltd', type: 'employer', riskScore: 22, relationship: 'employment' },
    { id: 'syn-relative', label: 'Funke ' + customer.name.split(' ').pop(), type: 'relative', riskScore: 18, relationship: 'family' },
    { id: 'syn-biz', label: customer.name.split(' ')[0] + ' Holdings', type: 'business', riskScore: 45, relationship: 'beneficial_owner' },
    { id: 'syn-acct', label: 'Acc-' + customer.bvn.slice(-4), type: 'linked_account', riskScore: 38, relationship: 'transfer' },
  ];

  while (connected.length < 4) {
    const s = synthetics.shift();
    if (!s) break;
    connected.push(s);
  }

  // Limit to 6
  const finalConnected = connected.slice(0, 6);
  const angleStep = (2 * Math.PI) / finalConnected.length;

  finalConnected.forEach((c, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const radius = 130 + Math.random() * 30;
    nodes.push({
      id: c.id,
      label: c.label,
      type: c.type,
      riskScore: c.riskScore,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0, vy: 0,
    });
    edges.push({ source: 'center', target: c.id, relationship: c.relationship });
  });

  return { nodes, edges };
}

/* ── Simple force simulation (runs a few iterations) ── */

function simulate(nodes: NetworkNode[], edges: NetworkEdge[], iterations = 60): NetworkNode[] {
  const ns = nodes.map(n => ({ ...n }));
  const center = ns[0];

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
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

    // Attraction along edges
    edges.forEach(e => {
      const s = ns.find(n => n.id === e.source)!;
      const t = ns.find(n => n.id === e.target)!;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 140) * 0.02;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      t.vx -= fx; t.vy -= fy;
    });

    // Apply velocities with damping
    ns.forEach((n, i) => {
      if (i === 0) return; // pin center
      n.vx *= 0.7;
      n.vy *= 0.7;
      n.x += n.vx;
      n.y += n.vy;
      // Clamp
      n.x = Math.max(50, Math.min(550, n.x));
      n.y = Math.max(40, Math.min(360, n.y));
    });
  }

  return ns;
}

/* ── Component ─────────────────────────────────────── */

interface Props {
  customer: Customer360Data;
}

export function NetworkGraph({ customer }: Props) {
  const { nodes: rawNodes, edges } = useMemo(() => buildGraph(customer), [customer]);
  const nodes = useMemo(() => simulate(rawNodes, edges), [rawNodes, edges]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const svgWidth = 600;
  const svgHeight = 400;

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          {Object.entries(relationshipLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: relationshipColors[key] }} />
              {label}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full max-w-[600px] mx-auto"
            style={{ minHeight: 380 }}
          >
            {/* Edges */}
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.source)!;
              const t = nodes.find(n => n.id === e.target)!;
              const color = relationshipColors[e.relationship] || 'hsl(var(--border))';
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeOpacity={hoveredNode && hoveredNode !== e.source && hoveredNode !== e.target ? 0.15 : 0.6}
                  strokeDasharray={e.relationship === 'shared_device' ? '6,3' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const r = nodeRadius(node.riskScore);
              const fill = node.id === 'center' ? 'hsl(var(--primary))' : riskColor(node.riskScore);
              const isHovered = hoveredNode === node.id;
              const dimmed = hoveredNode && !isHovered && !edges.some(e => (e.source === hoveredNode && e.target === node.id) || (e.target === hoveredNode && e.source === node.id));

              return (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: dimmed ? 0.25 : 1 }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle
                        cx={node.x} cy={node.y} r={r}
                        fill={fill}
                        fillOpacity={0.15}
                        stroke={fill}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                      />
                      <text
                        x={node.x} y={node.y + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[9px] font-semibold fill-foreground select-none pointer-events-none"
                      >
                        {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                      </text>
                      {/* Risk score badge */}
                      <circle cx={node.x + r * 0.7} cy={node.y - r * 0.7} r={8} fill={fill} fillOpacity={0.9} />
                      <text
                        x={node.x + r * 0.7} y={node.y - r * 0.7 + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[7px] font-bold fill-white select-none pointer-events-none"
                      >
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

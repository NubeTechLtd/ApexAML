import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer360Data } from '@/data/mockCustomer360';

type NodeKind = 'individual' | 'corporate' | 'account' | 'sanctioned' | 'pep';
type EdgeKind = 'bvn' | 'director' | 'ubo' | 'address' | 'transaction';

interface GNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  kind: NodeKind;
  riskScore?: number;
  detail?: string;
}

interface GLink extends d3.SimulationLinkDatum<GNode> {
  source: string | GNode;
  target: string | GNode;
  kind: EdgeKind;
  label: string;
  detail: string;
}

const nodeColor: Record<NodeKind, string> = {
  individual: 'hsl(var(--primary))',
  corporate: 'hsl(213, 70%, 55%)',
  account: 'hsl(142, 61%, 45%)',
  sanctioned: 'hsl(var(--destructive))',
  pep: 'hsl(35, 90%, 52%)',
};

const nodeKindLabel: Record<NodeKind, string> = {
  individual: 'Individual customer',
  corporate: 'Corporate entity',
  account: 'Bank account',
  sanctioned: 'Sanctioned entity',
  pep: 'Politically exposed person',
};

const edgeStyle: Record<EdgeKind, { width: number; dash?: string }> = {
  bvn: { width: 1.8 },
  director: { width: 1.6, dash: '7,4' },
  ubo: { width: 4 },
  address: { width: 1.5, dash: '2,4' },
  transaction: { width: 1 },
};

function buildData(customer: Customer360Data): { nodes: GNode[]; links: GLink[] } {
  const surname = customer.name.split(' ').pop() ?? 'Ogunlesi';
  const nodes: GNode[] = [
    { id: 'center', label: customer.name, kind: 'individual', riskScore: customer.riskScore, detail: `BVN ${customer.bvn}` },
    { id: 'corp', label: 'Greenlight Trading Ltd', kind: 'corporate', riskScore: 68, detail: 'RC-1234567 · General trading' },
    { id: 'acct-gt', label: 'Acc 0123456789 · GTBank', kind: 'account', riskScore: 41, detail: 'NUBAN · Same BVN holder' },
    { id: 'acct-ac', label: 'Acc 9876543210 · Access Bank', kind: 'account', riskScore: 55, detail: 'NUBAN · Counterparty account' },
    { id: 'person', label: `James Nwachukwu`, kind: 'pep', riskScore: 62, detail: `Shares registered address with ${surname}` },
    { id: 'bdc', label: 'Sahel Exchange BDC (Dormant)', kind: 'sanctioned', riskScore: 94, detail: 'Dormant Bureau de Change · sanctions match' },
  ];

  const links: GLink[] = [
    { source: 'center', target: 'corp', kind: 'director', label: 'Director', detail: `${customer.name} is a listed director of Greenlight Trading Ltd (CAC filing)` },
    { source: 'center', target: 'acct-gt', kind: 'bvn', label: 'Same BVN', detail: `Account 0123456789 is registered to BVN ${customer.bvn}` },
    { source: 'center', target: 'acct-ac', kind: 'transaction', label: '₦2,300,000 transferred', detail: '₦2.3M cumulative transfers over the last 90 days' },
    { source: 'center', target: 'person', kind: 'address', label: 'Address match', detail: 'Both parties list the same Lekki Phase 1 residential address' },
    { source: 'center', target: 'bdc', kind: 'ubo', label: 'UBO 100%', detail: 'Sole beneficial owner (100%) of a dormant BDC entity — high risk' },
  ];

  return { nodes, links };
}

function riskTier(nodes: GNode[]): { level: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string } {
  const sanctioned = nodes.filter((n) => n.kind === 'sanctioned').length;
  const highRisk = nodes.filter((n) => n.id !== 'center' && (n.riskScore ?? 0) >= 60).length;
  if (sanctioned > 0 || highRisk >= 3) {
    return { level: 'HIGH', reason: `${sanctioned} sanctioned entity, ${highRisk} high-risk connections, ₦2.3M network volume` };
  }
  if (highRisk >= 1) return { level: 'MEDIUM', reason: `${highRisk} elevated-risk connections, ₦2.3M network volume` };
  return { level: 'LOW', reason: 'No sanctioned or high-risk connections detected' };
}

const riskClasses: Record<string, string> = {
  HIGH: 'bg-[hsl(var(--risk-critical)/0.12)] text-[hsl(var(--risk-critical))] border-[hsl(var(--risk-critical)/0.3)]',
  MEDIUM: 'bg-[hsl(var(--risk-medium)/0.12)] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium)/0.3)]',
  LOW: 'bg-[hsl(var(--risk-low)/0.12)] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low)/0.3)]',
};

interface Props {
  customer: Customer360Data;
}

export function EntityNetworkGraph({ customer }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { nodes, links } = useMemo(() => buildData(customer), [customer]);
  const risk = useMemo(() => riskTier(nodes), [nodes]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = svgEl.clientWidth || 800;
    const height = 500;
    const simNodes: GNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: GLink[] = links.map((l) => ({ ...l }));

    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    const linkG = svg.append('g');
    const labelG = svg.append('g');
    const nodeG = svg.append('g');

    const showTip = (event: MouseEvent, title: string, lines: string[]) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      setTooltip({
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
        title,
        lines,
      });
    };

    const linkSel = linkG
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', 'hsl(var(--muted-foreground))')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', (d) => edgeStyle[d.kind].width)
      .attr('stroke-dasharray', (d) => edgeStyle[d.kind].dash ?? null)
      .style('cursor', 'pointer')
      .on('mousemove', (event: MouseEvent, d) => showTip(event, d.label, [d.detail]))
      .on('mouseleave', () => setTooltip(null));

    const linkLabelSel = labelG
      .selectAll('text')
      .data(simLinks)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('class', 'select-none pointer-events-none')
      .text((d) => d.label);

    const groups = nodeG
      .selectAll<SVGGElement, GNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_e, d) => setSelected((prev) => (prev === d.id ? null : d.id)))
      .on('mousemove', (event: MouseEvent, d) =>
        showTip(event, d.label, [
          nodeKindLabel[d.kind],
          d.riskScore != null ? `Risk score: ${d.riskScore}/100` : '',
          d.detail ?? '',
        ].filter(Boolean)),
      )
      .on('mouseleave', () => setTooltip(null));

    groups.each(function (d) {
      const g = d3.select(this);
      const fill = nodeColor[d.kind];
      const strokeWidth = d.kind === 'sanctioned' || d.kind === 'pep' ? 2.5 : 1.5;
      if (d.kind === 'corporate') {
        g.append('rect').attr('x', -34).attr('y', -20).attr('width', 68).attr('height', 40).attr('rx', 4)
          .attr('fill', fill).attr('fill-opacity', 0.18).attr('stroke', fill).attr('stroke-width', strokeWidth);
      } else if (d.kind === 'account') {
        g.append('rect').attr('x', -24).attr('y', -24).attr('width', 48).attr('height', 48)
          .attr('transform', 'rotate(45)')
          .attr('fill', fill).attr('fill-opacity', 0.18).attr('stroke', fill).attr('stroke-width', strokeWidth);
      } else {
        g.append('circle').attr('r', d.id === 'center' ? 30 : 24)
          .attr('fill', fill).attr('fill-opacity', d.kind === 'sanctioned' ? 0.28 : 0.18)
          .attr('stroke', fill).attr('stroke-width', strokeWidth);
      }

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', d.kind === 'corporate' ? 36 : 42)
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .attr('fill', 'hsl(var(--foreground))')
        .attr('class', 'select-none pointer-events-none')
        .text(d.label.length > 26 ? d.label.slice(0, 25) + '…' : d.label);

      if (d.riskScore != null) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', 10)
          .attr('font-weight', 700)
          .attr('fill', fill)
          .attr('class', 'select-none pointer-events-none')
          .text(d.riskScore);
      }

      // Expand affordance
      const ex = d.kind === 'corporate' ? 34 : 26;
      const ey = d.kind === 'corporate' ? -20 : -26;
      const exp = g.append('g')
        .attr('transform', `translate(${ex},${ey})`)
        .style('cursor', 'pointer')
        .on('click', (event: MouseEvent) => {
          event.stopPropagation();
          toast('Full network expansion available in enterprise tier');
        });
      exp.append('circle').attr('r', 9).attr('fill', 'hsl(var(--card))').attr('stroke', 'hsl(var(--border))');
      exp.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('font-size', 12).attr('fill', 'hsl(var(--foreground))').attr('class', 'select-none pointer-events-none').text('+');
    });

    groups.call(
      d3.drag<SVGGElement, GNode>()
        .on('start', (event, d) => { d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; simulation.alpha(0.3).restart(); })
        .on('end', (_e, d) => { d.fx = null; d.fy = null; }),
    );

    const simulation = d3
      .forceSimulation(simNodes)
      .force('link', d3.forceLink<GNode, GLink>(simLinks).id((d) => d.id).distance(180).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-900))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(56))
      .on('tick', () => {
        linkSel
          .attr('x1', (d) => (d.source as GNode).x ?? 0)
          .attr('y1', (d) => (d.source as GNode).y ?? 0)
          .attr('x2', (d) => (d.target as GNode).x ?? 0)
          .attr('y2', (d) => (d.target as GNode).y ?? 0);
        linkLabelSel
          .attr('x', (d) => (((d.source as GNode).x ?? 0) + ((d.target as GNode).x ?? 0)) / 2)
          .attr('y', (d) => (((d.source as GNode).y ?? 0) + ((d.target as GNode).y ?? 0)) / 2 - 6);
        groups.attr('transform', (d) => `translate(${Math.max(60, Math.min(width - 60, d.x ?? 0))},${Math.max(50, Math.min(height - 50, d.y ?? 0))})`);
      });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Highlight / dim on selection
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const connected = new Set<string>();
    if (selected) {
      connected.add(selected);
      links.forEach((l) => {
        const s = typeof l.source === 'string' ? l.source : l.source.id;
        const t = typeof l.target === 'string' ? l.target : l.target.id;
        if (s === selected) connected.add(t);
        if (t === selected) connected.add(s);
      });
    }
    const svg = d3.select(svgEl);
    svg.selectAll<SVGGElement, GNode>('g > g')
      .filter((d) => !!d && typeof (d as GNode).id === 'string')
      .style('opacity', (d) => (!selected || connected.has((d as GNode).id) ? 1 : 0.3));
    svg.selectAll<SVGLineElement, GLink>('line').style('opacity', (d) => {
      if (!selected) return 1;
      const s = typeof d.source === 'string' ? d.source : (d.source as GNode).id;
      const t = typeof d.target === 'string' ? d.target : (d.target as GNode).id;
      return s === selected || t === selected ? 1 : 0.15;
    });
    svg.selectAll<SVGTextElement, GLink>('text').style('opacity', function (d) {
      if (!selected || !d || !(d as GLink).kind) return 1;
      const s = typeof (d as GLink).source === 'string' ? (d as GLink).source : ((d as GLink).source as GNode).id;
      const t = typeof (d as GLink).target === 'string' ? (d as GLink).target : ((d as GLink).target as GNode).id;
      return s === selected || t === selected ? 1 : 0.15;
    });
  }, [selected, links]);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" /> Entity Network
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Network risk:</span>
          <Badge variant="outline" className={`text-[10px] font-semibold ${riskClasses[risk.level]}`}>{risk.level}</Badge>
          {selected && (
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setSelected(null)}>
              Clear selection
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[11px] text-muted-foreground">{risk.reason}</p>

        <div ref={wrapRef} className="relative rounded-lg border bg-muted/10">
          <svg ref={svgRef} style={{ width: '100%', height: 500 }} />
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border bg-popover px-3 py-2 shadow-md"
              style={{ left: tooltip.x + 12, top: tooltip.y + 12, maxWidth: 260 }}
            >
              <p className="text-xs font-semibold text-popover-foreground">{tooltip.title}</p>
              {tooltip.lines.map((l, i) => (
                <p key={i} className="text-[11px] text-muted-foreground">{l}</p>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border p-3">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Node types</p>
            {(Object.keys(nodeKindLabel) as NodeKind[]).map((k) => (
              <div key={k} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  {k === 'corporate' ? (
                    <rect x="2" y="4" width="14" height="10" rx="2" fill={nodeColor[k]} fillOpacity={0.25} stroke={nodeColor[k]} />
                  ) : k === 'account' ? (
                    <rect x="4.5" y="4.5" width="9" height="9" transform="rotate(45 9 9)" fill={nodeColor[k]} fillOpacity={0.25} stroke={nodeColor[k]} />
                  ) : (
                    <circle cx="9" cy="9" r="6" fill={nodeColor[k]} fillOpacity={k === 'sanctioned' ? 0.35 : 0.25} stroke={nodeColor[k]} strokeWidth={k === 'sanctioned' || k === 'pep' ? 2 : 1} />
                  )}
                </svg>
                {nodeKindLabel[k]}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Relationship types</p>
            {([
              ['bvn', 'Same BVN'],
              ['director', 'Director relationship'],
              ['ubo', 'Beneficial owner (UBO %)'],
              ['address', 'Shared address'],
              ['transaction', 'Transaction relationship'],
            ] as [EdgeKind, string][]).map(([k, label]) => (
              <div key={k} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <svg width="34" height="10" viewBox="0 0 34 10">
                  <line x1="1" y1="5" x2="33" y2="5" stroke="hsl(var(--muted-foreground))" strokeWidth={edgeStyle[k].width} strokeDasharray={edgeStyle[k].dash} />
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

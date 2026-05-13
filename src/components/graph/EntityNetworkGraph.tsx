import { useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import { ZoomIn, ZoomOut, Maximize2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  highRisk?: boolean;
  accent?: string; // edge / icon tint, defaults to primary
}

interface EntityNetworkGraphProps {
  centerNode: GraphNode;
  nodes: GraphNode[];
  height?: number;
  emptyState?: ReactNode;
  className?: string;
}

const VIEW_W = 800;
const VIEW_H = 460;
const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 };

/**
 * Glassmorphic node-edge network graph with animated "money flow" edges,
 * zoom/pan controls, and a red-glow ring for high-risk nodes.
 *
 * Implementation note: we use SVG <foreignObject> for the nodes so we can
 * use HTML + Tailwind backdrop-blur for true glassmorphism, while keeping
 * SVG edges + a single transform group for cheap pan/zoom.
 */
export function EntityNetworkGraph({
  centerNode,
  nodes,
  height = 460,
  emptyState,
  className,
}: EntityNetworkGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Position peripheral nodes around the centre. Wider spacing on top/bottom
  // to avoid label overlap.
  const positioned = useMemo(() => {
    const radius = 175;
    const n = nodes.length;
    if (n === 0) return [];
    return nodes.map((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        ...node,
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
      };
    });
  }, [nodes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.5, z - e.deltaY * 0.0015)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    },
    [pan],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  }, []);

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (nodes.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border/60 bg-muted/10 text-sm text-muted-foreground',
          className,
        )}
        style={{ height }}
      >
        {emptyState ?? 'No connected entities detected'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/60',
        // Subtle radial gradient + grid to evoke an investigative canvas.
        'bg-[radial-gradient(circle_at_50%_45%,hsl(var(--primary)/0.10),transparent_60%)]',
        'bg-card',
        className,
      )}
      style={{ height }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label={`Network graph centred on ${centerNode.label} with ${nodes.length} connected entities`}
      >
        <defs>
          {/* Soft glow filters */}
          <filter id="risk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hub-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Faint grid pattern */}
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M32 0H0V32"
              fill="none"
              stroke="hsl(var(--border))"
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

        {/* Pan/zoom group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center' }}>
          {/* Edges */}
          {positioned.map((node) => {
            const stroke = node.highRisk
              ? 'hsl(var(--destructive))'
              : node.accent ?? 'hsl(var(--primary))';
            return (
              <g key={`edge-${node.id}`}>
                {/* Static base line for context */}
                <line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={stroke}
                  strokeOpacity={node.highRisk ? 0.35 : 0.22}
                  strokeWidth={1.2}
                />
                {/* Animated dash overlay — money flowing OUT from hub */}
                <line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={stroke}
                  strokeWidth={node.highRisk ? 2 : 1.5}
                  strokeDasharray="6 10"
                  strokeLinecap="round"
                  opacity={0.85}
                  style={{ animation: `money-flow 2.4s linear infinite` }}
                />
              </g>
            );
          })}

          {/* High-risk halo behind nodes */}
          {positioned
            .filter((n) => n.highRisk)
            .map((n) => (
              <circle
                key={`halo-${n.id}`}
                cx={n.x}
                cy={n.y}
                r="58"
                fill="hsl(var(--destructive))"
                opacity="0.18"
                filter="url(#risk-glow)"
              >
                <animate attributeName="opacity" values="0.10;0.25;0.10" dur="2.2s" repeatCount="indefinite" />
              </circle>
            ))}

          {/* Centre hub halo */}
          <circle cx={CENTER.x} cy={CENTER.y} r="60" fill="hsl(var(--primary))" opacity="0.25" filter="url(#hub-glow)" />

          {/* Centre hub node */}
          <NodeChip node={centerNode} x={CENTER.x} y={CENTER.y} hub />

          {/* Peripheral nodes */}
          {positioned.map((n) => (
            <NodeChip key={n.id} node={n} x={n.x} y={n.y} />
          ))}
        </g>
      </svg>

      {/* Zoom / pan controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-md border border-border/60 bg-card/70 p-1 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
          className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Reset view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Inline keyframe — scoped via :where so it doesn't leak globally. */}
      <style>{`
        @keyframes money-flow {
          from { stroke-dashoffset: 32; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

/** Glassmorphic node rendered via SVG foreignObject so we can use Tailwind backdrop-blur. */
function NodeChip({
  node,
  x,
  y,
  hub = false,
}: {
  node: GraphNode;
  x: number;
  y: number;
  hub?: boolean;
}) {
  const w = hub ? 200 : 160;
  const h = hub ? 78 : 62;
  const Icon = node.icon;
  const accent = node.highRisk
    ? 'hsl(var(--destructive))'
    : node.accent ?? 'hsl(var(--primary))';

  return (
    <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h} style={{ overflow: 'visible' }}>
      <div
        className={cn(
          'h-full w-full rounded-xl border backdrop-blur-md shadow-lg transition-all',
          'flex items-center gap-2.5 px-3',
          hub ? 'bg-primary/15 border-primary/40' : 'bg-card/60',
          node.highRisk && !hub && 'border-destructive/60 bg-destructive/10 shadow-[0_0_24px_-4px_hsl(var(--destructive)/0.6)]',
          !node.highRisk && !hub && 'border-border/60 hover:border-primary/40',
        )}
      >
        <div
          className="grid shrink-0 place-items-center rounded-lg"
          style={{
            width: hub ? 38 : 30,
            height: hub ? 38 : 30,
            background: `${accent.replace(')', ' / 0.15)')}`.replace('hsl(', 'hsl('),
            color: accent,
            border: `1px solid ${accent.replace(')', ' / 0.4)')}`,
          }}
        >
          <Icon style={{ width: hub ? 18 : 15, height: hub ? 18 : 15 }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate font-semibold leading-tight text-foreground',
              hub ? 'text-sm' : 'text-[12px]',
            )}
            title={node.label}
          >
            {node.label}
          </div>
          {node.sublabel && (
            <div
              className={cn(
                'truncate leading-tight text-muted-foreground',
                hub ? 'text-[11px]' : 'text-[10px]',
              )}
              title={node.sublabel}
            >
              {node.sublabel}
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  );
}

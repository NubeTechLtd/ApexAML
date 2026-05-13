import { forwardRef } from 'react';

export interface PrintableRoadmapProps {
  institutionName: string;
  institutionType: string;
  contactName: string;
  contactTitle: string;
  email: string;
  amlSetup: string;
  volume: string;
  referenceNumber: string;
  todayFormatted: string;
  fullDeadline: string;
}

// 10 CBN capability areas (must match RoadmapGenerator)
const CAPABILITY_AREAS = [
  'KYC/CDD',
  'Sanctions screening',
  'Transaction monitoring',
  'Case management',
  'STR reporting',
  'CTR reporting',
  'Audit trail',
  'AI/ML governance',
  'Fraud monitoring',
  'Entity profiling',
];

// Heuristic — which capabilities the institution likely already has
// based on their stated current AML setup.
function getCoveredCapabilities(amlSetup: string): Set<string> {
  switch (amlSetup) {
    case 'No formal system':
      return new Set();
    case 'Manual spreadsheets or checklists':
      return new Set(['KYC/CDD', 'Audit trail']);
    case 'Legacy software (non-CBN compliant)':
      return new Set(['KYC/CDD', 'Sanctions screening', 'Transaction monitoring', 'Audit trail']);
    case 'Partial automation':
      return new Set([
        'KYC/CDD',
        'Sanctions screening',
        'Transaction monitoring',
        'Case management',
        'STR reporting',
        'Audit trail',
      ]);
    case 'Advanced — needs CBN circular alignment':
      return new Set([
        'KYC/CDD',
        'Sanctions screening',
        'Transaction monitoring',
        'Case management',
        'STR reporting',
        'CTR reporting',
        'Audit trail',
        'Fraud monitoring',
      ]);
    default:
      return new Set();
  }
}

const NAVY = '#152845';
const GOLD = '#d4a843';
const SLATE = '#1f2937';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const CONFIDENTIAL_RED = '#b91c1c';
const AMBER = '#b45309';
const GREEN = '#15803d';

// Strategic 24-month Gantt phases
const PHASES = [
  { name: 'Phase 1 — Foundation', start: 1, end: 3, color: '#1e3a8a' },
  { name: 'Phase 2 — Core Implementation', start: 4, end: 9, color: '#0e7490' },
  { name: 'Phase 3 — Advanced Compliance', start: 10, end: 18, color: '#15803d' },
  { name: 'Phase 4 — Full Certification', start: 18, end: 24, color: '#b45309' },
];

const TOTAL_MONTHS = 24;

// 12-Week tactical remediation Gantt (CBN initial submission window)
const WEEK_PHASES = [
  { name: 'Gap Analysis & Risk Assessment', start: 1, end: 2, color: '#1e3a8a' },
  { name: 'Policy & Procedure Refresh', start: 3, end: 5, color: '#0e7490' },
  { name: 'Technology Deployment & Rule Tuning', start: 6, end: 9, color: '#15803d' },
  { name: 'Staff Training & UAT', start: 10, end: 11, color: '#b45309' },
  { name: 'Internal Audit & CBN Attestation', start: 12, end: 12, color: '#b91c1c' },
];

const TOTAL_WEEKS = 12;

// Returns colour for the deadline pill — amber if within 90 days, green otherwise
function deadlineTone(deadline: Date): { bg: string; fg: string; label: string } {
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days <= 90) return { bg: '#fef3c7', fg: AMBER, label: `${days} days remaining` };
  return { bg: '#dcfce7', fg: GREEN, label: `${days} days remaining` };
}

export const PrintableRoadmap = forwardRef<HTMLDivElement, PrintableRoadmapProps>(
  (props, ref) => {
    const {
      institutionName,
      institutionType,
      contactName,
      contactTitle,
      email,
      amlSetup,
      volume,
      referenceNumber,
      todayFormatted,
      fullDeadline,
    } = props;

    const covered = getCoveredCapabilities(amlSetup);
    const coveredCount = CAPABILITY_AREAS.filter((c) => covered.has(c)).length;
    const gapCount = CAPABILITY_AREAS.length - coveredCount;
    const deadline = deadlineTone(new Date('2026-06-10T00:00:00'));

    return (
      <div
        ref={ref}
        style={{
          // A4 width at ~96dpi: 794px. Use 800 for clean math.
          width: '800px',
          minHeight: '1131px',
          background: '#ffffff',
          color: SLATE,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: '12px',
          lineHeight: 1.5,
          padding: '48px 56px',
          boxSizing: 'border-box',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: `3px solid ${NAVY}`,
            paddingBottom: '20px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              {/* Inline ApexAML mark */}
              <svg width="44" height="36" viewBox="0 0 158 129" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M127.4 57.08L104.96 19H61.44L39 57.08l22.44 38.08h43.52z"
                  fill={NAVY}
                  stroke={GOLD}
                  strokeWidth="1.2"
                />
                <path
                  d="M83.2 28.52L51.92 87.68"
                  stroke={GOLD}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M83.2 28.52L114.48 87.68"
                  stroke={GOLD}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M64.84 59.12h5.44l4.08 6.8 8.84-18.36 8.84 18.36 4.08-6.8h5.44"
                  fill="none"
                  stroke={GOLD}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: NAVY,
                    letterSpacing: '-0.01em',
                  }}
                >
                  ApexAML
                </div>
                <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CBN AML Compliance Platform
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: MUTED }}>
            <div
              style={{
                display: 'inline-block',
                background: CONFIDENTIAL_RED,
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                padding: '4px 10px',
                borderRadius: '2px',
                marginBottom: '8px',
              }}
            >
              CONFIDENTIAL
            </div>
            <div style={{ fontWeight: 600, color: SLATE }}>Ref: {referenceNumber}</div>
            <div>Issued: {todayFormatted}</div>
            <div>CBN Circular BSD/DIR/PUB/LAB/019/002</div>
          </div>
        </div>

        {/* TITLE BLOCK */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              color: GOLD,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Confidential — Prepared for Filing
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: NAVY,
              margin: '0 0 4px 0',
              letterSpacing: '-0.02em',
            }}
          >
            CBN AML Implementation Roadmap
          </h1>
          <div style={{ fontSize: '14px', color: SLATE, fontWeight: 500 }}>
            Prepared for {institutionName}
          </div>
        </div>

        {/* EXECUTIVE SUMMARY — 2x2 metadata grid */}
        <div
          style={{
            fontSize: '10px',
            color: GOLD,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Executive Summary
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '14px',
            fontSize: '11px',
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            {[
              [
                { k: 'Institution Name', v: institutionName, highlight: false as const },
                { k: 'Licence Type', v: institutionType, highlight: false as const },
              ],
              [
                { k: 'Monthly Volume', v: volume, highlight: false as const },
                {
                  k: 'CBN Target Deadline',
                  v: '10 June 2026',
                  highlight: true as const,
                  pill: deadline,
                },
              ],
            ].map((row, ri) => (
              <tr key={ri}>
                {row.map((cell) => (
                  <td
                    key={cell.k}
                    style={{
                      width: '50%',
                      border: `1px solid ${BORDER}`,
                      padding: '12px 14px',
                      verticalAlign: 'top',
                      background: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        color: MUTED,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {cell.k}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: NAVY,
                        lineHeight: 1.3,
                      }}
                    >
                      {cell.v}
                    </div>
                    {cell.highlight && cell.pill && (
                      <div
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          background: cell.pill.bg,
                          color: cell.pill.fg,
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {cell.pill.label}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Supporting metadata strip */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '28px',
            fontSize: '10px',
          }}
        >
          <tbody>
            {[
              ['Compliance Officer', `${contactName}, ${contactTitle}`],
              ['Contact', email],
              ['Current AML Setup', amlSetup],
              ['Full Compliance Deadline', fullDeadline],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td
                  style={{
                    padding: '6px 12px 6px 0',
                    color: MUTED,
                    fontWeight: 500,
                    width: '40%',
                  }}
                >
                  {k}
                </td>
                <td style={{ padding: '6px 0', color: SLATE, fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* GAP ASSESSMENT CHECKLIST */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: `2px solid ${NAVY}`,
              paddingBottom: '6px',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: NAVY,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Gap Assessment Checklist
            </h2>
            <div style={{ fontSize: '10px', color: MUTED }}>
              <span style={{ color: '#15803d', fontWeight: 600 }}>{coveredCount} in place</span>
              {' · '}
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>{gapCount} to remediate</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {CAPABILITY_AREAS.map((cap, i) => {
                const isCovered = covered.has(cap);
                return (
                  <tr
                    key={cap}
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      background: i % 2 === 0 ? '#fafbfc' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '8px 10px', width: '28px', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: `1.5px solid ${isCovered ? '#15803d' : '#cbd5e1'}`,
                          background: isCovered ? '#15803d' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {isCovered ? '✓' : ''}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: SLATE,
                        fontWeight: 500,
                      }}
                    >
                      {cap}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: isCovered ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {isCovered ? 'In place' : 'Gap — remediate'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 12-WEEK TACTICAL GANTT — for initial CBN submission */}
        <div style={{ marginBottom: '28px', pageBreakInside: 'avoid' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: NAVY,
              margin: '0 0 4px 0',
              borderBottom: `2px solid ${NAVY}`,
              paddingBottom: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            12-Week Remediation Timeline
          </h2>
          <div style={{ fontSize: '10px', color: MUTED, marginBottom: '14px' }}>
            Tactical sprint to deliver the initial CBN roadmap submission by 10 June 2026.
          </div>

          {/* Week axis */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '4px' }}>
            <tbody>
              <tr>
                <td style={{ width: '36%' }}></td>
                <td style={{ width: '64%', padding: 0 }}>
                  <div style={{ display: 'flex', color: MUTED, fontWeight: 500 }}>
                    {[1, 3, 5, 7, 9, 11].map((w) => (
                      <div
                        key={w}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          borderLeft: `1px solid ${BORDER}`,
                          paddingLeft: '4px',
                        }}
                      >
                        W{w}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Week Gantt rows */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {WEEK_PHASES.map((p) => {
                const leftPct = ((p.start - 1) / TOTAL_WEEKS) * 100;
                const widthPct = ((p.end - p.start + 1) / TOTAL_WEEKS) * 100;
                return (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td
                      style={{
                        width: '36%',
                        padding: '8px 12px 8px 0',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: SLATE,
                        verticalAlign: 'middle',
                      }}
                    >
                      {p.name}
                    </td>
                    <td style={{ width: '64%', padding: '8px 0', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          position: 'relative',
                          height: '20px',
                          background: '#f1f5f9',
                          borderRadius: '3px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            background: p.color,
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '8px',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {p.start === p.end ? `W${p.start}` : `W${p.start}–W${p.end}`}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* REMEDIATION TIMELINE — pure HTML/CSS Gantt */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: NAVY,
              margin: '0 0 4px 0',
              borderBottom: `2px solid ${NAVY}`,
              paddingBottom: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            Remediation Timeline (24 months)
          </h2>
          <div style={{ fontSize: '10px', color: MUTED, marginBottom: '14px' }}>
            From initial CBN submission (10 June 2026) to full compliance attestation ({fullDeadline}).
          </div>

          {/* Month axis */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '4px' }}>
            <tbody>
              <tr>
                <td style={{ width: '32%' }}></td>
                <td style={{ width: '68%', padding: 0 }}>
                  <div style={{ display: 'flex', color: MUTED, fontWeight: 500 }}>
                    {[1, 4, 7, 10, 13, 16, 19, 22].map((m) => (
                      <div
                        key={m}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          borderLeft: `1px solid ${BORDER}`,
                          paddingLeft: '4px',
                        }}
                      >
                        M{m}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Gantt rows */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {PHASES.map((p) => {
                const leftPct = ((p.start - 1) / TOTAL_MONTHS) * 100;
                const widthPct = ((p.end - p.start + 1) / TOTAL_MONTHS) * 100;
                return (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td
                      style={{
                        width: '32%',
                        padding: '10px 12px 10px 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: SLATE,
                        verticalAlign: 'middle',
                      }}
                    >
                      {p.name}
                    </td>
                    <td style={{ width: '68%', padding: '10px 0', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          position: 'relative',
                          height: '22px',
                          background: '#f1f5f9',
                          borderRadius: '3px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            background: p.color,
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '8px',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                          }}
                        >
                          M{p.start}–M{p.end}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PHASE DETAILS */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: NAVY,
              margin: '0 0 14px 0',
              borderBottom: `2px solid ${NAVY}`,
              paddingBottom: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            Phase Deliverables
          </h2>
          {[
            {
              name: 'Phase 1 — Foundation (M1–M3)',
              color: '#1e3a8a',
              items: [
                'Board-approved AML/CFT policy refresh and CCO appointment letter',
                'Enterprise-wide ML/TF risk assessment',
                'Tiered KYC matrix with BVN/NIN linkage',
                'Sanctions screening live (UN/OFAC/EU/NFIU-domestic)',
                'Initial gap-analysis report submitted to CBN',
              ],
            },
            {
              name: 'Phase 2 — Core Implementation (M4–M9)',
              color: '#0e7490',
              items: [
                'Transaction monitoring engine with Nigerian typology rule library',
                'Case management with 4-eyes review and immutable audit trail',
                'STR drafting + NFIU goAML XML export pipeline',
                'CTR aggregation and daily reporting automation',
                'First independent internal-audit cycle',
              ],
            },
            {
              name: 'Phase 3 — Advanced Compliance (M10–M18)',
              color: '#15803d',
              items: [
                'AI/ML governance charter; model-risk register and explainability evidence',
                'Customer 360 entity-network profiling with PEP and adverse-media surveillance',
                'Fraud-monitoring integration with AML case routing',
                'EDD workspace operational for high-risk segments',
                'Tabletop examiner walkthrough (mock CBN/NFIU inspection)',
              ],
            },
            {
              name: 'Phase 4 — Full Certification (M18–M24)',
              color: '#b45309',
              items: [
                'External audit attestation against CBN Circular BSD/DIR/PUB/LAB/019/002',
                'Full coverage demonstrated across all 10 CBN capability areas',
                '5-year record-retention archive validated',
                `Board sign-off and certification submitted to CBN before ${fullDeadline}`,
              ],
            },
          ].map((phase) => (
            <div key={phase.name} style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '14px',
                    background: phase.color,
                    borderRadius: '2px',
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 700, color: SLATE }}>{phase.name}</div>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', color: SLATE, fontSize: '11px' }}>
                {phase.items.map((it) => (
                  <li key={it} style={{ marginBottom: '3px' }}>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ATTESTATION */}
        <div
          style={{
            marginTop: '32px',
            padding: '18px',
            border: `1px solid ${BORDER}`,
            borderLeft: `4px solid ${GOLD}`,
            background: '#fafbfc',
            fontSize: '10px',
            color: SLATE,
          }}
        >
          <div style={{ fontWeight: 700, color: NAVY, marginBottom: '6px', fontSize: '11px' }}>
            Attestation
          </div>
          <div style={{ marginBottom: '14px' }}>
            This roadmap has been prepared for {institutionName} and is to be filed with the CBN
            Compliance Department in accordance with Circular BSD/DIR/PUB/LAB/019/002.
          </div>
          {[
            ['Compliance Officer', `${contactName} (${contactTitle})`],
            ['Chief Risk Officer', ''],
            ['Managing Director', ''],
          ].map(([role, name]) => (
            <div
              key={role}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '24px',
                paddingTop: '10px',
                marginTop: '8px',
                borderTop: `1px dashed ${BORDER}`,
              }}
            >
              <div style={{ width: '38%' }}>
                <div style={{ color: MUTED, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {role}
                </div>
                <div style={{ fontWeight: 600 }}>{name || '\u00A0'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: MUTED, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Signature
                </div>
                <div style={{ borderBottom: `1px solid ${SLATE}`, height: '18px' }} />
              </div>
              <div style={{ width: '20%' }}>
                <div style={{ color: MUTED, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Date
                </div>
                <div style={{ borderBottom: `1px solid ${SLATE}`, height: '18px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '12px',
            borderTop: `2px solid ${NAVY}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9px',
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                background: GOLD,
                borderRadius: '50%',
              }}
            />
            <span style={{ fontWeight: 600, color: SLATE }}>
              Prepared in accordance with CBN Circular BSD/DIR/PUB/LAB/019/002
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>Ref {referenceNumber}</span>
            <span style={{ color: BORDER }}>|</span>
            <span>{todayFormatted}</span>
            <span style={{ color: BORDER }}>|</span>
            <span style={{ fontWeight: 600, color: SLATE }}>Page 1 of 1</span>
          </div>
        </div>
      </div>
    );
  },
);

PrintableRoadmap.displayName = 'PrintableRoadmap';

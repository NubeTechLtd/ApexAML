// Opens a print-ready CBN roadmap document in a new window and triggers
// the browser's native "Save as PDF" dialog. Uses pure HTML/CSS so the
// output is selectable text (not a rasterised image) and stays under a
// few hundred KB.

interface OpenRoadmapAsPdfArgs {
  institutionName: string;
  institutionType: string;
  contactName: string;
  contactTitle: string;
  email: string;
  referenceNumber: string;
  roadmapText: string;
  fullDeadline: string;
  generatedDate: string;
}

const CAPABILITY_AREAS = [
  'Customer Due Diligence (CDD) — tiered KYC with BVN/NIN',
  'Enhanced Due Diligence (EDD) for high-risk customers',
  'PEP & sanctions screening (UN/OFAC/EU/NFIU domestic)',
  'Beneficial ownership identification',
  'Transaction monitoring (Nigerian typology rules)',
  'Suspicious Transaction Reporting (NFIU goAML XML)',
  'Currency Transaction Reporting (CTR)',
  'Independent audit & immutable trail',
  'AML/CFT training programme & board oversight',
  'Record retention (5-year minimum)',
];

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LOGO_SVG = `
<svg width="44" height="44" viewBox="0 0 158 129" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
  <path d="M127.4 57.08 L104.96 19 L61.44 19 L39 57.08 L61.44 95.16 L104.96 95.16 Z"
        fill="#152845" stroke="#D4A843" stroke-width="2"/>
  <path d="M83.2 28.52 L51.92 87.68" stroke="#D4A843" stroke-width="6" stroke-linecap="round"/>
  <path d="M83.2 28.52 L114.48 87.68" stroke="#D4A843" stroke-width="6" stroke-linecap="round"/>
  <path d="M64.84 59.12 L70.28 59.12 L74.36 65.92 L83.2 47.56 L92.04 65.92 L96.12 59.12 L101.56 59.12"
        fill="none" stroke="#D4A843" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function openRoadmapAsPdf(args: OpenRoadmapAsPdfArgs): void {
  const {
    institutionName,
    institutionType,
    contactName,
    contactTitle,
    email,
    referenceNumber,
    roadmapText,
    fullDeadline,
    generatedDate,
  } = args;

  const fullDeadlineTone =
    institutionType === 'Deposit Money Bank (DMB)' ? 'amber' : 'green';
  const fullDeadlineColors =
    fullDeadlineTone === 'amber'
      ? { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' }
      : { bg: '#d1fae5', border: '#10b981', text: '#064e3b' };

  const capabilityCells = CAPABILITY_AREAS.map(
    (area, i) => `
      <div class="cap-cell">
        <span class="cap-box"></span>
        <span class="cap-num">${i + 1}.</span>
        <span class="cap-label">${esc(area)}</span>
      </div>`,
  ).join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ApexAML CBN Roadmap — ${esc(institutionName)} (${esc(referenceNumber)})</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f3f4f6; color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-bar {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    background: #0b1730; color: #fff; padding: 12px 20px;
    border-bottom: 2px solid #D4A843;
    font-size: 14px; font-weight: 600;
  }
  .print-bar button {
    background: #D4A843; color: #0b1730; border: 0;
    padding: 9px 18px; font-weight: 700; border-radius: 6px;
    cursor: pointer; font-size: 13px;
  }
  .print-bar button:hover { background: #c2992f; }

  .page { max-width: 820px; margin: 24px auto; background: #fff;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

  .header {
    background: #0b1730; color: #fff; padding: 22px 28px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 3px solid #D4A843;
  }
  .header .brand { display: flex; align-items: center; gap: 14px; }
  .header .brand-name { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
  .header .brand-sub { font-size: 11px; color: #cbd5e1; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .header .ref { text-align: right; font-size: 11px; line-height: 1.6; color: #cbd5e1; }
  .header .ref strong { color: #fff; font-size: 13px; display: block; }

  .body { padding: 26px 28px; }

  h2.section-title {
    font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px;
    color: #475569; margin: 24px 0 10px; padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }

  .buyer-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
    padding: 14px 18px;
  }
  .buyer-grid .row { font-size: 12px; line-height: 1.6; }
  .buyer-grid .row .k { color: #64748b; font-weight: 500; }
  .buyer-grid .row .v { color: #0f172a; font-weight: 600; }

  .deadlines { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
  .chip { padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
    border-left: 4px solid; line-height: 1.4; }
  .chip .label { display: block; font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.8px; font-weight: 700; margin-bottom: 2px; opacity: 0.85; }
  .chip-red { background: #fee2e2; color: #7f1d1d; border-color: #dc2626; }
  .chip-deadline { background: ${fullDeadlineColors.bg}; color: ${fullDeadlineColors.text}; border-color: ${fullDeadlineColors.border}; }

  .reg-box {
    background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb;
    padding: 14px 18px; border-radius: 6px; font-size: 12.5px; line-height: 1.6;
    color: #1e3a8a;
  }
  .reg-box strong { color: #1e40af; }

  .cap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
  .cap-cell { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 1.5; padding: 4px 0; }
  .cap-box { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #475569;
    border-radius: 2px; flex-shrink: 0; margin-top: 2px; background: #fff; }
  .cap-num { color: #475569; font-weight: 700; flex-shrink: 0; }
  .cap-label { color: #0f172a; }

  .roadmap-pre {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
    padding: 18px 20px; font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
    font-size: 11px; line-height: 1.65; color: #0f172a;
    white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;
  }

  .attestation { margin-top: 20px; }
  .att-row {
    display: grid; grid-template-columns: 1.2fr 1.5fr 1fr; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid #e2e8f0; align-items: end;
  }
  .att-row:last-child { border-bottom: 0; }
  .att-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
    color: #475569; font-weight: 700; }
  .att-line {
    border-bottom: 1px solid #94a3b8; height: 28px;
    font-size: 11px; color: #94a3b8; padding-bottom: 2px;
  }
  .att-line-label { font-size: 9px; text-transform: uppercase; color: #64748b;
    letter-spacing: 0.6px; margin-top: 4px; }
  .cbn-licence {
    margin-top: 14px; padding: 12px 16px; background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;
  }
  .cbn-licence .k { color: #64748b; font-weight: 600; margin-right: 8px; }
  .cbn-licence .line { display: inline-block; min-width: 240px;
    border-bottom: 1px solid #94a3b8; padding-bottom: 2px; }

  .footer { text-align: center; color: #94a3b8; font-size: 10px;
    padding: 20px 28px; border-top: 1px solid #e2e8f0; }

  @media print {
    body { background: #fff; }
    .print-bar { display: none !important; }
    .page { margin: 0; box-shadow: none; max-width: 100%; }
    .cap-cell, .att-row, .reg-box, .buyer-grid, .header { page-break-inside: avoid; }
    .roadmap-pre { page-break-inside: auto; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4; margin: 14mm; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <span>ApexAML CBN Roadmap — click to save as PDF</span>
    <button onclick="window.print()" type="button">Save as PDF</button>
  </div>

  <div class="page">
    <div class="header">
      <div class="brand">
        ${LOGO_SVG}
        <div>
          <div class="brand-name">ApexAML</div>
          <div class="brand-sub">CBN AML Implementation Roadmap</div>
        </div>
      </div>
      <div class="ref">
        <strong>Ref: ${esc(referenceNumber)}</strong>
        CBN Circular BSD/DIR/PUB/LAB/019/002<br/>
        Generated: ${esc(generatedDate)}
      </div>
    </div>

    <div class="body">
      <h2 class="section-title">Buyer Details</h2>
      <div class="buyer-grid">
        <div class="row"><span class="k">Institution Name:</span><br/><span class="v">${esc(institutionName)}</span></div>
        <div class="row"><span class="k">Licence Type:</span><br/><span class="v">${esc(institutionType)}</span></div>
        <div class="row"><span class="k">Compliance Officer:</span><br/><span class="v">${esc(contactName)}</span></div>
        <div class="row"><span class="k">Title:</span><br/><span class="v">${esc(contactTitle)}</span></div>
        <div class="row"><span class="k">Email:</span><br/><span class="v">${esc(email)}</span></div>
        <div class="row"><span class="k">NFIU Reporting ID:</span><br/><span class="v" style="color:#94a3b8;font-weight:500;">______________________</span></div>
      </div>

      <div class="deadlines">
        <div class="chip chip-red">
          <span class="label">CBN Roadmap Submission</span>
          10 June 2026
        </div>
        <div class="chip chip-deadline">
          <span class="label">Full Compliance Deadline</span>
          ${esc(fullDeadline)}
        </div>
      </div>

      <h2 class="section-title">Regulatory Context</h2>
      <div class="reg-box">
        This roadmap is prepared in accordance with <strong>CBN Circular BSD/DIR/PUB/LAB/019/002</strong>,
        which requires every regulated institution in Nigeria to file an AML/CFT implementation
        roadmap with the Central Bank of Nigeria by <strong>10 June 2026</strong>, with full
        compliance demonstrated by the licence-specific deadline above. Reporting alignment
        follows the NFIU goAML XML standard.
      </div>

      <h2 class="section-title">10 CBN-Mandated Capability Areas</h2>
      <div class="cap-grid">
        ${capabilityCells}
      </div>

      <h2 class="section-title">Implementation Roadmap</h2>
      <div class="roadmap-pre">${esc(roadmapText)}</div>

      <h2 class="section-title">Three-Party Attestation</h2>
      <div class="attestation">
        ${['Compliance Officer', 'Chief Risk Officer', 'Managing Director']
          .map(
            (role) => `
          <div class="att-row">
            <div>
              <div class="att-label">${role}</div>
              <div class="att-line-label" style="margin-top:8px;">Name / Title</div>
              <div class="att-line"></div>
            </div>
            <div>
              <div class="att-line-label">Signature</div>
              <div class="att-line"></div>
            </div>
            <div>
              <div class="att-line-label">Date</div>
              <div class="att-line"></div>
            </div>
          </div>`,
          )
          .join('')}

        <div class="cbn-licence">
          <span class="k">CBN Licence Number:</span>
          <span class="line"></span>
        </div>
      </div>

      <div class="footer">
        Generated by ApexAML · apexaml.com · Ref ${esc(referenceNumber)} · ${esc(generatedDate)}<br/>
        This document is prepared for submission to the CBN Compliance Department.
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger the native print dialog so the user can save as PDF.
    setTimeout(function () { try { window.print(); } catch (e) {} }, 700);
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
  if (!win) {
    // Pop-up blocked — surface to the caller via thrown error so it can toast.
    throw new Error('POPUP_BLOCKED');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      /* noop */
    }
  }, 700);
}

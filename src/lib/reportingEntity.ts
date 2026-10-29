/**
 * Reporting-institution details written into STR/CTR XML exports.
 * Live exports read them from the institution profile; demo exports use
 * fixed, clearly fictional values marked DEMO.
 */
export interface ReportingEntity {
  legalName: string;
  cbnLicenceNumber: string;
  goamlEntityId: string;
  address: string;
  mlroName: string;
  contactEmail: string;
  contactPhone: string;
  /** Profile version used for the export; null for demo values. */
  version: number | null;
}

export const PROFILE_FIELDS: { key: keyof Omit<ReportingEntity, 'version'>; label: string; required: boolean }[] = [
  { key: 'legalName', label: 'Legal name', required: true },
  { key: 'cbnLicenceNumber', label: 'CBN licence or registration number', required: true },
  { key: 'goamlEntityId', label: 'goAML reporting entity ID', required: true },
  { key: 'address', label: 'Registered address', required: true },
  { key: 'mlroName', label: 'MLRO name', required: true },
  { key: 'contactEmail', label: 'Contact email', required: true },
  { key: 'contactPhone', label: 'Contact phone', required: false },
];

/** Labels of required fields that are empty. Empty list means the export may proceed. */
export function missingProfileFields(entity: ReportingEntity | null): string[] {
  return PROFILE_FIELDS.filter((f) => f.required && !(entity?.[f.key] ?? '').trim()).map((f) => f.label);
}

export const LIVE_EXPORT_LABEL = 'Draft XML for review. Validate against the current NFIU schema before filing';
export const DEMO_EXPORT_LABEL = 'DEMO: sample data only. Not for filing';

export const DEMO_REPORTING_ENTITY: ReportingEntity = {
  legalName: 'DEMO Fictional Microfinance Bank (sample only)',
  cbnLicenceNumber: 'DEMO-LICENCE-0000',
  goamlEntityId: 'DEMO-GOAML-0000',
  address: 'DEMO address, not a real location',
  mlroName: 'DEMO MLRO (fictional)',
  contactEmail: 'demo-mlro@example.invalid',
  contactPhone: 'DEMO-0000',
  version: null,
};

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Status comment + element placed at the top of every export. */
export function draftStatusXml(label: string): string {
  const safe = escapeXml(label).replace(/--/g, '- -');
  return `<!-- ${safe} -->\n`;
}

export function reportingEntityXml(e: ReportingEntity, label: string): string {
  return `  <DraftStatus>${escapeXml(label)}</DraftStatus>
  <ReportingEntity>
    <EntityName>${escapeXml(e.legalName)}</EntityName>
    <LicenceNumber>${escapeXml(e.cbnLicenceNumber)}</LicenceNumber>
    <ReportingEntityID>${escapeXml(e.goamlEntityId)}</ReportingEntityID>
    <Address>${escapeXml(e.address)}</Address>
    <MLRO>
      <Name>${escapeXml(e.mlroName)}</Name>
      <Email>${escapeXml(e.contactEmail)}</Email>
      <Phone>${escapeXml(e.contactPhone)}</Phone>
    </MLRO>${e.version != null ? `\n    <ProfileVersion>${e.version}</ProfileVersion>` : ''}
  </ReportingEntity>`;
}

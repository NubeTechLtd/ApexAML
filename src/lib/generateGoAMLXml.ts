import type { Alert } from '@/data/mockAlerts';
import type { AlertData } from '@/data/mockLegacyAlerts';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate goAML 3.x compliant XML for an Alert (AlertWorkspace alerts).
 */
export function generateGoAMLXml(alert: Alert, strDraft: string): string {
  const today = formatDate(new Date());
  const p = alert.customerProfile;

  const txLines = alert.transactions.map(tx =>
    `      <Transaction>
        <TransactionDate>${escapeXml(tx.date.split('T')[0])}</TransactionDate>
        <Amount>${tx.amountNGN}</Amount>
        <Currency>NGN</Currency>
        <Channel>${escapeXml(tx.channel)}</Channel>
        <CounterpartyName>${escapeXml(tx.counterparty)}</CounterpartyName>
      </Transaction>`
  ).join('\n');

  // NFIU goAML mandatory cross-border block — only emitted when the alert
  // originated from an overseas IMTO compliance referral.
  const crossBorderBlock = alert.crossBorder
    ? `  <CrossBorderFlag>true</CrossBorderFlag>
  <OriginatingCountry>${escapeXml(alert.crossBorder.originatingCountry)}</OriginatingCountry>
  <OverseasInstitutionReference>${escapeXml(alert.crossBorder.overseasReferenceId)}</OverseasInstitutionReference>
  <OverseasFlagTimestamp>${escapeXml(alert.crossBorder.overseasFlaggedAt)}</OverseasFlagTimestamp>
  <OverseasFlagReason>${escapeXml(alert.crossBorder.overseasFlagReason)}</OverseasFlagReason>
  <OverseasFlaggedBy>${escapeXml(alert.crossBorder.overseasFlaggedBy)}</OverseasFlaggedBy>
`
    : '  <CrossBorderFlag>false</CrossBorderFlag>\n';

  return `<?xml version="1.0" encoding="UTF-8"?>
<STRReport xmlns="urn:nfiu:goaml:3.0" version="3.0">
  <ReportHeader>
    <ReportCode>${escapeXml(alert.caseId)}</ReportCode>
    <ReportingDate>${today}</ReportingDate>
    <Currency>NGN</Currency>
  </ReportHeader>
${crossBorderBlock}  <ReportingEntity>
    <EntityType>BANK</EntityType>
    <EntityName>Sentinel Financial Institution</EntityName>
    <RCNumber>RC-123456</RCNumber>
  </ReportingEntity>
  <SubjectInformation>
    <FullName>${escapeXml(p.fullName)}</FullName>
    <BVN>${escapeXml(p.bvn)}</BVN>
    <NUBAN>${escapeXml(p.nuban)}</NUBAN>
    <Nationality>Nigerian</Nationality>
    <DateOfBirth>1990-01-01</DateOfBirth>
  </SubjectInformation>
  <TransactionDetails>
${txLines}
  </TransactionDetails>
  <NarrativeText>${escapeXml(strDraft)}</NarrativeText>
</STRReport>`;
}

/**
 * Generate goAML 3.x compliant XML for a legacy AlertData (STR Co-Pilot).
 */
export function generateGoAMLXmlFromLegacy(alert: AlertData, strDraft: string): string {
  const today = formatDate(new Date());

  const txLines = alert.transactionTimeline.map(tx =>
    `      <Transaction>
        <TransactionDate>${escapeXml(tx.date.split('T')[0])}</TransactionDate>
        <Amount>${tx.amount}</Amount>
        <Currency>${escapeXml(tx.currency)}</Currency>
        <Channel>${escapeXml(tx.channel)}</Channel>
        <CounterpartyName>${escapeXml(tx.counterparty)}</CounterpartyName>
      </Transaction>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<STRReport xmlns="urn:nfiu:goaml:3.0" version="3.0">
  <ReportHeader>
    <ReportCode>${escapeXml(alert.id)}</ReportCode>
    <ReportingDate>${today}</ReportingDate>
    <Currency>NGN</Currency>
  </ReportHeader>
  <ReportingEntity>
    <EntityType>BANK</EntityType>
    <EntityName>Sentinel Financial Institution</EntityName>
    <RCNumber>RC-123456</RCNumber>
  </ReportingEntity>
  <SubjectInformation>
    <FullName>${escapeXml(alert.customerName)}</FullName>
    <BVN>${escapeXml(alert.bvn)}</BVN>
    <NUBAN>${escapeXml(alert.accountNumber)}</NUBAN>
    <Nationality>Nigerian</Nationality>
    <DateOfBirth>1990-01-01</DateOfBirth>
  </SubjectInformation>
  <TransactionDetails>
${txLines}
  </TransactionDetails>
  <NarrativeText>${escapeXml(strDraft)}</NarrativeText>
</STRReport>`;
}

/**
 * Trigger a browser download of an XML string.
 */
export function downloadXmlFile(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

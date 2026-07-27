import type { Database } from '@/integrations/supabase/types';

type CTRRow = Database['public']['Tables']['ctr_queue']['Row'];

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a CTR-YYYY-NNNNN reference number.
 * Padded to 5 digits based on the highest existing sequence for the given year.
 */
export function nextCtrReference(existingRefs: string[], year = new Date().getFullYear()): string {
  const prefix = `CTR-${year}-`;
  let max = 0;
  for (const ref of existingRefs) {
    if (ref?.startsWith(prefix)) {
      const n = parseInt(ref.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
}

interface TxnLine {
  transaction_id: string;
  amount: number;
  channel: string;
  transaction_datetime: string;
  counterparty_account?: string | null;
  narration?: string | null;
  direction?: string | null;
}

/**
 * Generate a CBN/NFIU goAML 3.x compliant Currency Transaction Report XML.
 */
export function generateCtrXml(row: CTRRow, transactions: TxnLine[], reference: string): string {
  const today = new Date().toISOString().split('T')[0];
  const txLines = transactions.map(tx => `      <Transaction>
        <TransactionID>${escapeXml(tx.transaction_id)}</TransactionID>
        <TransactionDate>${escapeXml(tx.transaction_datetime.split('T')[0])}</TransactionDate>
        <Amount>${tx.amount}</Amount>
        <Currency>NGN</Currency>
        <Channel>${escapeXml(tx.channel)}</Channel>
        <Direction>${escapeXml(tx.direction ?? '')}</Direction>
        <Counterparty>${escapeXml(tx.counterparty_account ?? '')}</Counterparty>
        <Narration>${escapeXml(tx.narration ?? '')}</Narration>
      </Transaction>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CTRReport xmlns="urn:nfiu:goaml:3.0" version="3.0">
  <ReportHeader>
    <ReportType>CTR</ReportType>
    <ReportCode>${escapeXml(reference)}</ReportCode>
    <ReportingDate>${today}</ReportingDate>
    <ReportPeriod>${escapeXml(row.report_date)}</ReportPeriod>
    <Currency>NGN</Currency>
    <ThresholdNGN>5000000</ThresholdNGN>
    <CBNCircularReference>BSD/DIR/PUB/LAB/019/002</CBNCircularReference>
  </ReportHeader>
  <ReportingEntity>
    <EntityType>BANK</EntityType>
    <EntityName>ApexAML Financial Institution</EntityName>
    <RCNumber>RC-123456</RCNumber>
  </ReportingEntity>
  <SubjectInformation>
    <FullName>${escapeXml(row.customer_name ?? row.customer_id)}</FullName>
    <NUBAN>${escapeXml(row.customer_id)}</NUBAN>
    <Nationality>Nigerian</Nationality>
  </SubjectInformation>
  <AggregateSummary>
    <TotalCashNGN>${row.total_cash_ngn}</TotalCashNGN>
    <TransactionCount>${row.transaction_count}</TransactionCount>
  </AggregateSummary>
  <TransactionDetails>
${txLines}
  </TransactionDetails>
</CTRReport>`;
}

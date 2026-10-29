import { describe, expect, it } from 'vitest';
import { generateCtrXml } from './generateCTRXml';
import { DEMO_REPORTING_ENTITY, LIVE_EXPORT_LABEL, missingProfileFields, type ReportingEntity } from './reportingEntity';

const complete: ReportingEntity = {
  legalName: 'Real Bank Ltd', cbnLicenceNumber: 'LIC-1', goamlEntityId: 'G-1', address: '1 Road, Lagos',
  mlroName: 'Ada Obi', contactEmail: 'mlro@realbank.example', contactPhone: '', version: 3,
};

describe('institution profile export rules', () => {
  it('lists every empty required field', () => {
    expect(missingProfileFields({ ...complete, goamlEntityId: ' ', mlroName: '' })).toEqual(['goAML reporting entity ID', 'MLRO name']);
  });
  it('blocks when no profile exists', () => {
    expect(missingProfileFields(null)).toHaveLength(6);
  });
  it('phone is optional', () => {
    expect(missingProfileFields(complete)).toEqual([]);
  });
  it('live XML carries profile values, version and draft label, never placeholders', () => {
    const row = { report_date: '2026-10-01', customer_name: 'X', customer_id: '1', total_cash_ngn: 6000000, transaction_count: 1 } as never;
    const xml = generateCtrXml(row, [], 'CTR-2026-00001', complete, LIVE_EXPORT_LABEL);
    expect(xml).toContain('<EntityName>Real Bank Ltd</EntityName>');
    expect(xml).toContain('<ProfileVersion>3</ProfileVersion>');
    expect(xml).toContain('Draft XML for review. Validate against the current NFIU schema before filing');
    expect(xml).not.toMatch(/ApexAML Financial Institution|RC-123456/);
  });
  it('demo values are marked DEMO', () => {
    for (const v of Object.values(DEMO_REPORTING_ENTITY)) if (typeof v === 'string' && !v.includes('@')) expect(v).toMatch(/DEMO/);
  });
});

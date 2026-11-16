import { describe, expect, it } from 'vitest';
import { ALERT_CSV_MAX_ROWS, parseAlertsCsv, splitCsv } from './alertsCsv';

const HEADER = 'case_id,customer_name,bvn,rule_triggered,risk_level,description,amount_ngn';

describe('parseAlertsCsv', () => {
  it('accepts a valid file with the seven required columns', () => {
    const csv = `${HEADER}\nCASE-001,Adaeze Okafor,22123456789,Structuring below CTR threshold,high,"Nine deposits, same day","₦4,950,000"\n`;
    const { rows, errors } = parseAlertsCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([{
      case_id: 'CASE-001', customer_name: 'Adaeze Okafor', bvn: '22123456789',
      rule_triggered: 'Structuring below CTR threshold', risk_level: 'High',
      description: 'Nine deposits, same day', amount_ngn: '4950000',
    }]);
  });

  it('rejects a file missing a required column', () => {
    const { rows, errors } = parseAlertsCsv('case_id,customer_name,rule_triggered,risk_level\nA,B,C,High');
    expect(rows).toEqual([]);
    expect(errors[0]).toContain('bvn');
    expect(errors[0]).toContain('amount_ngn');
  });

  it('rejects a BVN that is not 11 digits', () => {
    const { rows, errors } = parseAlertsCsv(`${HEADER}\nCASE-1,Bola,12345,Rule,Low,,`);
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/Line 2: .*bvn must be 11 digits/);
  });

  it('rejects an unknown risk level', () => {
    const { errors } = parseAlertsCsv(`${HEADER}\nCASE-1,Bola,,Rule,Severe,,`);
    expect(errors[0]).toContain('risk_level');
  });

  it('rejects a repeated case_id in the same file', () => {
    const { rows, errors } = parseAlertsCsv(`${HEADER}\nCASE-1,A,,R,Low,,\nCASE-1,B,,R,Low,,`);
    expect(rows).toEqual([]);
    expect(errors[0]).toContain('Line 3');
  });

  it('rejects more than 500 cases in one file', () => {
    const lines = Array.from({ length: ALERT_CSV_MAX_ROWS + 1 }, (_, i) => `C-${i},A,,R,Low,,`);
    const { rows, errors } = parseAlertsCsv(`${HEADER}\n${lines.join('\n')}`);
    expect(rows).toEqual([]);
    expect(errors[0]).toContain('500');
  });

  it('rejects a non-numeric amount', () => {
    const { errors } = parseAlertsCsv(`${HEADER}\nCASE-1,A,,R,Low,,abc`);
    expect(errors[0]).toContain('amount_ngn');
  });
});

describe('splitCsv', () => {
  it('handles quoted line breaks, doubled quotes and CRLF', () => {
    expect(splitCsv('a,b\r\n"x\ny","say ""hi"""\r\n')).toEqual([['a', 'b'], ['x\ny', 'say "hi"']]);
  });
});

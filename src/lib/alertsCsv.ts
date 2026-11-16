/**
 * Parses and checks the live workspace's alert CSV before it is sent to the
 * import_alerts_csv database action (which checks everything again).
 */
export const ALERT_CSV_COLUMNS = [
  'case_id', 'customer_name', 'bvn', 'rule_triggered', 'risk_level', 'description', 'amount_ngn',
] as const;

export type AlertCsvColumn = (typeof ALERT_CSV_COLUMNS)[number];
export type AlertCsvRow = Record<AlertCsvColumn, string>;

export const ALERT_CSV_MAX_ROWS = 500;
export const ALERT_CSV_MAX_BYTES = 1024 * 1024;

const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const;

export interface AlertCsvResult {
  rows: AlertCsvRow[];
  errors: string[];
}

/** RFC 4180 style splitting: quoted fields, doubled quotes, commas and line breaks inside quotes. */
export function splitCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      out.push(row); row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); out.push(row); }
  return out.filter((r) => r.some((c) => c.trim() !== ''));
}

function normaliseRisk(value: string): string | null {
  const v = value.trim().toLowerCase();
  return RISK_LEVELS.find((r) => r.toLowerCase() === v) ?? null;
}

/** Strips thousands separators, spaces and a leading ₦/NGN; returns null when not a plain amount. */
export function normaliseAmount(value: string): string | null {
  const v = value.trim().replace(/^(₦|NGN)\s*/i, '').replace(/[,\s]/g, '');
  if (v === '') return '';
  return /^\d{1,15}(\.\d{1,2})?$/.test(v) ? v : null;
}

export function parseAlertsCsv(text: string): AlertCsvResult {
  const errors: string[] = [];
  const table = splitCsv(text);
  if (table.length === 0) return { rows: [], errors: ['The file is empty.'] };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const missing = ALERT_CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`] };
  }
  const index = Object.fromEntries(ALERT_CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<AlertCsvColumn, number>;

  const body = table.slice(1);
  if (body.length === 0) return { rows: [], errors: ['The file has a header but no cases.'] };
  if (body.length > ALERT_CSV_MAX_ROWS) {
    return { rows: [], errors: [`The file has ${body.length} cases; the limit is ${ALERT_CSV_MAX_ROWS} per import.`] };
  }

  const rows: AlertCsvRow[] = [];
  const seen = new Map<string, number>();
  body.forEach((cells, i) => {
    const line = i + 2; // header is line 1
    const get = (c: AlertCsvColumn) => (cells[index[c]] ?? '').trim();
    const row = Object.fromEntries(ALERT_CSV_COLUMNS.map((c) => [c, get(c)])) as AlertCsvRow;
    const rowErrors: string[] = [];

    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/.test(row.case_id)) {
      rowErrors.push('case_id must be 1–64 letters, numbers, dots, dashes, underscores or slashes');
    } else if (seen.has(row.case_id)) {
      rowErrors.push(`case_id ${row.case_id} repeats line ${seen.get(row.case_id)}`);
    } else {
      seen.set(row.case_id, line);
    }
    if (!row.customer_name || row.customer_name.length > 200) rowErrors.push('customer_name is required (up to 200 characters)');
    if (row.bvn && !/^\d{11}$/.test(row.bvn)) rowErrors.push('bvn must be 11 digits');
    if (!row.rule_triggered || row.rule_triggered.length > 200) rowErrors.push('rule_triggered is required (up to 200 characters)');
    const risk = normaliseRisk(row.risk_level);
    if (!risk) rowErrors.push('risk_level must be Critical, High, Medium or Low');
    else row.risk_level = risk;
    if (row.description.length > 2000) rowErrors.push('description is longer than 2,000 characters');
    const amount = normaliseAmount(row.amount_ngn);
    if (amount === null) rowErrors.push('amount_ngn must be a positive number with up to 2 decimals');
    else row.amount_ngn = amount;

    if (rowErrors.length > 0) errors.push(`Line ${line}: ${rowErrors.join('; ')}.`);
    else rows.push(row);
  });

  return { rows: errors.length > 0 ? [] : rows, errors };
}

/**
 * Per-request pseudonymisation for live STR drafting.
 * Personal identifiers are swapped for tokens (CUST_1, BVN_1, …) before any
 * text reaches the AI gateway and swapped back in the model's reply. The map
 * lives only in this object for one request: never store, log or return it.
 */
export type TokenKind = 'CUST' | 'CPTY' | 'NAME' | 'BVN' | 'NIN' | 'NUBAN' | 'PHONE' | 'EMAIL';

const TOKEN_RE = /\b(?:CUST|CPTY|NAME|BVN|NIN|NUBAN|PHONE|EMAIL)_\d+(?:_N\d+)?\b/g;

// Name parts that are not identifying on their own.
const NAME_STOPWORDS = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'chief', 'alhaji', 'alhaja', 'engr', 'barr', 'prof', 'pastor', 'the', 'and', 'of',
  'ltd', 'limited', 'plc', 'nig', 'nigeria', 'enterprise', 'enterprises', 'ventures', 'global', 'services',
  'company', 'co', 'group', 'holdings', 'international', 'trading', 'stores', 'bank', 'mfb', 'microfinance',
  'pos', 'agent', 'terminal', 'unknown', 'cash', 'atm', 'transfer', 'wallet',
]);

const HONORIFIC_NAME_RE = /\b((?:Mr|Mrs|Ms|Miss|Dr|Chief|Alhaji|Alhaja|Engr|Barr|Prof|Pastor)\.?\s+)([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,3})/g;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?<![\d+])(?:\+?234[\s-]?|0)[789][01]\d(?:[\s-]?\d){7}(?!\d)/g;
const BVN_RE = /(?<!\d)22\d{9}(?!\d)/g;
const ELEVEN_DIGITS_RE = /(?<!\d)\d{11}(?!\d)/g;
const TEN_DIGITS_RE = /(?<!\d)\d{10}(?!\d)/g;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive, whitespace-tolerant match that does not touch longer words or numbers. */
function valuePattern(value: string): RegExp {
  const body = value.trim().split(/\s+/).map(escapeRe).join('\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'giu');
}

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export class Pseudonymiser {
  private tokenToValue = new Map<string, string>();
  private valueToToken = new Map<string, string>();
  private counters = new Map<TokenKind, number>();
  private known: { value: string; token: string }[] = [];

  private key(kind: TokenKind, value: string): string {
    const norm = ['BVN', 'NIN', 'NUBAN', 'PHONE'].includes(kind) ? digitsOnly(value) : value.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${kind === 'NAME' || kind === 'CUST' || kind === 'CPTY' ? 'PERSON' : kind}:${norm}`;
  }

  private tokenFor(kind: TokenKind, value: string): string {
    const k = this.key(kind, value);
    const existing = this.valueToToken.get(k);
    if (existing) return existing;
    const n = (this.counters.get(kind) ?? 0) + 1;
    this.counters.set(kind, n);
    const token = `${kind}_${n}`;
    this.valueToToken.set(k, token);
    this.tokenToValue.set(token, value.trim());
    return token;
  }

  /** Register a known structured value (customer name, BVN, …). Returns its token. */
  register(kind: TokenKind, value: string | null | undefined): string | null {
    const v = (value ?? '').trim();
    if (!v || v.length < 3) return null;
    const token = this.tokenFor(kind, v);
    this.known.push({ value: v, token });
    // Customers and counterparties are often referred to by one part of the name.
    if (kind === 'CUST' || kind === 'CPTY' || kind === 'NAME') {
      const parts = v.split(/\s+/).filter((p) => p.length >= 3 && !NAME_STOPWORDS.has(p.toLowerCase().replace(/\.$/, '')) && !/\d/.test(p));
      if (parts.length > 1) {
        parts.forEach((part, i) => {
          const partToken = `${token}_N${i + 1}`;
          if (!this.tokenToValue.has(partToken)) this.tokenToValue.set(partToken, part);
          this.known.push({ value: part, token: partToken });
        });
      }
    }
    return token;
  }

  /** Replace known values first (longest first), then sweep free text for identifier patterns. */
  protect(text: string): string {
    let out = text;
    const ordered = [...this.known].sort((a, b) => b.value.length - a.value.length);
    for (const { value, token } of ordered) {
      out = /^\d+$/.test(value)
        ? out.replace(new RegExp(`(?<!\\d)${value}(?!\\d)`, 'g'), token)
        : out.replace(valuePattern(value), token);
    }
    out = out.replace(EMAIL_RE, (m) => this.tokenFor('EMAIL', m));
    out = out.replace(PHONE_RE, (m) => this.tokenFor('PHONE', m));
    out = out.replace(BVN_RE, (m) => this.tokenFor('BVN', m));
    out = out.replace(ELEVEN_DIGITS_RE, (m) => this.tokenFor('NIN', m));
    out = out.replace(TEN_DIGITS_RE, (m) => this.tokenFor('NUBAN', m));
    out = out.replace(HONORIFIC_NAME_RE, (_m, title: string, name: string) => `${title}${this.tokenFor('NAME', name)}`);
    return out;
  }

  /** Swap tokens in the model's reply back to the original values. Unknown tokens are left as written. */
  restore(text: string): string {
    return text.replace(TOKEN_RE, (t) => this.tokenToValue.get(t) ?? t);
  }

  /** Number of distinct values replaced; safe to log (no values). */
  get size(): number {
    return this.tokenToValue.size;
  }
}

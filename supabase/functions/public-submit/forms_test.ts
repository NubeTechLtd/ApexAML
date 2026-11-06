import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1'
import { buildRow, Envelope, FORMS, getForm, isHoneypotTripped, MAX_BODY_BYTES, RATE_LIMIT, readLimitedBody, TABLE_COLUMNS, visitorColumns, type FormSpec } from './forms.ts'
import { isAcceptedVerification } from './turnstile.ts'

const specs = Object.entries(FORMS) as [string, FormSpec][]

Deno.test('rate limit is 10 requests per IP per hour', () => {
  assertEquals(RATE_LIMIT, { limit: 10, windowSeconds: 3600 })
})

Deno.test('payload cap is 10 KB', async () => {
  assertEquals(MAX_BODY_BYTES, 10240)
  const ok = await readLimitedBody(new Request('http://x', { method: 'POST', body: 'a'.repeat(10240) }))
  assert(ok.ok)
  const big = await readLimitedBody(new Request('http://x', { method: 'POST', body: 'a'.repeat(10241) }))
  assertEquals(big.ok ? 0 : big.status, 413)
})

Deno.test('visitor forms require Turnstile; click and page tracking do not', () => {
  for (const [id, spec] of specs) {
    const tracker = spec.table === 'landing_page_clicks' || spec.table === 'page_events'
    assertEquals(spec.turnstile, !tracker, id)
  }
})

Deno.test('the four lead tables and both trackers are covered', () => {
  const tables = new Set(specs.map(([, s]) => s.table))
  for (const t of ['leads', 'roadmap_leads', 'demo_requests', 'landing_page_clicks', 'page_events']) assert(tables.has(t as never), t)
  assertEquals(FORMS.contact.table, 'leads')
})

Deno.test('every visitor column is in its table allowlist; visitors never set id, fingerprint, user agent or a form source', () => {
  for (const [id, spec] of specs) {
    // Trackers carry a free tracking label in their own `source` column; forms never do.
    const serverOnly = spec.turnstile ? ['id', 'source', 'client_fingerprint', 'user_agent'] : ['id', 'user_agent']
    for (const col of visitorColumns(spec)) {
      assert(TABLE_COLUMNS[spec.table].includes(col), `${id}.${col}`)
      assert(!serverOnly.includes(col), `${id} lets visitor set ${col}`)
    }
  }
})

Deno.test('unknown columns are rejected', () => {
  assertEquals(FORMS.lead_navbar.schema.safeParse({ email: 'a@b.co', source: 'admin' }).success, false)
  assertEquals(FORMS.page_event.schema.safeParse({ event_name: 'x', user_agent: 'spoof' }).success, false)
})

Deno.test('emails are validated and lower-cased', () => {
  assertEquals(FORMS.lead_navbar.schema.safeParse({ email: 'not-an-email' }).success, false)
  const ok = FORMS.lead_navbar.schema.safeParse({ email: '  Jane@Bank.NG ' })
  assert(ok.success)
  assertEquals((ok.data as { email: string }).email, 'jane@bank.ng')
  assertEquals(FORMS.demo_request_post_roadmap.schema.safeParse({ contact_name: 'A', institution_name: 'B', email: 'bad' }).success, false)
})

Deno.test('source is fixed by the server', () => {
  const row = buildRow(FORMS.lead_navbar, { email: 'a@b.co' }, { id: '1' })
  assertEquals(row.source, 'navbar')
  assertThrows(() => buildRow(FORMS.lead_navbar, { email: 'a@b.co', is_admin: true }, { id: '1' }))
})

Deno.test('honeypot is the "website" field', () => {
  assert(isHoneypotTripped('https://spam.example'))
  assert(!isHoneypotTripped(''))
  assert(!isHoneypotTripped(undefined))
  assert(Envelope.safeParse({ form: 'lead_navbar', data: {}, website: 'x' }).success)
  assertEquals(Envelope.safeParse({ form: 'lead_navbar', data: {}, table: 'user_roles' }).success, false)
})

Deno.test('unknown forms are refused, including prototype keys', () => {
  assertEquals(getForm('user_roles'), null)
  assertEquals(getForm('__proto__'), null)
  assertEquals(getForm('toString'), null)
})

Deno.test('Turnstile result must succeed and match the form action', () => {
  assert(isAcceptedVerification({ success: true, action: 'contact' }, 'contact'))
  assert(isAcceptedVerification({ success: true }, 'contact'))
  assert(!isAcceptedVerification({ success: false, action: 'contact' }, 'contact'))
  assert(!isAcceptedVerification({ success: true, action: 'lead_navbar' }, 'contact'))
})

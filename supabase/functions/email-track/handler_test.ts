import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { signedClickUrl, signedOpenUrl, signTracking, verifyTracking } from '../_shared/email-tracking.ts'
import { handleTrack, type TrackDeps, type TrackEvent } from './handler.ts'

const SECRET = 'test-secret-'.padEnd(64, 'x')
const OTHER_SECRET = 'other-secret-'.padEnd(64, 'y')
const BASE = 'https://fn.example/functions/v1'
const TOKEN = 'AbC+def/GhIjKlMnOpQrStUv'
const DEST = 'https://apexaml.com/pricing'

function deps(overrides: Partial<TrackDeps> = {}) {
  const events: TrackEvent[] = []
  const d: TrackDeps = {
    secret: SECRET,
    findSequence: (t) => Promise.resolve(t === TOKEN ? { id: 'seq-1', email: 'a@example.com' } : null),
    insertEvent: (e) => { events.push(e); return Promise.resolve() },
    ...overrides,
  }
  return { d, events }
}

const get = (url: string) => new Request(url, { headers: { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '1.1.1.1' } })

Deno.test('valid signed open logs one open and returns a GIF', async () => {
  const { d, events } = deps()
  const res = await handleTrack(get(await signedOpenUrl(BASE, SECRET, TOKEN, 2)), d)
  assertEquals(res.status, 200)
  assertEquals(res.headers.get('content-type'), 'image/gif')
  assertEquals(events.length, 1)
  assertEquals(events[0].event_type, 'open')
  assertEquals(events[0].email_step, 2)
  assertEquals(events[0].ip, '203.0.113.9')
})

Deno.test('valid signed click logs one click and redirects to the signed destination', async () => {
  const { d, events } = deps()
  const res = await handleTrack(get(await signedClickUrl(BASE, SECRET, TOKEN, 3, DEST)), d)
  assertEquals(res.status, 302)
  assertEquals(res.headers.get('location'), DEST)
  assertEquals(events.map((e) => [e.event_type, e.url]), [['click', DEST]])
})

Deno.test('missing signature is rejected with 403 and nothing is written', async () => {
  const { d, events } = deps()
  const url = new URL(await signedOpenUrl(BASE, SECRET, TOKEN, 1))
  url.searchParams.delete('sig')
  const res = await handleTrack(get(url.toString()), d)
  assertEquals(res.status, 403)
  assertEquals(events.length, 0)
})

Deno.test('signature made with another key is rejected', async () => {
  const { d, events } = deps()
  const res = await handleTrack(get(await signedOpenUrl(BASE, OTHER_SECRET, TOKEN, 1)), d)
  assertEquals(res.status, 403)
  assertEquals(events.length, 0)
})

Deno.test('changing the token, step, destination or kind invalidates the signature', async () => {
  const { d, events } = deps()
  const click = new URL(await signedClickUrl(BASE, SECRET, TOKEN, 3, DEST))
  const tampered = [
    (u: URL) => u.searchParams.set('url', 'https://apexaml.com/contact'),
    (u: URL) => u.searchParams.set('s', '4'),
    (u: URL) => u.searchParams.set('t', 'ZZZ+def/GhIjKlMnOpQrStUv'),
    (u: URL) => { u.searchParams.delete('url'); u.searchParams.set('type', 'open') },
  ]
  for (const tamper of tampered) {
    const u = new URL(click)
    tamper(u)
    const res = await handleTrack(get(u.toString()), d)
    assertEquals(res.status, 403, u.search)
  }
  assertEquals(events.length, 0)
})

Deno.test('missing secret fails closed without writing', async () => {
  const url = await signedOpenUrl(BASE, SECRET, TOKEN, 1)
  const { d, events } = deps({ secret: undefined })
  assertEquals((await handleTrack(get(url), d)).status, 503)
  assertEquals(events.length, 0)
})

Deno.test('signed link to a non-allowlisted host is not followed', async () => {
  const { d, events } = deps()
  const res = await handleTrack(get(await signedClickUrl(BASE, SECRET, TOKEN, 1, 'https://evil.example/')), d)
  assertEquals(res.status, 400)
  assertEquals(events.length, 0)
})

Deno.test('signed link for an unknown sequence is rejected', async () => {
  const { d, events } = deps()
  const res = await handleTrack(get(await signedOpenUrl(BASE, SECRET, 'unknownToken123', 1)), d)
  assertEquals(res.status, 404)
  assertEquals(events.length, 0)
})

Deno.test('malformed requests are rejected before verification', async () => {
  const { d } = deps()
  for (const q of ['', '?t=' + TOKEN, `?t=${TOKEN}&s=9&type=open&sig=x`, `?t=${TOKEN}&s=1&sig=x`]) {
    assertEquals((await handleTrack(get(BASE + '/email-track' + q), d)).status, 400, q)
  }
  assertEquals((await handleTrack(new Request(BASE + '/email-track', { method: 'POST' }), d)).status, 405)
})

Deno.test('signing rejects short keys and verify rejects wrong signatures', async () => {
  await assertRejects(() => signTracking('short', { kind: 'open', token: TOKEN, step: 1 }))
  const sig = await signTracking(SECRET, { kind: 'open', token: TOKEN, step: 1 })
  assert(await verifyTracking(SECRET, { kind: 'open', token: TOKEN, step: 1 }, sig))
  assert(!(await verifyTracking(SECRET, { kind: 'open', token: TOKEN, step: 1 }, sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A'))))
  assert(!(await verifyTracking(SECRET, { kind: 'open', token: TOKEN, step: 1 }, '')))
})

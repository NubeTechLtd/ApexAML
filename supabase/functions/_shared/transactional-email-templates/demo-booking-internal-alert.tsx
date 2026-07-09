import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  institutionName?: string
  institutionType?: string
  fullName?: string
  role?: string
  email?: string
  whatsapp?: string
  focusAreas?: string
  slotLabel?: string
  requestId?: string
}

const Email = ({
  institutionName = 'Unknown institution',
  institutionType = '—',
  fullName = '—',
  role = '—',
  email = '—',
  whatsapp = '—',
  focusAreas = '—',
  slotLabel = '—',
  requestId = '—',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New demo booking: {institutionName} — {slotLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>NEW DEMO BOOKING</Text>
          <Heading style={h1}>
            {institutionName} — {institutionType}
          </Heading>
          <Text style={subhead}>{slotLabel}</Text>
        </Section>

        <Section style={content}>
          <Text style={row}><span style={rowKey}>Contact</span> <strong>{fullName}</strong> · {role}</Text>
          <Text style={row}><span style={rowKey}>Email</span> <Link href={`mailto:${email}`} style={rowLink}>{email}</Link></Text>
          <Text style={row}><span style={rowKey}>WhatsApp</span> {whatsapp || '—'}</Text>
          <Text style={row}><span style={rowKey}>Institution</span> {institutionName} ({institutionType})</Text>
          <Text style={row}><span style={rowKey}>Wants to see</span> {focusAreas || '—'}</Text>
          <Text style={row}><span style={rowKey}>Request ID</span> <span style={mono}>{requestId}</span></Text>

          <Section style={callout}>
            <Text style={calloutText}>
              <strong>Prep checklist:</strong> Review the institution type, pre-load
              relevant typologies ({institutionType}), and prep the focus-area demo: {focusAreas || 'general walkthrough'}.
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) =>
    `📅 New demo: ${data.institutionName ?? 'Unknown'} — ${data.slotLabel ?? ''}`,
  displayName: 'Demo Booking Internal Alert',
  to: 'adetokunboogun@gmail.com',
  previewData: {
    institutionName: 'Sterling Microfinance',
    institutionType: 'Microfinance Bank',
    fullName: 'Ada Okafor',
    role: 'Head of Compliance',
    email: 'ada@example.com',
    whatsapp: '+2348012345678',
    focusAreas: 'STR co-pilot and NFIU goAML export',
    slotLabel: 'Tuesday, 14 July 2026 at 2:00 PM WAT',
    requestId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '640px', margin: '0 auto', padding: '24px' }
const header = { backgroundColor: '#0a0f1c', color: '#ffffff', padding: '22px 26px', borderRadius: '12px 12px 0 0' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }
const subhead = { fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '22px 26px', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', color: '#1a1a2e' }
const row = { fontSize: '14px', lineHeight: 1.7, margin: '0 0 6px 0', color: '#1a1a2e' }
const rowKey = { color: '#6b6b80', display: 'inline-block', width: '130px' }
const rowLink = { color: '#0a0f1c' }
const mono = { fontFamily: 'monospace', fontSize: '12px' }
const callout = { marginTop: '18px', padding: '14px', backgroundColor: '#fff8e6', borderLeft: '3px solid #D4A843', borderRadius: '6px' }
const calloutText = { fontSize: '13px', color: '#1a1a2e', margin: 0, lineHeight: 1.6 }

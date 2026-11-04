import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props {
  name?: string; email?: string; institution?: string; institutionType?: string
  role?: string; phone?: string; message?: string; leadId?: string; userId?: string
}

const Email = ({ name = '—', email = '—', institution = 'Unknown institution', institutionType = '—',
  role = '—', phone = '', message = '', leadId = '—', userId = '—' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Pilot access request: {institution}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>PILOT ACCESS REQUEST</Text>
          <Heading style={h1}>{institution} — {institutionType}</Heading>
        </Section>
        <Section style={content}>
          <Text style={row}><span style={rowKey}>Contact</span> <strong>{name}</strong> · {role}</Text>
          <Text style={row}><span style={rowKey}>Email</span> <Link href={`mailto:${email}`} style={rowLink}>{email}</Link></Text>
          <Text style={row}><span style={rowKey}>Phone</span> {phone || '—'}</Text>
          <Text style={row}><span style={rowKey}>Message</span></Text>
          <Text style={messageBox}>{message || '—'}</Text>
          <Text style={row}><span style={rowKey}>Signed-in account</span> <span style={mono}>{userId}</span></Text>
          <Text style={row}><span style={rowKey}>Reference</span> <span style={mono}>{leadId}</span></Text>
          <Text style={row}>This account signed in to the live workspace but has no institution membership yet.</Text>
          <LegalFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Pilot access request: ${d.institution ?? 'Unknown'}`,
  displayName: 'Pilot Request Internal Alert',
  to: 'adetokunboogun@gmail.com',
  previewData: { name: 'Ada Okafor', email: 'ada@example.com', institution: 'Example Microfinance Bank',
    institutionType: 'MFB', role: 'Head of Compliance', phone: '+2348012345678',
    message: 'We would like to run a pilot on our own data.', leadId: '00000000-0000-0000-0000-000000000000', userId: '00000000-0000-0000-0000-000000000000' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '640px', margin: '0 auto', padding: '24px' }
const header = { backgroundColor: '#0a0f1c', color: '#ffffff', padding: '22px 26px', borderRadius: '12px 12px 0 0' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '22px 26px', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', color: '#1a1a2e' }
const row = { fontSize: '14px', lineHeight: 1.7, margin: '0 0 6px 0', color: '#1a1a2e' }
const rowKey = { color: '#6b6b80', display: 'inline-block', width: '130px' }
const rowLink = { color: '#0a0f1c' }
const mono = { fontFamily: 'monospace', fontSize: '12px' }
const messageBox = { fontSize: '14px', lineHeight: 1.6, margin: '0 0 12px 0', padding: '12px', backgroundColor: '#f6f7f9', borderRadius: '6px', whiteSpace: 'pre-wrap' as const, color: '#1a1a2e' }

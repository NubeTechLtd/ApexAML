import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props {
  contactName?: string; title?: string; institutionName?: string; institutionType?: string
  email?: string; phone?: string; amlSetup?: string; volume?: string; refNumber?: string
}

const Email = ({ contactName = '—', title = '—', institutionName = 'Unknown institution', institutionType = '—',
  email = '—', phone = '', amlSetup = '—', volume = '—', refNumber = '—' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New roadmap lead: {institutionName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>NEW ROADMAP LEAD</Text>
          <Heading style={h1}>{institutionName} — {institutionType}</Heading>
        </Section>
        <Section style={content}>
          <Text style={row}><span style={rowKey}>Contact</span> <strong>{contactName}</strong> · {title}</Text>
          <Text style={row}><span style={rowKey}>Email</span> <Link href={`mailto:${email}`} style={rowLink}>{email}</Link></Text>
          <Text style={row}><span style={rowKey}>Phone</span> {phone || '—'}</Text>
          <Text style={row}><span style={rowKey}>AML setup</span> {amlSetup}</Text>
          <Text style={row}><span style={rowKey}>Volume</span> {volume}</Text>
          <Text style={row}><span style={rowKey}>Reference</span> <span style={mono}>{refNumber}</span></Text>
          <Text style={row}><Link href="https://apexaml.com/admin/roadmaps" style={rowLink}>Open roadmap leads</Link></Text>
          <LegalFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `New roadmap lead: ${d.institutionName ?? 'Unknown'}`,
  displayName: 'Roadmap Lead Internal Alert',
  to: 'adetokunboogun@gmail.com',
  previewData: { contactName: 'Ada Okafor', title: 'Head of Compliance', institutionName: 'Sterling Microfinance',
    institutionType: 'Microfinance Bank', email: 'ada@example.com', phone: '+2348012345678',
    amlSetup: 'Spreadsheets', volume: '10k-50k/month', refNumber: 'APX-RM-0001' },
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

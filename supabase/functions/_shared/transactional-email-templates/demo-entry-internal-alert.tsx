import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props { name?: string; email?: string; organisationType?: string; role?: string; sessionId?: string }

const Email = ({ name = '—', email = '—', organisationType = '—', role = '—', sessionId = '—' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{name} started the demo ({organisationType})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>NEW DEMO VISITOR</Text>
          <Heading style={h1}>{name} — {organisationType}</Heading>
        </Section>
        <Section style={content}>
          <Text style={row}><span style={rowKey}>Name</span> <strong>{name}</strong></Text>
          <Text style={row}><span style={rowKey}>Role</span> {role}</Text>
          <Text style={row}><span style={rowKey}>Work email</span> <Link href={`mailto:${email}`} style={rowLink}>{email}</Link></Text>
          <Text style={row}><span style={rowKey}>Organisation type</span> {organisationType}</Text>
          <Text style={row}><span style={rowKey}>Demo session</span> <span style={mono}>{sessionId}</span></Text>
          <LegalFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `New demo visitor: ${d.name ?? 'Unknown'} (${d.organisationType ?? '—'})`,
  displayName: 'Demo Entry Internal Alert',
  to: 'adetokunboogun@gmail.com',
  previewData: { name: 'Ada Okafor', email: 'ada@example.com', organisationType: 'MFB', role: 'Head of Compliance', sessionId: '00000000-0000-0000-0000-000000000000' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '640px', margin: '0 auto', padding: '24px' }
const header = { backgroundColor: '#0a0f1c', color: '#ffffff', padding: '22px 26px', borderRadius: '12px 12px 0 0' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '22px 26px', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', color: '#1a1a2e' }
const row = { fontSize: '14px', lineHeight: 1.7, margin: '0 0 6px 0', color: '#1a1a2e' }
const rowKey = { color: '#6b6b80', display: 'inline-block', width: '150px' }
const rowLink = { color: '#0a0f1c' }
const mono = { fontFamily: 'monospace', fontSize: '12px' }

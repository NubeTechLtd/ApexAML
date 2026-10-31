import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props { code?: string }

const Email = ({ code = '------' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your ApexAML demo confirmation code: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>APEXAML DEMO</Text>
          <Heading style={h1}>Confirm your email</Heading>
        </Section>
        <Section style={content}>
          <Text style={p}>Enter this code in the demo to receive sample notification emails at this address:</Text>
          <Text style={codeStyle}>{code}</Text>
          <Text style={p}>The code is valid for 30 minutes. Until you confirm, demo notifications appear only in the Demo Inbox inside the demo.</Text>
          <Text style={muted}>If you didn't start an ApexAML demo, you can ignore this email. Nothing will be sent to you.</Text>
          <LegalFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your ApexAML demo confirmation code',
  displayName: 'Demo Email Confirmation',
  previewData: { code: '482913' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const header = { backgroundColor: '#0a0f1c', color: '#ffffff', padding: '22px 26px', borderRadius: '12px 12px 0 0' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '22px 26px', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', color: '#1a1a2e' }
const p = { fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0', color: '#1a1a2e' }
const codeStyle = { fontFamily: 'monospace', fontSize: '32px', letterSpacing: '0.3em', fontWeight: 700, color: '#0a0f1c', margin: '8px 0 16px 0' }
const muted = { fontSize: '12px', lineHeight: 1.6, margin: '0 0 8px 0', color: '#6b6b80' }

import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props { usedToday?: number; dailyCap?: number; day?: string }

const Email = ({ usedToday = 0, dailyCap = 150, day = '—' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Live demo AI has used {String(usedToday)} of {String(dailyCap)} calls today</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>DEMO AI USAGE</Text>
          <Heading style={h1}>{usedToday} of {dailyCap} live AI calls used</Heading>
        </Section>
        <Section style={content}>
          <Text style={row}><span style={rowKey}>UTC day</span> {day}</Text>
          <Text style={row}><span style={rowKey}>Calls used</span> <strong>{usedToday}</strong></Text>
          <Text style={row}><span style={rowKey}>Daily cap</span> {dailyCap}</Text>
          <Text style={note}>When the cap is reached, demo visitors see the labelled sample narrative and a prompt to book a walkthrough until midnight UTC. Live demo AI can also be switched off immediately with the kill switch.</Text>
          <LegalFooter />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Demo AI at ${d.dailyCap ? Math.round(((d.usedToday ?? 0) / d.dailyCap) * 100) : 80}% of today's cap`,
  displayName: 'Demo AI Capacity Alert',
  to: 'adetokunboogun@gmail.com',
  previewData: { usedToday: 120, dailyCap: 150, day: '2026-10-29' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '640px', margin: '0 auto', padding: '24px' }
const header = { backgroundColor: '#0a0f1c', color: '#ffffff', padding: '22px 26px', borderRadius: '12px 12px 0 0' }
const brand = { fontSize: '11px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '22px 26px', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', color: '#1a1a2e' }
const row = { fontSize: '14px', lineHeight: 1.7, margin: '0 0 6px 0', color: '#1a1a2e' }
const rowKey = { color: '#6b6b80', display: 'inline-block', width: '150px' }
const note = { fontSize: '13px', lineHeight: 1.6, color: '#4a4a5e', margin: '14px 0 0 0' }

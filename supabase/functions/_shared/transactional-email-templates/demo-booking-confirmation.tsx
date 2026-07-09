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
  firstName?: string
  institutionName?: string
  institutionType?: string
  focusAreas?: string
  slotLabel?: string
  zoomLink?: string
}

const Email = ({
  firstName = 'there',
  institutionName = 'your institution',
  institutionType = 'your institution',
  focusAreas = '',
  slotLabel = 'your scheduled time',
  zoomLink = 'https://zoom.us',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your ApexAML demo is confirmed — {slotLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>APEXAML</Text>
          <Heading style={h1}>Your demo is confirmed</Heading>
          <Text style={subhead}>{slotLabel}</Text>
        </Section>

        <Section style={content}>
          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            Thank you for booking a 30-minute walkthrough of ApexAML for{' '}
            <strong>{institutionName}</strong>. Your slot is locked in and a
            calendar invite will follow shortly.
          </Text>

          <Section style={callout}>
            <Text style={calloutLabel}>JOIN VIA ZOOM</Text>
            <Link href={zoomLink} style={calloutLink}>
              {zoomLink}
            </Link>
          </Section>

          <Text style={sectionTitle}>30-MINUTE AGENDA — {institutionName}</Text>
          <Text style={listItem}>
            <strong>0–5 min</strong> · Compliance posture &amp; CBN Circular alignment for {institutionType}
          </Text>
          <Text style={listItem}>
            <strong>5–20 min</strong> · Live walkthrough: AI STR co-pilot, transaction monitoring, NFIU goAML export
          </Text>
          <Text style={listItem}>
            <strong>20–28 min</strong> ·{' '}
            {focusAreas.trim() || 'Tailored deep-dive on your priority workflows'}
          </Text>
          <Text style={listItem}>
            <strong>28–30 min</strong> · Implementation timeline &amp; next steps
          </Text>

          <Text style={sectionTitle}>3 QUESTIONS TO PREPARE</Text>
          <Text style={listItem}>• How many alerts does your team review per month today?</Text>
          <Text style={listItem}>• How long does a typical STR take from alert to NFIU submission?</Text>
          <Text style={listItem}>• Which CBN obligation gives your team the most operational pain?</Text>

          <Text style={muted}>
            If you need to reschedule, just reply to this email.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            ApexAML — Nigeria's AML Compliance Intelligence Platform
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => `Demo confirmed — ${data.slotLabel ?? 'your session'}`,
  displayName: 'Demo Booking Confirmation',
  previewData: {
    firstName: 'Ada',
    institutionName: 'Sterling Microfinance',
    institutionType: 'Microfinance Bank',
    focusAreas: 'STR co-pilot and NFIU goAML export',
    slotLabel: 'Tuesday, 14 July 2026 at 2:00 PM WAT',
    zoomLink: 'https://zoom.us/j/0000000000?pwd=apexaml',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 0' }
const header = { backgroundColor: '#0a0f1c', padding: '28px', borderRadius: '14px 14px 0 0', color: '#ffffff' }
const brand = { fontSize: '12px', letterSpacing: '0.18em', color: '#D4A843', textTransform: 'uppercase' as const, margin: 0, fontWeight: 600 }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '6px 0 0 0' }
const subhead = { fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0 0' }
const content = { backgroundColor: '#ffffff', padding: '28px', color: '#1a1a2e', border: '1px solid #eee', borderTop: 'none' }
const paragraph = { fontSize: '15px', lineHeight: 1.6, color: '#444', margin: '0 0 14px 0' }
const callout = { backgroundColor: '#f6f7fb', borderLeft: '3px solid #D4A843', padding: '14px 18px', borderRadius: '8px', margin: '18px 0' }
const calloutLabel = { fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6b6b80', margin: '0 0 4px 0' }
const calloutLink = { fontSize: '14px', color: '#0a0f1c', fontWeight: 600, wordBreak: 'break-all' as const }
const sectionTitle = { fontSize: '13px', fontWeight: 700, color: '#0a0f1c', margin: '22px 0 10px 0' }
const listItem = { fontSize: '14px', lineHeight: 1.7, color: '#333', margin: '0 0 6px 0' }
const muted = { fontSize: '13px', color: '#6b6b80', margin: '24px 0 0 0' }
const footer = { backgroundColor: '#fafafc', padding: '16px 28px', borderRadius: '0 0 14px 14px', borderTop: '1px solid #eee' }
const footerText = { fontSize: '11px', color: '#6b6b80', margin: 0 }

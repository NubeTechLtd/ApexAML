import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'

interface Props {
  name?: string
  institution?: string
  refNumber?: string
  roadmapText?: string
}

const Email = ({ name = 'Compliance Officer', institution = 'your institution', refNumber = '', roadmapText = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your requested CBN AML roadmap for {institution}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0 }}>
      <Container style={{ maxWidth: '640px', padding: '28px', margin: '0 auto' }}>
        <Heading style={{ fontSize: '22px', color: '#0a0f1c' }}>ApexAML — Your requested roadmap</Heading>
        <Text>Dear {name},</Text>
        <Text>Your requested CBN AML implementation roadmap for {institution} is included below.</Text>
        <Text>Reference: {refNumber}</Text>
        <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7 }}>{roadmapText}</Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => `Your CBN AML Roadmap — ${data.institution ?? 'your institution'} — Ref ${data.refNumber ?? ''}`,
  displayName: 'Requested Roadmap Delivery',
  previewData: { name: 'Ada', institution: 'Example Institution', refNumber: 'ROADMAP-PREVIEW', roadmapText: 'Your requested roadmap appears here.' },
} satisfies TemplateEntry
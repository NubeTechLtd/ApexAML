import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { LegalFooter } from './legal-footer.tsx'
import { DEMO_NOTIFICATIONS, demoSubject, type DemoNotificationType } from '../demo-notification-content.ts'

function entry(type: DemoNotificationType): TemplateEntry {
  const content = DEMO_NOTIFICATIONS[type];
  const Email = () => <Html lang="en" dir="ltr"><Head /><Preview>{content.title} — fictional sample data only</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}><Container style={{ maxWidth: '600px', padding: '24px' }}>
      <Section style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '8px' }}>
        <Text style={{ color: '#9ca3af', fontSize: '14px', margin: '0' }}>ApexAML · Demo notification</Text>
        <Heading style={{ color: '#ffffff', fontSize: '24px' }}>{content.title}</Heading>
      </Section>
      <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6' }}>{content.body}</Text>
      <Text style={{ color: '#334155', fontSize: '14px' }}>Demo environment: sample data only, no live connections.</Text>
      <Button href="https://apexaml.com/demo/inbox" style={{ backgroundColor: '#2f6bb8', color: '#ffffff', padding: '12px 20px', borderRadius: '6px' }}>Open demo inbox</Button>
      <LegalFooter />
    </Container></Body></Html>;
  return { component: Email, subject: demoSubject(type), displayName: `Demo: ${content.title}`, previewData: {} };
}
export const demoNotificationTemplates = Object.fromEntries((Object.keys(DEMO_NOTIFICATIONS) as DemoNotificationType[]).map(type => [`demo-${type.replaceAll('_', '-')}`, entry(type)]));

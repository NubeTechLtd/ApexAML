import { demoNotificationTemplates } from './demo-notifications.tsx'
import type { ComponentType } from 'npm:react@18.3.1'
import { template as demoBookingConfirmation } from './demo-booking-confirmation.tsx'
import { template as demoBookingInternalAlert } from './demo-booking-internal-alert.tsx'
import { template as roadmapLeadInternalAlert } from './roadmap-lead-internal-alert.tsx'
import { template as roadmapDelivery } from './roadmap-delivery.tsx'
import { template as contactLeadInternalAlert } from './contact-lead-internal-alert.tsx'
import { template as demoEntryInternalAlert } from './demo-entry-internal-alert.tsx'
import { template as demoAiCapacityAlert } from './demo-ai-capacity-alert.tsx'
import { template as demoEmailConfirmation } from './demo-email-confirmation.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  ...demoNotificationTemplates,
  'contact-lead-internal-alert': contactLeadInternalAlert,
  'demo-entry-internal-alert': demoEntryInternalAlert,
  'demo-ai-capacity-alert': demoAiCapacityAlert,
  'demo-email-confirmation': demoEmailConfirmation,
  'demo-booking-confirmation': demoBookingConfirmation,
  'demo-booking-internal-alert': demoBookingInternalAlert,
  'roadmap-delivery': roadmapDelivery,
  'roadmap-lead-internal-alert': roadmapLeadInternalAlert,
}

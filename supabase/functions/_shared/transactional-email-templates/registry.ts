import type { ComponentType } from 'npm:react@18.3.1'
import { template as demoBookingConfirmation } from './demo-booking-confirmation.tsx'
import { template as demoBookingInternalAlert } from './demo-booking-internal-alert.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'demo-booking-confirmation': demoBookingConfirmation,
  'demo-booking-internal-alert': demoBookingInternalAlert,
}

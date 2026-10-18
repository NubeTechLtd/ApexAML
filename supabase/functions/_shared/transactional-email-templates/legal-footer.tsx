import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'

export const LEGAL_FOOTER = 'NubeTech Ltd, registered in England and Wales, company number 11844857, [ENTER address]. Your data is handled under the Nigeria Data Protection Act 2023.'

export function LegalFooter() {
  return <Text style={{ fontSize: '11px', lineHeight: 1.7, color: '#6b6b80', margin: '16px 0 0' }}>{LEGAL_FOOTER}</Text>
}
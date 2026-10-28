// Fixed fictional content shared by the demo inbox and server templates. No case data is accepted.
export const DEMO_NOTIFICATIONS = {
  alert_assigned: { title: 'Alert assigned', body: 'A fictional alert at Harmattan Ridge Microfinance Bank has been assigned to the demo analyst. Open the sample workspace to review the case.' },
  alert_escalated: { title: 'Alert escalated', body: 'A fictional alert at Harmattan Ridge Microfinance Bank has been escalated for compliance review. No live investigation or external reporting has taken place.' },
  str_submitted: { title: 'STR submitted for approval', body: 'A sample suspicious transaction report has been submitted for approval in the demo. This is not a submission to the NFIU.' },
  str_exported: { title: 'STR exported', body: 'A sample STR has been exported in the demo. The exported report contains fictional data only and must not be filed with any authority.' },
  ctr_filed: { title: 'CTR filed', body: 'A sample cash transaction report has been marked as filed in the demo. Nothing has been sent to the NFIU or a live reporting system.' },
  account_frozen: { title: 'Account frozen', body: 'A fictional account at Harmattan Ridge Microfinance Bank has been frozen in the demo. No real account or funds have been affected.' },
  daily_briefing: { title: 'Daily briefing', body: 'Your fictional workspace contains 25 sample alerts and four initially pending CTRs. Review the sample cases, reporting queue and audit trail. This briefing describes the starting demo dataset, not live activity.' },
} as const;
export type DemoNotificationType = keyof typeof DEMO_NOTIFICATIONS;
export const demoSubject = (type: DemoNotificationType) => `[ApexAML Demo] ${DEMO_NOTIFICATIONS[type].title}`;

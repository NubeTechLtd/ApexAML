import { beforeEach, describe, expect, it } from 'vitest';
import { demoProvider } from './providers/demo';
import { resetDemoStore } from './demoStore';
import { emitDailyBriefing, markDemoEmailsRead, readDemoEmails } from './demoNotifications';

describe('demo event notifications', () => {
  beforeEach(resetDemoStore);
  const actions = [
    ['NFIU_ESCALATION', 'Case reassigned to demo analyst', 'alert_assigned'],
    ['NFIU_ESCALATION', 'Sample escalation justification', 'alert_escalated'],
    ['STR_FILED', 'Sample report queued for approval', 'str_submitted'],
    ['STR_EXPORT', 'Sample report exported', 'str_exported'],
    ['CTR_FILED', 'Sample cash report filed', 'ctr_filed'],
    ['ACCOUNT_FREEZE', 'Sample account frozen', 'account_frozen'],
  ];
  it.each(actions)('%s creates its event without leaking action data', async (action, justification, type) => {
    await demoProvider.audit.append({ action, justification: `${justification} PRIVATE-CONTENT`, analyst: 'PRIVATE-NAME', caseId: 'PRIVATE-ID' });
    const [email] = readDemoEmails();
    expect(email.type).toBe(type);
    expect(email.subject.startsWith('[ApexAML Demo]')).toBe(true);
    expect(email.body).not.toContain('PRIVATE');
    markDemoEmailsRead(email.id);
    expect(readDemoEmails()[0].read).toBe(true);
  });
  it('daily briefing is once per active session per UTC day', () => {
    emitDailyBriefing(); emitDailyBriefing();
    expect(readDemoEmails().filter(e => e.type === 'daily_briefing')).toHaveLength(1);
  });
  it('denied audit events never produce success notifications', async () => {
    await demoProvider.audit.append({ action: 'ACCOUNT_FREEZE', justification: 'denied freeze', analyst: '', caseId: 'X', status: 'denied' });
    expect(readDemoEmails()).toHaveLength(0);
  });
});
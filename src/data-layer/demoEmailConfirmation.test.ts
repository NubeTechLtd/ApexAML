import { beforeEach, describe, expect, it } from 'vitest';
import { saveDemoNotificationCredentials } from './demoStore';
import { canEmailDemoNotifications, saveDemoEmailConfirmation } from './demoEmailConfirmation';

describe('demo email confirmation gate', () => {
  beforeEach(() => localStorage.clear());

  it('does not email demo notifications before the address is confirmed', () => {
    saveDemoNotificationCredentials('s1', 'token');
    saveDemoEmailConfirmation({ sessionId: 's1', email: 'a@example.com', confirmed: false });
    expect(canEmailDemoNotifications()).toBe(false);
  });

  it('emails demo notifications once that session is confirmed', () => {
    saveDemoNotificationCredentials('s1', 'token');
    saveDemoEmailConfirmation({ sessionId: 's1', email: 'a@example.com', confirmed: true });
    expect(canEmailDemoNotifications()).toBe(true);
  });

  it('a confirmation from another session does not carry over', () => {
    saveDemoNotificationCredentials('s2', 'token');
    saveDemoEmailConfirmation({ sessionId: 's1', email: 'a@example.com', confirmed: true });
    expect(canEmailDemoNotifications()).toBe(false);
  });
});

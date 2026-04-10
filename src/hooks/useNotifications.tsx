import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { mockAlerts } from '@/data/mockAlerts';

export type NotificationType = 'SLA_BREACH' | 'CBN_CIRCULAR' | 'HIGH_RISK_ALERT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  relativeTime: string;
  read: boolean;
  link: string;
}

function generateNotifications(): AppNotification[] {
  const notifications: AppNotification[] = [
    {
      id: 'notif-sla-001',
      type: 'SLA_BREACH',
      title: 'SLA Breach',
      description: 'Alert ALT-2026-0891 has exceeded the 4-hour SLA resolution window.',
      relativeTime: '35m ago',
      read: false,
      link: '/workspace',
    },
    {
      id: 'notif-cbn-001',
      type: 'CBN_CIRCULAR',
      title: 'CBN Circular Update',
      description: 'New CBN circular BSD/DIR/PUB/LAB/019/003 — updated PEP screening thresholds.',
      relativeTime: '1h ago',
      read: false,
      link: '/reports/cbn',
    },
  ];

  // Auto-generate HIGH_RISK_ALERT for every Critical + Open alert in mock data
  mockAlerts
    .filter((a) => a.riskLevel === 'Critical' && a.status === 'Open')
    .forEach((a) => {
      notifications.push({
        id: `notif-hra-${a.id}`,
        type: 'HIGH_RISK_ALERT',
        title: 'High-Risk Alert',
        description: `Critical alert ${a.id} (${a.customerProfile.fullName}) requires immediate review.`,
        relativeTime: a.timeElapsed,
        read: false,
        link: '/workspace?risk=Critical',
      });
    });

  return notifications;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(generateNotifications);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

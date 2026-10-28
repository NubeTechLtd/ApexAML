/**
 * React access to the demo dataset: seed views merged with the visitor's
 * session overlays, plus the actions that change them. Demo-zone screens
 * use this; every change re-renders all screens that read it.
 */
import { useMemo, useSyncExternalStore } from 'react';
import type { Alert } from '@/data/models/alerts';
import type { SanctionsMatch } from '@/data/models/sanctions';
import type { STRRecord } from '@/data/models/str';
import { onCollectionChange, readCollection, writeCollection } from './demoStore';
import * as views from './seed/views';
import {
  SEED_KYB, SEED_KYC, SEED_NFIU_SUBMISSIONS, SEED_SETTLEMENT, customerByNum,
} from './seed/dataset';

const KEY = 'overlays';
const read = () => readCollection<views.DemoOverlays>(KEY, views.emptyOverlays);
const update = (fn: (o: views.DemoOverlays) => views.DemoOverlays) => writeCollection(KEY, fn({ ...views.emptyOverlays(), ...read() }));

export const demoActions = {
  setAlertStatus(alertId: string, status: Alert['status']) {
    update((o) => ({ ...o, alertStatus: { ...o.alertStatus, [alertId]: status } }));
  },
  setAccountStatus(nums: number[], status: views.DemoAccountStatus) {
    update((o) => ({ ...o, accountStatus: { ...o.accountStatus, ...Object.fromEntries(nums.map((n) => [n, status])) } }));
  },
  /** Restores earlier statuses (used by "Undo"). */
  restoreAccountStatus(previous: Record<number, views.DemoAccountStatus>) {
    update((o) => ({ ...o, accountStatus: { ...o.accountStatus, ...previous } }));
  },
  setRuleEnabled(ruleId: string, enabled: boolean) {
    update((o) => ({ ...o, ruleEnabled: { ...o.ruleEnabled, [ruleId]: enabled } }));
  },
  setSanctionsStatus(ids: string[], status: SanctionsMatch['status']) {
    update((o) => ({ ...o, sanctionsStatus: { ...o.sanctionsStatus, ...Object.fromEntries(ids.map((id) => [id, status])) } }));
  },
  setStrStatus(id: string, status: STRRecord['status']) {
    update((o) => ({ ...o, strStatus: { ...o.strStatus, [id]: status } }));
  },
  /** Records a goAML export as a pending-review STR for the case. */
  recordStrExport(alertId: string, record: Omit<STRRecord, 'id' | 'reference' | 'status' | 'filedDate'>) {
    update((o) => {
      const existing = [...o.sessionStrs].find((s) => s.alertId === alertId);
      if (existing) return { ...o, strStatus: { ...o.strStatus, [existing.id]: 'Pending Review' } };
      const n = o.sessionStrs.length + 1;
      const str: STRRecord = { ...record, alertId, id: `str-s${n}`, reference: `STR-2026-S${String(n).padStart(4, '0')}`, status: 'Pending Review', filedDate: new Date().toISOString().slice(0, 10) };
      return { ...o, sessionStrs: [str, ...o.sessionStrs] };
    });
  },
};

export const readDemoOverlays = read;

export function useDemoOverlays(): views.DemoOverlays {
  return useSyncExternalStore((fn) => onCollectionChange(KEY, fn), read, read);
}

export function useDemoDataset() {
  const o = useDemoOverlays();
  return useMemo(() => ({
    overlays: o,
    alerts: views.workspaceAlerts(o),
    legacyAlerts: views.legacyAlerts(o),
    customers360: views.customer360(o),
    customerRows: views.customerRows(o),
    kycCustomers: SEED_KYC,
    kybCases: SEED_KYB,
    sanctionsMatches: views.sanctionsMatches(o),
    strRecords: views.strRecords(o),
    nfiuSubmissions: SEED_NFIU_SUBMISSIONS,
    settlementAccounts: SEED_SETTLEMENT,
    rules: views.rules(o),
  }), [o]);
}

export { views, customerByNum };

/** A persisted demo-session collection with a React setter (e.g. KYB cases, managed accounts). */
export function useDemoCollection<T>(key: string, seed: () => T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore((fn) => onCollectionChange(key, fn), () => readCollection(key, seed), () => readCollection(key, seed));
  const set = (next: T | ((prev: T) => T)) => {
    const prev = readCollection(key, seed);
    writeCollection(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next);
  };
  return [value, set];
}

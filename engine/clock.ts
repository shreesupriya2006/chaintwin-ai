// Pure TypeScript Date & Clock Utilities for ChainTwin AI
// The engine NEVER calls new Date() or Date.now() internally; all functions receive an explicit `now`.

import { parseISO, format, addDays, differenceInCalendarDays, isBefore, isAfter, isEqual } from 'date-fns';
import { NetworkSnapshot } from './types';

export function parseDate(dateStr: string): Date {
  // Strip potential time component if date-only format YYYY-MM-DD
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  return parseISO(cleanStr);
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return format(d, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  return formatDate(addDays(d, days));
}

export function getDaysDiff(dateA: string | Date, dateB: string | Date): number {
  const da = typeof dateA === 'string' ? parseDate(dateA) : dateA;
  const db = typeof dateB === 'string' ? parseDate(dateB) : dateB;
  return differenceInCalendarDays(da, db);
}

export function isDateBefore(dateA: string, dateB: string): boolean {
  return isBefore(parseDate(dateA), parseDate(dateB));
}

export function isDateAfter(dateA: string, dateB: string): boolean {
  return isAfter(parseDate(dateA), parseDate(dateB));
}

export function isDateOnOrBefore(dateA: string, dateB: string): boolean {
  const da = parseDate(dateA);
  const db = parseDate(dateB);
  return isBefore(da, db) || isEqual(da, db);
}

/**
 * Rebasing Helper:
 * Shifts all dates across the entire dataset by (now - as_of_date) days so the network operates in real-time.
 */
export function rebaseSnapshotDates(snapshot: NetworkSnapshot, now: Date): NetworkSnapshot {
  const asOfSetting = snapshot.settings.find(s => s.key === 'as_of_date');
  if (!asOfSetting) return snapshot;

  const originalAsOf = parseDate(asOfSetting.value);
  const shiftDays = differenceInCalendarDays(now, originalAsOf);

  if (shiftDays === 0) return snapshot;

  const shift = (dStr?: string): string => {
    if (!dStr) return '';
    try {
      return addDaysToDate(dStr, shiftDays);
    } catch {
      return dStr;
    }
  };

  return {
    ...snapshot,
    settings: snapshot.settings.map(s => 
      s.key === 'as_of_date' ? { ...s, value: formatDate(now) } : s
    ),
    supplierMaterials: snapshot.supplierMaterials.map(sm => ({
      ...sm,
      quote_date: sm.quote_date ? shift(sm.quote_date) : undefined,
    })),
    productionRates: snapshot.productionRates.map(pr => ({
      ...pr,
      from_date: shift(pr.from_date),
      to_date: shift(pr.to_date),
    })),
    inventory: snapshot.inventory.map(inv => ({
      ...inv,
      as_of_date: formatDate(now),
    })),
    orders: snapshot.orders.map(o => ({
      ...o,
      order_date: shift(o.order_date),
      promised_date: shift(o.promised_date),
    })),
    orderStages: snapshot.orderStages.map(st => ({
      ...st,
      planned_start: shift(st.planned_start),
      planned_end: shift(st.planned_end),
      actual_end: st.actual_end ? shift(st.actual_end) : undefined,
    })),
    inboundPOs: snapshot.inboundPOs.map(po => ({
      ...po,
      po_date: shift(po.po_date),
      expected_arrival: shift(po.expected_arrival),
    })),
  };
}

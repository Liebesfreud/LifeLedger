import { clsx, type ClassValue } from 'clsx';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { BillingCycle, Currency } from '@/types/domain';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value?: string) {
  if (!value) return '未记录';
  return format(parseISO(value), 'yyyy-MM-dd');
}

export function daysUntil(value: string) {
  return differenceInCalendarDays(parseISO(value), new Date());
}

export const currencySymbol: Record<Currency, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const cycleLabel: Record<BillingCycle, string> = {
  weekly: '每周',
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
};

export function money(value: number, currency: Currency = 'CNY') {
  return `${currencySymbol[currency]}${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;
}

export function monthlyCost(price: number, cycle: BillingCycle) {
  if (cycle === 'weekly') return price * 4.33;
  if (cycle === 'quarterly') return price / 3;
  if (cycle === 'yearly') return price / 12;
  return price;
}

export function annualCost(price: number, cycle: BillingCycle) {
  return monthlyCost(price, cycle) * 12;
}

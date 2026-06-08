export type Currency = 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';
export type ItemCondition = 'new' | 'good' | 'used' | 'idle' | 'retired';

export type Category = {
  id: string;
  name: string;
  color: string;
  module: 'subscription' | 'item';
  createdAt: string;
};

export type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  categoryId?: string;
  icon?: string;
  description?: string;
  notifyDaysBefore: number;
  autoRenew: boolean;
  createdAt: string;
};

export type Item = {
  id: string;
  name: string;
  purchasePrice: number;
  currency: Currency;
  purchaseDate: string;
  categoryId?: string;
  location: string;
  condition: ItemCondition;
  usageCount: number;
  lastUsedAt?: string;
  idleAlertDays: number;
  note?: string;
  createdAt: string;
};

export type ItemUsageLog = {
  id: string;
  itemId: string;
  usedAt: string;
  note?: string;
  createdAt: string;
};

export type AppSettings = {
  baseCurrency: Currency;
  monthlyBudget: number;
  itemIdleAlertDays: number;
  notificationEnabled: boolean;
};

export type Insight = {
  title: string;
  value: string;
  caption: string;
  tone: 'blue' | 'green' | 'amber' | 'rose';
};

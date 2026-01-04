
export type Currency = 'CNY' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextPaymentDate: string; // ISO date string (YYYY-MM-DD)
  categoryId: string;
  icon: string;
  description?: string;
  notifyDaysBefore: number;
  tags?: string; // Comma separated tags
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface EmailSettings {
  enabled: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
}

export interface UserSettings {
  username: string;
  themeColor: string; // Hex code
  darkMode: boolean;
  language: 'zh' | 'en';
  baseCurrency?: Currency;
  ratesUpdatedAt?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  notificationStyle: 'simple' | 'detailed';
  defaultNotifyDays: number;
  currencyRates: Record<Currency, number>; // Rate relative to CNY
  monthlyBudget?: number;
  emailSettings?: EmailSettings;
}

export interface NotificationLog {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  sentAt: string;
  status: 'success' | 'failed' | 'failed_tg' | 'failed_email' | 'failed_all';
}

export interface UserCredentials {
  username: string;
  password: string;
}

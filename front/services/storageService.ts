import { Subscription, Category, UserSettings, NotificationLog, Currency, UserCredentials } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:8080';

type Session = {
  token: string;
  username: string;
  subscriptions: Subscription[];
  categories: Category[];
  settings: UserSettings;
  logs: NotificationLog[];
};

let currentSession: Session | null = null;

const authHeaders = () => (currentSession?.token ? { Authorization: `Bearer ${currentSession.token}` } : {});

const toApiDate = (dateStr: string) => {
  if (!dateStr) return new Date().toISOString();
  return new Date(dateStr).toISOString();
};

const normalizeSubscription = (sub: any): Subscription => ({
  id: sub.id,
  name: sub.name,
  price: sub.price ?? 0,
  currency: sub.currency,
  billingCycle: sub.billingCycle,
  nextPaymentDate: (sub.nextPaymentDate || '').split('T')[0],
  categoryId: sub.categoryId || '',
  icon: sub.icon || 'Zap',
  description: sub.description || '',
  notifyDaysBefore: sub.notifyDaysBefore ?? 0,
});

const normalizeCategory = (cat: any): Category => ({
  id: cat.id,
  name: cat.name,
  color: cat.color || '#9ca3af',
});

const normalizeSettings = (payload: any, username: string): UserSettings => {
  const baseCurrency = payload?.baseCurrency || DEFAULT_SETTINGS.baseCurrency || 'CNY';
  const rates = { ...(payload?.currencyRates || DEFAULT_SETTINGS.currencyRates) };
  if (!rates[baseCurrency as Currency]) {
    rates[baseCurrency as Currency] = 1;
  }
  return {
    ...DEFAULT_SETTINGS,
    ...payload,
    username: username || payload?.username || DEFAULT_SETTINGS.username,
    baseCurrency: baseCurrency as Currency,
    currencyRates: rates,
    ratesUpdatedAt: payload?.ratesUpdatedAt || '',
  };
};

const normalizeLog = (log: any): NotificationLog => ({
  id: log.id,
  subscriptionId: log.subscriptionId,
  subscriptionName: log.subscriptionName,
  sentAt: log.sentAt,
  status: log.status,
});

const requestJSON = async (path: string, options: (RequestInit & { tokenOverride?: string }) = {}) => {
  const { tokenOverride, ...rest } = options as any;
  const headerAuth = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : authHeaders();

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headerAuth,
      ...(rest.headers || {}),
    },
    ...rest,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-json responses
  }

  if (!res.ok) {
    const message = data?.error || data?.message || res.statusText;
    throw new Error(message);
  }

  return data;
};

const hydrateSession = async (token: string, username?: string) => {
  const [subs, cats, me, logs] = await Promise.all([
    requestJSON('/api/subscriptions', { tokenOverride: token }),
    requestJSON('/api/categories', { tokenOverride: token }),
    requestJSON('/api/auth/me', { tokenOverride: token }),
    requestJSON('/api/notifications/logs', { tokenOverride: token }).catch(() => []),
  ]);

  const resolvedUsername = me?.username || username || DEFAULT_SETTINGS.username;
  const settings = me?.settings ? normalizeSettings(me.settings, resolvedUsername) : { ...DEFAULT_SETTINGS, username: resolvedUsername };

  currentSession = {
    token,
    username: resolvedUsername,
    subscriptions: Array.isArray(subs) ? subs.map(normalizeSubscription) : [],
    categories: Array.isArray(cats) ? cats.map(normalizeCategory) : [],
    settings,
    logs: Array.isArray(logs) ? logs.map(normalizeLog) : [],
  };
};

const createSubscription = async (sub: Subscription): Promise<Subscription> => {
  const data = await requestJSON('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextPaymentDate: toApiDate(sub.nextPaymentDate),
      categoryId: sub.categoryId,
      icon: sub.icon,
      description: sub.description,
      notifyDaysBefore: sub.notifyDaysBefore,
      autoRenew: false,
    }),
  });
  return normalizeSubscription(data);
};

const updateSubscription = async (sub: Subscription) => {
  await requestJSON(`/api/subscriptions/${sub.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: sub.id,
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextPaymentDate: toApiDate(sub.nextPaymentDate),
      categoryId: sub.categoryId,
      icon: sub.icon,
      description: sub.description,
      notifyDaysBefore: sub.notifyDaysBefore,
      autoRenew: false,
    }),
  });
};

const deleteSubscription = async (id: string) => {
  await requestJSON(`/api/subscriptions/${id}`, { method: 'DELETE' });
};

const createCategory = async (cat: Category): Promise<Category> => {
  const data = await requestJSON('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name: cat.name, color: cat.color }),
  });
  return normalizeCategory(data);
};

const updateCategory = async (cat: Category) => {
  await requestJSON(`/api/categories/${cat.id}`, {
    method: 'PUT',
    body: JSON.stringify({ id: cat.id, name: cat.name, color: cat.color }),
  });
};

const deleteCategory = async (id: string) => {
  await requestJSON(`/api/categories/${id}`, { method: 'DELETE' });
};

export const StorageService = {
  // --- Auth & Session ---
  isLoggedIn: () => !!currentSession,

  getCurrentUsername: () => currentSession?.username || null,

  restoreSession: async (): Promise<boolean> => {
    const token = localStorage.getItem('subtrack_token');
    const username = localStorage.getItem('subtrack_username') || undefined;
    if (!token) return false;
    try {
      await hydrateSession(token, username);
      return true;
    } catch (e) {
      console.error('Session restore failed', e);
      localStorage.removeItem('subtrack_token');
      localStorage.removeItem('subtrack_username');
      return false;
    }
  },

  login: async (creds: UserCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await requestJSON('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(creds),
      });
      await hydrateSession(data.token, data.username);
      localStorage.setItem('subtrack_token', data.token);
      if (data.username) localStorage.setItem('subtrack_username', data.username);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Login failed' };
    }
  },

  register: async (creds: UserCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      await requestJSON('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(creds),
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Registration failed' };
    }
  },

  logout: () => {
    currentSession = null;
    localStorage.removeItem('subtrack_token');
    localStorage.removeItem('subtrack_username');
  },

  updateAccount: async (newUsername?: string, newPassword?: string, currentPassword?: string): Promise<boolean> => {
    if (!currentSession) return false;

    const payload: any = {};
    if (newUsername && newUsername !== currentSession.username) payload.newUsername = newUsername;
    if (newPassword) {
      if (!currentPassword) {
        console.error('Current password required to change password');
        return false;
      }
      payload.newPassword = newPassword;
      payload.currentPassword = currentPassword;
    }

    if (Object.keys(payload).length === 0) return true;

    try {
      await requestJSON('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (payload.newUsername) currentSession.username = payload.newUsername;
      return true;
    } catch (e) {
      console.error('Update account failed', e);
      return false;
    }
  },

  // --- Data Access & Persistence ---
  getSubscriptions: () => currentSession?.subscriptions || [],

  saveSubscriptions: async (subs: Subscription[]) => {
    if (!currentSession) return;
    try {
      const existing = new Map(currentSession.subscriptions.map((s) => [s.id, s]));
      currentSession.subscriptions = subs;

      const incomingIds = new Set(subs.map((s) => s.id));

      for (const sub of subs) {
        if (!existing.has(sub.id)) {
          const created = await createSubscription(sub);
          currentSession.subscriptions = currentSession.subscriptions.map((s) => (s.id === sub.id ? created : s));
        } else {
          await updateSubscription(sub);
        }
      }

      for (const id of existing.keys()) {
        if (!incomingIds.has(id)) {
          await deleteSubscription(id);
        }
      }
    } catch (e) {
      console.error('Save subscriptions failed', e);
    }
  },

  getCategories: () => currentSession?.categories || [],

  saveCategories: async (cats: Category[]) => {
    if (!currentSession) return;
    try {
      const existing = new Map(currentSession.categories.map((c) => [c.id, c]));
      currentSession.categories = cats;

      const incomingIds = new Set(cats.map((c) => c.id));

      for (const cat of cats) {
        if (!existing.has(cat.id)) {
          const created = await createCategory(cat);
          currentSession.categories = currentSession.categories.map((c) => (c.id === cat.id ? created : c));
        } else {
          await updateCategory(cat);
        }
      }

      for (const id of existing.keys()) {
        if (!incomingIds.has(id)) {
          await deleteCategory(id);
        }
      }
    } catch (e) {
      console.error('Save categories failed', e);
    }
  },

  getSettings: () => currentSession?.settings || DEFAULT_SETTINGS,

  saveSettings: async (s: UserSettings) => {
    if (!currentSession) return;
    const base = (s.baseCurrency || 'CNY') as Currency;
    const rates = { ...(s.currencyRates || {}), [base]: 1 };
    currentSession.settings = { ...s, baseCurrency: base, currencyRates: rates };
    try {
      await requestJSON('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          themeColor: currentSession.settings.themeColor,
          darkMode: currentSession.settings.darkMode,
          language: currentSession.settings.language,
          telegramBotToken: currentSession.settings.telegramBotToken,
          telegramChatId: currentSession.settings.telegramChatId,
          notificationStyle: currentSession.settings.notificationStyle,
          defaultNotifyDays: currentSession.settings.defaultNotifyDays,
          currencyRates: currentSession.settings.currencyRates,
          baseCurrency: currentSession.settings.baseCurrency,
          ratesUpdatedAt: currentSession.settings.ratesUpdatedAt,
        }),
      });
    } catch (e) {
      console.error('Save settings failed', e);
    }
  },

  getLogs: () => currentSession?.logs || [],

  // No realtime support on Go backend; keep API compatible.
  subscribeToRealtime: (_onUpdate: () => void) => { },
  unsubscribeRealtime: () => { },

  // --- Export/Import ---
  exportData: async () => {
    if (!currentSession) return;
    try {
      const data = await requestJSON('/api/data/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtrack_${currentSession.username}_backup.json`;
      a.click();
    } catch (e) {
      console.error('Export failed', e);
    }
  },

  importData: async (file: File, callback: (success: boolean) => void) => {
    if (!currentSession) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        await requestJSON('/api/data/import', {
          method: 'POST',
          body: JSON.stringify(imported),
        });
        await hydrateSession(currentSession!.token, currentSession!.username);
        callback(true);
      } catch (err) {
        console.error('Import failed', err);
        callback(false);
      }
    };
    reader.readAsText(file);
  },

  // Refresh exchange rates from server
  refreshRates: async (baseCurrency?: Currency) => {
    if (!currentSession) return null;
    const targetBase = (baseCurrency || currentSession.settings.baseCurrency || 'CNY') as Currency;
    try {
      const data = await requestJSON('/api/settings/refresh-rates', {
        method: 'POST',
        body: JSON.stringify({ baseCurrency: targetBase }),
      });
      if (data?.settings) {
        const normalized = normalizeSettings(data.settings, currentSession.username);
        currentSession.settings = normalized;
        return normalized;
      }
    } catch (e) {
      console.error('Refresh rates failed', e);
      throw e;
    }
    return null;
  },

  isSupabaseConfigured: () => !!API_BASE,
};

// --- Helpers ---
export const convertToBase = (
  amount: number,
  currency: Currency,
  rates: Record<Currency, number>,
  baseCurrency: Currency
): number => {
  if (currency === baseCurrency) return amount;
  const rate = rates[currency];
  if (!rate || rate === 0) return amount;
  // rates are expressed as target per 1 base, so invert to get base amount
  return amount / rate;
};

export const getMonthlyCost = (sub: Subscription, settings: UserSettings): number => {
  const base = (settings.baseCurrency || 'CNY') as Currency;
  const rates = settings.currencyRates || {};
  const baseAmount = convertToBase(sub.price, sub.currency, rates, base);
  switch (sub.billingCycle) {
    case 'weekly':
      return baseAmount * 4.33;
    case 'monthly':
      return baseAmount;
    case 'quarterly':
      return baseAmount / 3;
    case 'yearly':
      return baseAmount / 12;
    default:
      return baseAmount;
  }
};

export const getPreviousPaymentDate = (nextDate: Date, cycle: Subscription['billingCycle']): Date => {
  const prev = new Date(nextDate);
  switch (cycle) {
    case 'weekly':
      prev.setDate(prev.getDate() - 7);
      break;
    case 'monthly':
      prev.setMonth(prev.getMonth() - 1);
      break;
    case 'quarterly':
      prev.setMonth(prev.getMonth() - 3);
      break;
    case 'yearly':
      prev.setFullYear(prev.getFullYear() - 1);
      break;
  }
  return prev;
};

export const addOneCycle = (dateStr: string, cycle: Subscription['billingCycle']): string => {
  const date = new Date(dateStr);
  switch (cycle) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
};

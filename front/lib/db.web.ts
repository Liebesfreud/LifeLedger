import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, Category, Item, ItemUsageLog, Subscription, SubscriptionRenewalLog } from '@/types/domain';
import { createId, isISODate, nextBillingDate, todayISO } from '@/lib/utils';

const STORAGE_KEY = 'lifeledger:web-database:v1';

const defaultSettings: AppSettings = {
  baseCurrency: 'CNY',
  monthlyBudget: 500,
  itemIdleAlertDays: 45,
  notificationEnabled: true,
  themeMode: 'system',
};

type WebDatabase = {
  version: 3;
  categories: Category[];
  subscriptions: Subscription[];
  subscriptionRenewalLogs: SubscriptionRenewalLog[];
  items: Item[];
  itemUsageLogs: ItemUsageLog[];
  settings: AppSettings;
};

let databasePromise: Promise<WebDatabase> | null = null;
let writeQueue = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

const currencies = new Set(['CNY', 'USD', 'EUR', 'GBP', 'JPY']);
const billingCycles = new Set(['monthly', 'yearly', 'weekly', 'quarterly']);
const subscriptionStatuses = new Set(['active', 'paused', 'cancelled']);
const itemConditions = new Set(['new', 'good', 'used', 'idle', 'retired']);
const themeModes = new Set(['system', 'light', 'dark']);

function validOptionalDate(value: unknown) {
  return value === undefined || value === null || value === '' || (typeof value === 'string' && isISODate(value));
}

function validCategory(value: unknown): value is Category {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isString(value.color)
    && (value.module === 'subscription' || value.module === 'item')
    && isString(value.createdAt);
}

function validSubscription(value: unknown): value is Subscription {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isNonNegativeNumber(value.price)
    && currencies.has(String(value.currency))
    && billingCycles.has(String(value.billingCycle))
    && isString(value.nextPaymentDate)
    && isISODate(value.nextPaymentDate)
    && Number.isInteger(value.notifyDaysBefore)
    && Number(value.notifyDaysBefore) >= 0
    && typeof value.autoRenew === 'boolean'
    && subscriptionStatuses.has(String(value.status ?? 'active'))
    && isString(value.createdAt);
}

function validSubscriptionRenewalLog(value: unknown): value is SubscriptionRenewalLog {
  return isRecord(value)
    && isString(value.id)
    && isString(value.subscriptionId)
    && isString(value.paidAt)
    && isISODate(value.paidAt)
    && isNonNegativeNumber(value.amount)
    && currencies.has(String(value.currency))
    && isString(value.nextPaymentDate)
    && isISODate(value.nextPaymentDate)
    && isString(value.createdAt);
}

function validItem(value: unknown): value is Item {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isNonNegativeNumber(value.purchasePrice)
    && currencies.has(String(value.currency))
    && isString(value.purchaseDate)
    && isISODate(value.purchaseDate)
    && isString(value.location)
    && itemConditions.has(String(value.condition))
    && Number.isInteger(value.usageCount)
    && Number(value.usageCount) >= 0
    && isPositiveInteger(value.idleAlertDays)
    && validOptionalDate(value.lastUsedAt)
    && validOptionalDate(value.warrantyUntil)
    && isString(value.createdAt);
}

function validItemUsageLog(value: unknown): value is ItemUsageLog {
  return isRecord(value)
    && isString(value.id)
    && isString(value.itemId)
    && isString(value.usedAt)
    && isISODate(value.usedAt)
    && isString(value.createdAt);
}

function validSettings(value: unknown): value is AppSettings {
  return isRecord(value)
    && currencies.has(String(value.baseCurrency))
    && isNonNegativeNumber(value.monthlyBudget)
    && isPositiveInteger(value.itemIdleAlertDays)
    && typeof value.notificationEnabled === 'boolean'
    && themeModes.has(String(value.themeMode ?? 'system'));
}

function seedCategories(): Category[] {
  const now = new Date().toISOString();
  return [
    { id: createId('cat'), name: '影音娱乐', color: '#8B5CF6', module: 'subscription', createdAt: now },
    { id: createId('cat'), name: '生产力', color: '#2563EB', module: 'subscription', createdAt: now },
    { id: createId('cat'), name: '数码设备', color: '#10B981', module: 'item', createdAt: now },
    { id: createId('cat'), name: '家居生活', color: '#F59E0B', module: 'item', createdAt: now },
  ];
}

function hydrateDatabase(value: unknown): WebDatabase {
  const source = isRecord(value) ? value : {};
  const categories = Array.isArray(source.categories) ? source.categories.filter(validCategory) : [];
  const subscriptions = Array.isArray(source.subscriptions)
    ? source.subscriptions.filter(validSubscription).map((subscription) => ({ ...subscription, status: subscription.status ?? 'active' }))
    : [];

  return {
    version: 3,
    categories: categories.length > 0 ? categories : seedCategories(),
    subscriptions,
    subscriptionRenewalLogs: Array.isArray(source.subscriptionRenewalLogs)
      ? source.subscriptionRenewalLogs.filter(validSubscriptionRenewalLog)
      : [],
    items: Array.isArray(source.items) ? source.items.filter(validItem) : [],
    itemUsageLogs: Array.isArray(source.itemUsageLogs) ? source.itemUsageLogs.filter(validItemUsageLog) : [],
    settings: validSettings(source.settings) ? { ...defaultSettings, ...source.settings } : defaultSettings,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function loadDatabase() {
  if (!databasePromise) {
    databasePromise = AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return hydrateDatabase(null);
      try {
        return hydrateDatabase(JSON.parse(raw));
      } catch {
        return hydrateDatabase(null);
      }
    });
  }
  return databasePromise;
}

async function readDatabase() {
  await writeQueue.catch(() => undefined);
  return loadDatabase();
}

async function updateDatabase(mutator: (database: WebDatabase) => void) {
  const operation = writeQueue.catch(() => undefined).then(async () => {
    const database = await loadDatabase();
    mutator(database);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  });
  writeQueue = operation;
  await operation;
}

function upsertById<T extends { id: string }>(items: T[], value: T) {
  const index = items.findIndex((item) => item.id === value.id);
  if (index === -1) items.push(value);
  else items[index] = value;
}

export async function migrateDatabase() {
  await updateDatabase(() => undefined);
}

export async function listCategories() {
  const database = await readDatabase();
  return clone([...database.categories].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}

export async function upsertCategory(category: Category) {
  await updateDatabase((database) => upsertById(database.categories, clone(category)));
}

export async function deleteCategory(id: string) {
  await updateDatabase((database) => {
    database.categories = database.categories.filter((category) => category.id !== id);
    database.subscriptions = database.subscriptions.map((subscription) => (
      subscription.categoryId === id ? { ...subscription, categoryId: undefined } : subscription
    ));
    database.items = database.items.map((item) => (
      item.categoryId === id ? { ...item, categoryId: undefined } : item
    ));
  });
}

export async function listSubscriptions() {
  const database = await readDatabase();
  return clone([...database.subscriptions].sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate)));
}

export async function saveSubscription(subscription: Subscription) {
  await updateDatabase((database) => upsertById(database.subscriptions, clone({ ...subscription, status: subscription.status ?? 'active' })));
}

export async function deleteSubscription(id: string) {
  await updateDatabase((database) => {
    database.subscriptions = database.subscriptions.filter((subscription) => subscription.id !== id);
    database.subscriptionRenewalLogs = database.subscriptionRenewalLogs.filter((log) => log.subscriptionId !== id);
  });
}

export async function listSubscriptionRenewalLogs() {
  const database = await readDatabase();
  return clone([...database.subscriptionRenewalLogs].sort((a, b) => (
    b.paidAt.localeCompare(a.paidAt) || b.createdAt.localeCompare(a.createdAt)
  )));
}

export async function saveSubscriptionRenewalLog(log: SubscriptionRenewalLog) {
  await updateDatabase((database) => upsertById(database.subscriptionRenewalLogs, clone(log)));
}

export async function renewSubscription(subscription: Subscription) {
  const nextPaymentDate = nextBillingDate(subscription.nextPaymentDate, subscription.billingCycle);
  await updateDatabase((database) => {
    upsertById(database.subscriptions, clone({ ...subscription, nextPaymentDate, status: 'active' }));
    upsertById(database.subscriptionRenewalLogs, {
      id: createId('renewal'),
      subscriptionId: subscription.id,
      paidAt: todayISO(),
      amount: subscription.price,
      currency: subscription.currency,
      nextPaymentDate,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function listItems() {
  const database = await readDatabase();
  return clone([...database.items].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)));
}

export async function saveItem(item: Item) {
  await updateDatabase((database) => upsertById(database.items, clone(item)));
}

export async function deleteItem(id: string) {
  await updateDatabase((database) => {
    database.items = database.items.filter((item) => item.id !== id);
    database.itemUsageLogs = database.itemUsageLogs.filter((log) => log.itemId !== id);
  });
}

export async function markItemUsed(item: Item) {
  const usedAt = todayISO();
  await updateDatabase((database) => {
    upsertById(database.items, clone({
      ...item,
      usageCount: item.usageCount + 1,
      lastUsedAt: usedAt,
      condition: item.condition === 'idle' ? 'used' : item.condition,
    }));
    upsertById(database.itemUsageLogs, {
      id: createId('usage'),
      itemId: item.id,
      usedAt,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function listItemUsageLogs() {
  const database = await readDatabase();
  return clone([...database.itemUsageLogs].sort((a, b) => (
    b.usedAt.localeCompare(a.usedAt) || b.createdAt.localeCompare(a.createdAt)
  )));
}

export async function saveItemUsageLog(log: ItemUsageLog) {
  await updateDatabase((database) => upsertById(database.itemUsageLogs, clone(log)));
}

export async function getSettings() {
  const database = await readDatabase();
  return clone(database.settings);
}

export async function saveSettings(settings: AppSettings) {
  await updateDatabase((database) => {
    database.settings = clone(settings);
  });
}

export async function exportSnapshot() {
  const database = await readDatabase();
  return clone({
    version: 3,
    exportedAt: new Date().toISOString(),
    categories: database.categories,
    subscriptions: database.subscriptions,
    subscriptionRenewalLogs: database.subscriptionRenewalLogs,
    items: database.items,
    itemUsageLogs: database.itemUsageLogs,
    settings: database.settings,
  });
}

export async function importSnapshot(payload: {
  categories?: Category[];
  subscriptions?: Subscription[];
  subscriptionRenewalLogs?: SubscriptionRenewalLog[];
  items?: Item[];
  itemUsageLogs?: ItemUsageLog[];
  settings?: AppSettings;
}) {
  if (!isRecord(payload)) throw new Error('Invalid snapshot');

  await updateDatabase((database) => {
    if (Array.isArray(payload.categories)) {
      for (const category of payload.categories.filter(validCategory)) upsertById(database.categories, clone(category));
    }
    if (Array.isArray(payload.subscriptions)) {
      for (const subscription of payload.subscriptions.filter(validSubscription)) {
        upsertById(database.subscriptions, clone({ ...subscription, status: subscription.status ?? 'active' }));
      }
    }
    if (Array.isArray(payload.subscriptionRenewalLogs)) {
      for (const log of payload.subscriptionRenewalLogs.filter(validSubscriptionRenewalLog)) {
        upsertById(database.subscriptionRenewalLogs, clone(log));
      }
    }
    if (Array.isArray(payload.items)) {
      for (const item of payload.items.filter(validItem)) upsertById(database.items, clone(item));
    }
    if (Array.isArray(payload.itemUsageLogs)) {
      for (const log of payload.itemUsageLogs.filter(validItemUsageLog)) upsertById(database.itemUsageLogs, clone(log));
    }
    if (validSettings(payload.settings)) database.settings = clone({ ...defaultSettings, ...payload.settings });
  });
}

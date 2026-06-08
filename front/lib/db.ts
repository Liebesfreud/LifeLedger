import * as SQLite from 'expo-sqlite';
import type { Category, Item, Subscription, AppSettings } from '@/types/domain';
import { createId, todayISO } from '@/lib/utils';

const DB_NAME = 'subtrack_mobile.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const defaultSettings: AppSettings = {
  baseCurrency: 'CNY',
  monthlyBudget: 500,
  itemIdleAlertDays: 45,
  notificationEnabled: true,
};

function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

function boolToInt(value: boolean) {
  return value ? 1 : 0;
}

function intToBool(value: number) {
  return value === 1;
}

export async function migrateDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      module TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      billingCycle TEXT NOT NULL,
      nextPaymentDate TEXT NOT NULL,
      categoryId TEXT,
      icon TEXT,
      description TEXT,
      notifyDaysBefore INTEGER NOT NULL,
      autoRenew INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      purchasePrice REAL NOT NULL,
      currency TEXT NOT NULL,
      purchaseDate TEXT NOT NULL,
      categoryId TEXT,
      location TEXT NOT NULL,
      condition TEXT NOT NULL,
      usageCount INTEGER NOT NULL,
      lastUsedAt TEXT,
      idleAlertDays INTEGER NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const categoryRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if ((categoryRows[0]?.count ?? 0) === 0) {
    const now = new Date().toISOString();
    const seeds: Category[] = [
      { id: createId('cat'), name: '影音娱乐', color: '#8B5CF6', module: 'subscription', createdAt: now },
      { id: createId('cat'), name: '生产力', color: '#2563EB', module: 'subscription', createdAt: now },
      { id: createId('cat'), name: '数码设备', color: '#10B981', module: 'item', createdAt: now },
      { id: createId('cat'), name: '家居生活', color: '#F59E0B', module: 'item', createdAt: now },
    ];
    for (const category of seeds) await upsertCategory(category);
  }

  const settingsRows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['app']);
  if (!settingsRows[0]) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['app', JSON.stringify(defaultSettings)]);
  }
}

export async function listCategories() {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY createdAt ASC');
}

export async function upsertCategory(category: Category) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO categories (id, name, color, module, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [category.id, category.name, category.color, category.module, category.createdAt],
  );
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  await db.runAsync('UPDATE subscriptions SET categoryId = NULL WHERE categoryId = ?', [id]);
  await db.runAsync('UPDATE items SET categoryId = NULL WHERE categoryId = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function listSubscriptions() {
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<Subscription, 'autoRenew'> & { autoRenew: number }>('SELECT * FROM subscriptions ORDER BY nextPaymentDate ASC');
  return rows.map((row) => ({ ...row, autoRenew: intToBool(Number(row.autoRenew)) }));
}

export async function saveSubscription(subscription: Subscription) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO subscriptions (id, name, price, currency, billingCycle, nextPaymentDate, categoryId, icon, description, notifyDaysBefore, autoRenew, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subscription.id,
      subscription.name,
      subscription.price,
      subscription.currency,
      subscription.billingCycle,
      subscription.nextPaymentDate,
      subscription.categoryId ?? null,
      subscription.icon ?? null,
      subscription.description ?? null,
      subscription.notifyDaysBefore,
      boolToInt(subscription.autoRenew),
      subscription.createdAt,
    ],
  );
}

export async function deleteSubscription(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

export async function listItems() {
  const db = await getDb();
  return db.getAllAsync<Item>('SELECT * FROM items ORDER BY purchaseDate DESC');
}

export async function saveItem(item: Item) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO items (id, name, purchasePrice, currency, purchaseDate, categoryId, location, condition, usageCount, lastUsedAt, idleAlertDays, note, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.name,
      item.purchasePrice,
      item.currency,
      item.purchaseDate,
      item.categoryId ?? null,
      item.location,
      item.condition,
      item.usageCount,
      item.lastUsedAt ?? null,
      item.idleAlertDays,
      item.note ?? null,
      item.createdAt,
    ],
  );
}

export async function deleteItem(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
}

export async function markItemUsed(item: Item) {
  await saveItem({ ...item, usageCount: item.usageCount + 1, lastUsedAt: todayISO(), condition: item.condition === 'idle' ? 'used' : item.condition });
}

export async function getSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['app']);
  return rows[0]?.value ? { ...defaultSettings, ...JSON.parse(rows[0].value) } as AppSettings : defaultSettings;
}

export async function saveSettings(settings: AppSettings) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['app', JSON.stringify(settings)]);
}

export async function exportSnapshot() {
  const [categories, subscriptions, items, settings] = await Promise.all([listCategories(), listSubscriptions(), listItems(), getSettings()]);
  return { version: 1, exportedAt: new Date().toISOString(), categories, subscriptions, items, settings };
}

export async function importSnapshot(payload: { categories?: Category[]; subscriptions?: Subscription[]; items?: Item[]; settings?: AppSettings }) {
  if (payload.categories) for (const category of payload.categories) await upsertCategory(category);
  if (payload.subscriptions) for (const subscription of payload.subscriptions) await saveSubscription(subscription);
  if (payload.items) for (const item of payload.items) await saveItem(item);
  if (payload.settings) await saveSettings(payload.settings);
}

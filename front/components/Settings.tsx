
import React, { useState } from 'react';
import { useApp } from '../App';
import { StorageService } from '../services/storageService';
import { Download, Upload, Send, Shield, User, Lock, Save, Palette, Cloud, CheckCircle2, AlertTriangle, Wifi, RefreshCcw, Plus, Trash2, Edit2 } from 'lucide-react';

const COLOR_PRESETS = ['#3b82f6', '#0ea5e9', '#10b981', '#14b8a6', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1'];

const SettingsSection = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 transition-all hover:shadow-md">
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      {Icon && <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary"><Icon size={20} /></div>}
      {title}
    </h3>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const { settings, updateSettings, t, refreshData, categories } = useApp();
  const [testMsgStatus, setTestMsgStatus] = useState<string>('');

  // Account State
  const [newUsername, setNewUsername] = useState(settings.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');

  // Rates
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [ratesError, setRatesError] = useState('');

  // Category management
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const isDbConfigured = StorageService.isSupabaseConfigured();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      StorageService.importData(e.target.files[0], (success) => {
        if (success) {
          alert("Import Successful!");
          refreshData();
        } else {
          alert("Import Failed.");
        }
      });
    }
  };

  const handleUpdateAccount = async () => {
    setAccountMsg('');
    if (!newUsername) return;

    const success = await StorageService.updateAccount(
      newUsername !== settings.username ? newUsername : undefined,
      newPassword || undefined,
      newPassword ? currentPassword : undefined
    );

    if (success) {
      setAccountMsg(t.usernameUpdated);
      if (newUsername !== settings.username) {
        updateSettings({ ...settings, username: newUsername });
      }
      setNewPassword('');
      setCurrentPassword('');
    } else {
      setAccountMsg(t.loginFailed || 'Update failed');
    }
  };

  const handleRefreshRates = async (baseCurrency?: string) => {
    setRatesError('');
    setIsRefreshingRates(true);
    try {
      const updated = await StorageService.refreshRates(baseCurrency as any);
      if (updated) {
        updateSettings(updated);
      }
    } catch (e: any) {
      setRatesError(t.rateFetchFailed || e?.message || 'Failed');
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleAddOrUpdateCategory = async () => {
    if (!newCatName.trim()) return;

    if (editingCatId) {
      // Update existing
      const updatedCats = categories.map(c =>
        c.id === editingCatId ? { ...c, name: newCatName.trim(), color: newCatColor } : c
      );
      await StorageService.saveCategories(updatedCats);
      setEditingCatId(null);
    } else {
      // Add new
      const newCat = {
        id: `cat_${Date.now()}`,
        name: newCatName.trim(),
        color: newCatColor
      };
      await StorageService.saveCategories([...categories, newCat]);
    }

    refreshData();
    setNewCatName('');
    setNewCatColor(COLOR_PRESETS[0]);
  };

  const handleEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatColor(cat.color);
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setNewCatName('');
    setNewCatColor(COLOR_PRESETS[0]);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm(t.confirmDelete || "Delete this category?")) {
      const remain = categories.filter(c => c.id !== id);
      await StorageService.saveCategories(remain);
      refreshData();
      if (editingCatId === id) handleCancelEdit();
    }
  };

  const sendTestMessage = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      setTestMsgStatus("Please configure Token and Chat ID first.");
      return;
    }

    setTestMsgStatus("Sending...");
    try {
      const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: settings.notificationStyle === 'detailed'
            ? "🔔 *SubTrack Notification System*\n\nYour notification settings are configured correctly.\nStatus: ✅ Active"
            : "🔔 SubTrack: Test Notification",
          parse_mode: 'Markdown'
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setTestMsgStatus("Success! Check your Telegram.");
      } else {
        setTestMsgStatus(`Error: ${data.description}`);
      }
    } catch (error) {
      setTestMsgStatus("Network Error.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">{t.settings}</h2>

      {/* Cloud Status */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-3 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
        <Wifi size={20} />
        <span className="font-medium text-sm">
          {isDbConfigured ? "Cloud Sync Active (Auto-save enabled)" : "Cloud Database Not Configured"}
        </span>
      </div>

      {/* Account Security */}
      <SettingsSection title={t.accountSecurity} icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.changeUsername}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.currentPassword}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.currentPassword}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.newPassword}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className={`text-sm font-medium ${accountMsg.includes('Success') || accountMsg.includes('updated') ? 'text-green-500' : 'text-red-500'}`}>{accountMsg}</p>
          <button
            onClick={handleUpdateAccount}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Save size={18} /> {t.update}
          </button>
        </div>
      </SettingsSection>

      {/* Theme */}
      <SettingsSection title={t.theme} icon={Palette}>
        <div className="space-y-3">
          <span className="text-gray-700 dark:text-gray-300 font-medium block">{t.primaryColor}</span>
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden w-12 h-12 rounded-full ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700 dark:ring-offset-[#1e1e1e]">
              <input
                type="color"
                value={settings.themeColor}
                onChange={(e) => updateSettings({ ...settings, themeColor: e.target.value })}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0"
              />
            </div>
            <span className="text-sm font-mono text-gray-500 bg-gray-100 dark:bg-[#252525] px-3 py-1 rounded-lg">{settings.themeColor}</span>
          </div>
        </div>
      </SettingsSection>

      {/* Currency & Rates */}
      <SettingsSection title={`${t.currencyRatesLabel || 'Exchange Rates'}`} icon={Cloud}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.baseCurrency}</label>
            <div className="flex gap-2 items-center">
              <select
                value={settings.baseCurrency || 'CNY'}
                onChange={(e) => {
                  const newBase = e.target.value as any;
                  const nextRates = { ...(settings.currencyRates || {}), [newBase]: 1 };
                  updateSettings({ ...settings, baseCurrency: newBase, currencyRates: nextRates });
                }}
                className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              >
                {['CNY', 'USD', 'EUR', 'GBP', 'JPY'].map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
              <button
                onClick={() => handleRefreshRates()}
                disabled={isRefreshingRates}
                className="px-4 py-3 rounded-xl bg-primary text-white font-medium flex items-center gap-2 shadow-sm active:scale-95 transition"
              >
                <RefreshCcw size={16} className={isRefreshingRates ? "animate-spin" : ""} /> {t.refreshRates}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.lastUpdated}: {settings.ratesUpdatedAt || '--'}</p>
            {ratesError && <p className="text-sm text-red-500">{ratesError}</p>}
          </div>
          <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl p-4 border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto custom-scrollbar">
            <div className="text-xs font-semibold text-gray-500 mb-2">{t.currencyRatesLabel}</div>
            <div className="space-y-1">
              {Object.entries(settings.currencyRates || {}).map(([k, v]) => {
                const num = typeof v === 'number' ? v : Number(v || 0);
                return (
                  <div key={k} className="flex justify-between text-sm text-gray-700 dark:text-gray-200">
                    <span>{k}</span>
                    <span className="font-mono">{num.toFixed(4)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Category Management */}
      <SettingsSection title={t.categoryManagement} icon={Palette}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{editingCatId ? (t.editCategory || 'Edit Category') : t.addCategory}</label>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t.categoryName}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCatColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition ${newCatColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddOrUpdateCategory}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                >
                  {editingCatId ? <Save size={18} /> : <Plus size={18} />}
                  {editingCatId ? (t.save || 'Save') : t.addCategory}
                </button>
                {editingCatId && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-3 bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#444] transition-colors"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl p-4 border border-gray-200 dark:border-gray-700 max-h-64 overflow-auto custom-scrollbar">
            <div className="text-xs font-semibold text-gray-500 mb-2">{t.categoryManagement}</div>
            {categories.length === 0 && <p className="text-sm text-gray-500">{t.noSubscriptions}</p>}
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${editingCatId === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-[#1e1e1e] border-gray-100 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleEditCategory(cat)}>
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm text-gray-800 dark:text-white font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Telegram Notifications */}
      <SettingsSection title={t.telegramSettings} icon={Send}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.botToken}</label>
              <input
                type="text"
                value={settings.telegramBotToken || ''}
                onChange={(e) => updateSettings({ ...settings, telegramBotToken: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary placeholder-gray-400 font-mono text-sm"
                placeholder="123456789:ABC..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.chatId}</label>
              <input
                type="text"
                value={settings.telegramChatId || ''}
                onChange={(e) => updateSettings({ ...settings, telegramChatId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary placeholder-gray-400 font-mono text-sm"
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.notificationStyle}</label>
              <div className="flex bg-gray-50 dark:bg-[#252525] p-1 rounded-xl">
                <button
                  onClick={() => updateSettings({ ...settings, notificationStyle: 'simple' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.notificationStyle === 'simple' ? 'bg-white dark:bg-[#333] shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  {t.simple}
                </button>
                <button
                  onClick={() => updateSettings({ ...settings, notificationStyle: 'detailed' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.notificationStyle === 'detailed' ? 'bg-white dark:bg-[#333] shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  {t.detailed}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.defaultNotifyDays}</label>
              <input
                type="number"
                value={settings.defaultNotifyDays || 3}
                onChange={(e) => updateSettings({ ...settings, defaultNotifyDays: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4">
            <span className="text-sm text-gray-500">{testMsgStatus}</span>
            <button
              onClick={sendTestMessage}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Send size={18} />
              {t.sendTest}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Email Notifications */}
      <SettingsSection title={t.emailNotifications} icon={Send}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={settings.emailSettings?.enabled || false}
              onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, enabled: e.target.checked } as any })}
              className="w-5 h-5 rounded text-primary focus:ring-primary"
            />
            <span className="font-medium text-gray-700 dark:text-gray-200">{t.enableEmail}</span>
          </div>

          {settings.emailSettings?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.smtpServer}</label>
                <input
                  type="text"
                  value={settings.emailSettings?.smtpServer || ''}
                  onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpServer: e.target.value } as any })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.smtpPort}</label>
                <input
                  type="number"
                  value={settings.emailSettings?.smtpPort || 587}
                  onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpPort: parseInt(e.target.value) } as any })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.smtpUser}</label>
                <input
                  type="text"
                  value={settings.emailSettings?.smtpUser || ''}
                  onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpUser: e.target.value } as any })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.smtpPassword}</label>
                <input
                  type="password"
                  value={settings.emailSettings?.smtpPassword || ''}
                  onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpPassword: e.target.value } as any })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.fromEmail}</label>
                <input
                  type="email"
                  value={settings.emailSettings?.fromEmail || ''}
                  onChange={(e) => updateSettings({ ...settings, emailSettings: { ...settings.emailSettings, fromEmail: e.target.value } as any })}
                  placeholder="noreply@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Budget Settings */}
      <SettingsSection title={t.budgetSettings} icon={Shield}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.monthlyBudgetLimit} ({settings.baseCurrency})</label>
          <input
            type="number"
            value={settings.monthlyBudget || ''}
            onChange={(e) => updateSettings({ ...settings, monthlyBudget: parseFloat(e.target.value) })}
            placeholder="Enter amount..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#252525] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-gray-500">{t.budgetDesc}</p>
        </div>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection title={t.dataManagement} icon={Download}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={StorageService.exportData}
            className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-gray-600 dark:text-gray-300 group"
          >
            <Download size={24} className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block font-bold">{t.exportData}</span>
              <span className="text-xs opacity-70">JSON format</span>
            </div>
          </button>

          <div className="relative group">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-green-500 group-hover:bg-green-50 dark:group-hover:bg-green-900/10 transition-all text-gray-600 dark:text-gray-300">
              <Upload size={24} className="group-hover:scale-110 transition-transform group-hover:text-green-500" />
              <div className="text-left">
                <span className="block font-bold group-hover:text-green-600 dark:group-hover:text-green-400">{t.importData}</span>
                <span className="text-xs opacity-70">Restore backup</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default Settings;

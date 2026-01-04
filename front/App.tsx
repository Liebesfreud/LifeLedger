
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Settings as SettingsIcon, Menu, X, Bell, LogOut, Sun, Moon, Languages, Loader2 } from 'lucide-react';
import { Subscription, Category, UserSettings, NotificationLog } from './types';
import { StorageService } from './services/storageService';
import { TRANSLATIONS, DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import SubscriptionList from './components/SubscriptionList';
import Settings from './components/Settings';

// --- Context ---
interface AppContextType {
  subscriptions: Subscription[];
  categories: Category[];
  settings: UserSettings;
  logs: NotificationLog[];
  refreshData: () => void;
  updateSettings: (newSettings: UserSettings) => void;
  t: any;
  isLoggedIn: boolean;
  login: (u: string, p: string) => Promise<string | null>;
  register: (u: string, p: string) => Promise<string | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Main Layout Components ---
const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 relative overflow-hidden group ${active
      ? 'bg-primary text-on-primary font-medium shadow-md shadow-primary/20'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
  >
    <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? 'opacity-10' : ''}`} />
    <Icon size={20} className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="relative z-10">{label}</span>
  </Link>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { t, logout, settings, updateSettings } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    updateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const toggleLanguage = () => {
    updateSettings({ ...settings, language: settings.language === 'zh' ? 'en' : 'zh' });
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#121212] transition-colors duration-500 ease-in-out">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}>
        <div className="p-8 flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white font-sans">SubTrack</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem
            to="/"
            icon={LayoutDashboard}
            label={t.dashboard}
            active={location.pathname === '/'}
          />
          <SidebarItem
            to="/subscriptions"
            icon={CreditCard}
            label={t.subscriptions}
            active={location.pathname === '/subscriptions'}
          />
          <SidebarItem
            to="/settings"
            icon={SettingsIcon}
            label={t.settings}
            active={location.pathname === '/settings'}
          />
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-4 bg-white dark:bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-all active:scale-95"
              title={settings.darkMode ? "Light Mode" : "Dark Mode"}
            >
              {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm font-medium">{settings.darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-all active:scale-95"
            >
              <Languages size={18} />
              <span className="text-sm font-medium">{settings.language === 'zh' ? 'EN' : 'CN'}</span>
            </button>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group justify-center active:scale-95"
          >
            <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 md:hidden transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-lg active:bg-gray-100 dark:active:bg-gray-800">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-gray-800 dark:text-white">SubTrack</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative custom-scrollbar">
          <div className="max-w-[1920px] mx-auto p-4 md:p-6 w-full min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Auth Component ---
const LoginScreen = () => {
  const { login, register, t } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const result = await register(username, password);
        if (result === null) {
          // Auto login after register
          const loginErr = await login(username, password);
          if (loginErr) {
            setMsg(t.accountCreated);
            setIsRegister(false);
            setPassword('');
          }
        } else {
          setError(result);
        }
      } else {
        const errorMsg = await login(username, password);
        if (errorMsg) {
          setError(errorMsg); // Use the message from server
        }
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 transition-colors duration-500">
      <div className="bg-white dark:bg-[#1e1e1e] p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-blue-500/10 max-w-md w-full border border-gray-100 dark:border-gray-800 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/40">S</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">SubTrack</h2>
          <p className="text-gray-500 dark:text-gray-400">{isRegister ? 'Create your account' : t.welcome}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block px-4 py-4 w-full text-gray-900 bg-gray-50 dark:bg-[#2d2d2d] dark:text-white rounded-xl border-transparent focus:border-blue-500 focus:ring-0 focus:bg-white dark:focus:bg-[#2d2d2d] peer transition-all duration-200 placeholder-transparent"
                placeholder="Username"
                id="floating_user"
                disabled={isLoading}
              />
              <label htmlFor="floating_user" className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-500">
                Username
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block px-4 py-4 w-full text-gray-900 bg-gray-50 dark:bg-[#2d2d2d] dark:text-white rounded-xl border-transparent focus:border-blue-500 focus:ring-0 focus:bg-white dark:focus:bg-[#2d2d2d] peer transition-all duration-200 placeholder-transparent"
                placeholder="Password"
                id="floating_pass"
                disabled={isLoading}
              />
              <label htmlFor="floating_pass" className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-500">
                Password
              </label>
            </div>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center animate-pulse">{error}</div>}
          {msg && <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm font-medium text-center">{msg}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {isLoading && <Loader2 size={20} className="animate-spin" />}
            {isRegister ? t.register : t.login}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); setMsg(''); }}
              disabled={isLoading}
              className="ml-2 font-bold text-primary hover:underline focus:outline-none"
            >
              {isRegister ? t.login : t.register}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- App Provider & Root ---
export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data from Memory (synced from Cloud)
  const refreshData = () => {
    if (!StorageService.isLoggedIn()) return;
    setSubscriptions(StorageService.getSubscriptions());
    setCategories(StorageService.getCategories());
    setLogs(StorageService.getLogs());
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
    applyTheme(savedSettings);
  };

  const applyTheme = (s: UserSettings) => {
    if (s.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.setProperty('--primary-color', s.themeColor);
  };

  const updateSettings = (newSettings: UserSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    applyTheme(newSettings);
  };

  const login = async (u: string, p: string): Promise<string | null> => {
    const result = await StorageService.login({ username: u, password: p });
    if (result.success) {
      setIsLoggedIn(true);
      refreshData();
      StorageService.subscribeToRealtime(refreshData);
      return null;
    }
    return result.message || 'Login failed';
  };

  const register = async (u: string, p: string): Promise<string | null> => {
    const result = await StorageService.register({ username: u, password: p });
    if (result.success) {
      return null;
    }
    return result.message || 'Registration failed';
  };

  const logout = () => {
    StorageService.logout();
    setIsLoggedIn(false);
    setSubscriptions([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.zh;

  // Restore login session
  useEffect(() => {
    const init = async () => {
      const success = await StorageService.restoreSession();
      if (success) {
        setIsLoggedIn(true);
        refreshData();
        StorageService.subscribeToRealtime(refreshData);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const value = {
    subscriptions,
    categories,
    settings,
    logs,
    refreshData,
    updateSettings,
    t,
    isLoggedIn,
    login,
    register,
    logout
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AppContext.Provider value={value}>
        <LoginScreen />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subscriptions" element={<SubscriptionList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
}

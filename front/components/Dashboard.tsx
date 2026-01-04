
import React, { useMemo } from 'react';
import { useApp } from '../App';
import { getMonthlyCost } from '../services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, AlertCircle, Bell } from 'lucide-react';
import CalendarView from './CalendarView';
import { subMonths, format, startOfMonth, startOfDay, isSameDay } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="relative z-10">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
    <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-20 bg-')} ${color.replace('bg-', 'text-')}`}>
      <Icon size={24} />
    </div>
  </div>
);

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const Dashboard = () => {
  const { subscriptions, settings, categories, logs, t } = useApp();
  const baseSymbol = CURRENCY_SYMBOLS[settings.baseCurrency || 'CNY'] || '';

  // Statistics Calculation
  const stats = useMemo(() => {
    let monthlyTotal = 0;

    subscriptions.forEach(sub => {
      monthlyTotal += getMonthlyCost(sub, settings);
    });

    return {
      monthly: monthlyTotal.toFixed(2),
      yearly: (monthlyTotal * 12).toFixed(2),
      count: subscriptions.length
    };
  }, [subscriptions, settings.currencyRates]);

  // Upcoming Renewals
  const upcoming = useMemo(() => {
    return subscriptions.map(sub => {
      const nextDate = new Date(sub.nextPaymentDate);
      const diffTime = nextDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...sub, daysLeft: diffDays, nextDate };
    })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5); // Take top 5
  }, [subscriptions]);

  // Chart Data: Cost by Category
  const pieData = useMemo(() => {
    const data: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const cat = categories.find(c => c.id === sub.categoryId)?.name || t.uncategorized;
      const monthlyVal = getMonthlyCost(sub, settings);
      data[cat] = (data[cat] || 0) + monthlyVal;
    });
    return Object.keys(data).map(key => ({ name: key, value: parseFloat(data[key].toFixed(2)) }));
  }, [subscriptions, categories, settings, t.uncategorized]);

  // Chart Data: Spending Trends (Last 6 Months)
  // Logic: For each of the last 6 months, sum up the cost of active subscriptions.
  // Note: This is an estimation based on current subscriptions.
  const trendsData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(today, i);
      const monthLabel = format(d, 'MMM');
      // Calculate total cost for this month
      // For simplicity in this demo, we assume all current recurrent subscriptions were active.
      // A more accurate history would need transaction logs.
      let total = 0;
      subscriptions.forEach(sub => {
        total += getMonthlyCost(sub, settings);
      });
      data.push({ name: monthLabel, amount: parseFloat(total.toFixed(2)) });
    }
    return data;
  }, [subscriptions, settings]);

  const budgetCard = settings.monthlyBudget && settings.monthlyBudget > 0 ? (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.monthlyBudget}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            <span className={Number(stats.monthly) > settings.monthlyBudget ? "text-red-500" : ""}>
              {((Number(stats.monthly) / settings.monthlyBudget) * 100).toFixed(0)}%
            </span>
          </h3>
        </div>
        <div className={`p-2 rounded-xl ${Number(stats.monthly) > settings.monthlyBudget ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          <AlertCircle size={20} />
        </div>
      </div>

      <div className="space-y-2 z-10">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{baseSymbol}{stats.monthly}</span>
          <span>{baseSymbol}{settings.monthlyBudget}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-[#333] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${Number(stats.monthly) > settings.monthlyBudget
              ? 'bg-red-500'
              : Number(stats.monthly) > settings.monthlyBudget * 0.9
                ? 'bg-yellow-500'
                : 'bg-green-500'
              }`}
            style={{ width: `${Math.min((Number(stats.monthly) / (settings.monthlyBudget || 1)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.dashboard}</h2>

      {/* Row 1: Top Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${budgetCard ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4`}>
        <StatCard
          title={t.monthlyCost}
          value={`${baseSymbol}${stats.monthly}`}
          sub="Estimated"
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title={t.yearlyCost}
          value={`${baseSymbol}${stats.yearly}`}
          sub="Projected"
          icon={Calendar}
          color="bg-purple-500"
        />
        <StatCard
          title={t.activeSubs}
          value={stats.count}
          sub="Total"
          icon={AlertCircle}
          color="bg-green-500"
        />
        {budgetCard}
      </div>

      {/* Row 2: Charts & Calendar - Fixed Height Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch h-auto lg:min-h-[450px]">

        {/* Cost Distribution (1 Col) */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">{t.costDistribution}</h3>
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar (2 Cols) */}
        <div className="lg:col-span-2 h-full">
          <CalendarView />
        </div>

        {/* Upcoming (1 Col) */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-hidden">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">{t.upcomingRenewals}</h3>
          <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {upcoming.length === 0 && <p className="text-gray-400 text-sm">{t.noSubscriptions}</p>}
            {upcoming.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{sub.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {sub.nextDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs font-bold ${sub.daysLeft <= 3 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {sub.daysLeft}d
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {sub.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Trends & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[250px]">
        {/* Spending Trends (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">{t.spendingTrends}</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis
                  hide
                />
                <ReTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notification Log (1 Col) */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-hidden">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <Bell size={16} /> {t.notificationLog}
          </h3>
          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
            <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td className="px-2 py-4 text-center">No logs.</td>
                  </tr>
                )}
                {logs.slice(0, 10).map(log => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252525]">
                    <td className="px-2 py-2">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-[80px]" title={log.subscriptionName}>{log.subscriptionName}</div>
                      <div className="text-[10px] text-gray-400">{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

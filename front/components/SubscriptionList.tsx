
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { Subscription, Category, Currency } from '../types';
import { StorageService, getPreviousPaymentDate, addOneCycle } from '../services/storageService';
import { ICONS } from '../constants';
import * as LucideIcons from 'lucide-react';
import { Search, Plus, Grid, List, Trash2, Edit2, X, ChevronDown, Repeat, Clock, CalendarDays } from 'lucide-react';

const COLOR_PRESETS = ['#3b82f6', '#0ea5e9', '#10b981', '#14b8a6', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1'];

// Dynamic Icon Component
const IconRenderer = ({ name, size = 20, className = "" }: any) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Zap;
  return <Icon size={size} className={className} />;
};

// --- Reusable UI Components ---

const MDInput = ({ label, value, onChange, type = "text", placeholder = " ", required = false, rows = 1, className = "" }: any) => (
  <div className="relative group w-full">
    {rows > 1 ? (
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className={`block px-4 py-3.5 w-full text-gray-900 bg-gray-50 dark:bg-[#252525] dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none peer transition-all placeholder-transparent resize-none ${className}`}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`block px-4 py-3.5 w-full text-gray-900 bg-gray-50 dark:bg-[#252525] dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none peer transition-all placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
        placeholder={placeholder}
      />
    )}
    <label className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] left-4 bg-transparent px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1.5 peer-placeholder-shown:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:top-2 peer-focus:text-primary pointer-events-none">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

const MDCustomSelect = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className="block px-4 py-3.5 w-full text-gray-900 bg-gray-50 dark:bg-[#252525] dark:text-white rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary/20 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
      >
        <span className="capitalize">{value}</span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </div>
      <label className="absolute text-xs text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] left-4 px-1">
        {label}
      </label>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#2d2d2d] border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors capitalize ${value === opt ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Helper for Progress Bar ---
const CycleProgress = ({ sub, compact = false }: { sub: Subscription, compact?: boolean }) => {
  const nextDate = new Date(sub.nextPaymentDate);
  const prevDate = getPreviousPaymentDate(nextDate, sub.billingCycle);
  const now = new Date();

  // Normalize time to midnight
  nextDate.setHours(0, 0, 0, 0);
  prevDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const totalDuration = nextDate.getTime() - prevDate.getTime();
  const remainingTime = nextDate.getTime() - now.getTime();

  // Calculate Remaining Percentage
  // If remainingTime = totalDuration -> 100%
  // If remainingTime = 0 -> 0%
  let percent = (remainingTime / totalDuration) * 100;
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  // Remaining days
  const daysLeft = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

  // Color Logic
  let barColor = 'bg-green-500'; // Default Safe
  if (percent < 10) {
    barColor = 'bg-red-500';
  } else if (percent < 30) {
    barColor = 'bg-yellow-500';
  }

  if (compact) {
    return (
      <div className="w-full max-w-[160px] flex flex-col items-start gap-1">
        <span className={`text-[10px] font-bold ${percent < 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {daysLeft < 0 ? 'Overdue' : `${daysLeft} days`}
        </span>
        <div className="h-1.5 w-full bg-gray-100 dark:bg-[#333] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-end mb-2">
        <span className={`text-xs font-bold ${percent < 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {daysLeft < 0 ? 'Overdue' : `${daysLeft} days left`}
        </span>
        <span className="text-[10px] text-gray-400">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-[#333] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// --- Main Component ---

const SubscriptionList = () => {
  const { subscriptions, categories, refreshData, t } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Subscription | null>(null);

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingSub, setRenewingSub] = useState<Subscription | null>(null);

  // Filter Logic
  const filteredSubs = subscriptions.filter(sub => {
    const matchCat = filterCategory === 'all' || sub.categoryId === filterCategory;
    const matchSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDeleteRequest = (sub: Subscription) => {
    setConfirmDeleteSub(sub);
  };

  const performDelete = async () => {
    if (!confirmDeleteSub) return;
    const newSubs = subscriptions.filter(s => s.id !== confirmDeleteSub.id);
    await StorageService.saveSubscriptions(newSubs);
    refreshData();
    setConfirmDeleteSub(null);
  };

  const openModal = (sub?: Subscription) => {
    setEditingSub(sub || null);
    setIsModalOpen(true);
  };

  const openRenewModal = (sub: Subscription) => {
    setRenewingSub(sub);
    setIsRenewModalOpen(true);
  };

  const handleRenewConfirm = async () => {
    if (!renewingSub) return;
    const newDate = addOneCycle(renewingSub.nextPaymentDate, renewingSub.billingCycle);

    const updated = subscriptions.map(s => {
      if (s.id === renewingSub.id) {
        return { ...s, nextPaymentDate: newDate };
      }
      return s;
    });
    await StorageService.saveSubscriptions(updated);
    refreshData();
    setIsRenewModalOpen(false);
    setRenewingSub(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{t.subscriptions}</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none w-full md:w-64 text-sm text-gray-800 dark:text-white transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="bg-white dark:bg-[#2d2d2d] p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all font-medium text-sm active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden md:inline">{t.addSubscription}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-300 ${filterCategory === 'all'
            ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent shadow-md'
            : 'bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
            }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-300 flex items-center gap-2 ${filterCategory === cat.id
              ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent shadow-md'
              : 'bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
          >
            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: cat.color }}></div>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredSubs.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Search size={32} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No subscriptions found</p>
          <button onClick={() => openModal()} className="mt-4 text-primary font-medium hover:underline">{t.addSubscription}</button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
          {filteredSubs.map(sub => {
            const cat = categories.find(c => c.id === sub.categoryId);
            return (
              <div
                key={sub.id}
                className={`bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6 flex flex-col relative'
                  }`}
              >
                {viewMode === 'grid' && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openRenewModal(sub)} title={t.renew} className="p-2 bg-gray-50 dark:bg-[#333] shadow-sm rounded-xl text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Repeat size={16} />
                    </button>
                    <button onClick={() => openModal(sub)} className="p-2 bg-gray-50 dark:bg-[#333] shadow-sm rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteRequest(sub)} className="p-2 bg-gray-50 dark:bg-[#333] shadow-sm rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}

                <div className={`flex items-start gap-5 ${viewMode === 'list' ? 'flex-1' : 'mb-6'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform flex-shrink-0`} style={{ backgroundColor: cat?.color || '#9ca3af' }}>
                    <IconRenderer name={sub.icon} size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{sub.name}</h3>
                    {cat && <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mt-1 block">{cat.name}</span>}
                    {viewMode === 'grid' && sub.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{sub.description}</p>}
                  </div>
                </div>

                {viewMode === 'list' && (
                  <div className="flex-1 px-8">
                    <CycleProgress sub={sub} compact />
                  </div>
                )}

                <div className={viewMode === 'list' ? "text-right mr-6" : "mt-auto"}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {sub.currency === 'CNY' ? '¥' : sub.currency === 'USD' ? '$' : sub.currency} {sub.price}
                    </span>
                    <span className="text-sm font-medium text-gray-400">/ {sub.billingCycle}</span>
                  </div>
                </div>

                {viewMode === 'grid' && <CycleProgress sub={sub} />}

                {viewMode === 'list' && (
                  <div className="flex gap-2 ml-4 border-l pl-4 border-gray-200 dark:border-gray-700">
                    <button onClick={() => openRenewModal(sub)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Repeat size={18} /></button>
                    <button onClick={() => openModal(sub)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => handleDeleteRequest(sub)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Renew Modal */}
      {isRenewModalOpen && renewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsRenewModalOpen(false)}>
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] w-full max-w-sm shadow-2xl p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Repeat size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.renewTitle}</h3>
              <p className="text-sm text-gray-500 mt-2">{t.renewDesc}</p>
            </div>

            <div className="bg-gray-50 dark:bg-[#252525] p-4 rounded-xl mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Current</p>
                <p className="font-medium text-gray-900 dark:text-white">{renewingSub.nextPaymentDate}</p>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">New Date</p>
                <p className="font-bold text-green-600">{addOneCycle(renewingSub.nextPaymentDate, renewingSub.billingCycle)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsRenewModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 transition-colors">{t.cancel}</button>
              <button onClick={handleRenewConfirm} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">{t.confirmRenew}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setConfirmDeleteSub(null)}>
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.delete}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.confirmDelete}</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#252525] p-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 mb-4">
              {confirmDeleteSub.name}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteSub(null)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 transition">{t.cancel}</button>
              <button onClick={performDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/20">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <SubscriptionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingSub}
          allTags={Array.from(new Set(subscriptions.map(s => s.tags?.split(',').map(t => t.trim())).flat().filter(Boolean) as string[]))}
        />
      )}
    </div>
  );
};

// --- Form Component ---
const SubscriptionForm = ({ isOpen, onClose, initialData, allTags }: { isOpen: boolean, onClose: () => void, initialData: Subscription | null, allTags: string[] }) => {
  const { categories, refreshData, settings, t } = useApp();

  const [formData, setFormData] = useState<Partial<Subscription>>(initialData || {
    name: '',
    price: undefined,
    currency: 'CNY',
    billingCycle: 'monthly',
    nextPaymentDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
    icon: 'Zap',
    notifyDaysBefore: settings.defaultNotifyDays || 3,
    tags: ''
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [showCatInput, setShowCatInput] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!formData.name?.trim()) { setError("Name is required"); return; }
    if (!formData.price) { setError("Price is required"); return; }

    const { id: formId, ...restForm } = formData as any;
    const finalId = initialData?.id || formId || Date.now().toString();

    const newSub: Subscription = {
      id: finalId,
      ...(restForm as Partial<Subscription>),
      price: Number(formData.price),
      categoryId: formData.categoryId || ''
    };

    const currentSubs = StorageService.getSubscriptions();
    let updatedSubs;

    if (initialData) {
      updatedSubs = currentSubs.map(s => s.id === initialData.id ? newSub : s);
    } else {
      updatedSubs = [...currentSubs, newSub];
    }

    await StorageService.saveSubscriptions(updatedSubs);
    refreshData();
    onClose();
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName,
      color: newCatColor
    };
    const currentCats = StorageService.getCategories();
    await StorageService.saveCategories([...currentCats, newCat]);
    refreshData();
    setFormData(prev => ({ ...prev, categoryId: newCat.id }));
    setNewCatName('');
    setShowCatInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700 custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur z-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{initialData ? t.editSubscription : t.addSubscription}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"><X size={20} className="text-gray-500 dark:text-gray-300" /></button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{error}</div>}

          {/* Icon Picker (Optimized) */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">{t.chooseIcon}</label>
            <div className="grid grid-cols-9 gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${formData.icon === icon ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'bg-gray-50 dark:bg-[#252525] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]'}`}
                >
                  <IconRenderer name={icon} size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Main Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MDInput
              label={t.name}
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <MDInput
                label={t.price}
                type="number"
                value={formData.price}
                onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
                required
                className="font-mono text-lg"
              />
              <MDCustomSelect
                label={t.currency}
                value={formData.currency || 'CNY'}
                options={['CNY', 'USD', 'EUR', 'GBP', 'JPY']}
                onChange={(v) => setFormData({ ...formData, currency: v as Currency })}
              />
            </div>

            <MDCustomSelect
              label={t.cycle}
              value={formData.billingCycle || 'monthly'}
              options={['weekly', 'monthly', 'quarterly', 'yearly']}
              onChange={(v) => setFormData({ ...formData, billingCycle: v as any })}
            />
            <MDInput
              label={t.nextPaymentDate}
              type="date"
              value={formData.nextPaymentDate}
              onChange={(e: any) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
            />
          </div>

          {/* Description & Tags */}
          <MDInput
            label={t.description}
            rows={2}
            value={formData.description || ''}
            onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t.tags}</label>
            <input
              type="text"
              value={formData.tags || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="block px-4 py-3.5 w-full text-gray-900 bg-gray-50 dark:bg-[#252525] dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              placeholder={t.tagsPlaceholder}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
                    if (!currentTags.includes(tag)) {
                      setFormData({ ...formData, tags: [...currentTags, tag].join(', ') })
                    }
                  }}
                  className="text-xs bg-gray-100 dark:bg-[#333] px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#444]"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.category}</label>
              {!showCatInput && <button onClick={() => setShowCatInput(true)} className="text-primary text-sm font-medium hover:underline">+ {t.createNewCategory}</button>}
            </div>

            {showCatInput && (
              <div className="w-full mb-4 animate-in fade-in slide-in-from-top-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                    placeholder={t.categoryName}
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                  />
                  <button onClick={handleCreateCategory} className="bg-primary text-white px-4 rounded-xl font-medium shadow-md shadow-primary/20">{t.save}</button>
                  <button onClick={() => setShowCatInput(false)} className="text-gray-500 px-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-xl"><X size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${newCatColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, categoryId: '' })}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${!formData.categoryId
                  ? 'border-gray-800 bg-gray-800 text-white dark:border-white dark:bg-white dark:text-black shadow-md'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 bg-white dark:bg-[#252525]'
                  }`}
              >
                {t.uncategorized}
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-2 ${formData.categoryId === cat.id
                    ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary shadow-sm ring-1 ring-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 bg-white dark:bg-[#252525]'
                    }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50 dark:bg-[#252525] sticky bottom-0 z-10">
          <button onClick={onClose} className="px-8 py-3 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors">{t.cancel}</button>
          <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all">{t.save}</button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionList;

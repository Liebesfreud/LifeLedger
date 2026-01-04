import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Subscription } from '../types';
import { useApp } from '../App';

const CalendarView = () => {
    const { subscriptions, settings, categories } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Generate 42 days (6 weeks) to ensure stable height
    const startOfCurrentMonth = startOfMonth(currentDate);
    // Find the start date of the grid (Sunday before or on startOfMonth)
    // Assuming 0=Sunday
    const startOfGrid = new Date(startOfCurrentMonth);
    startOfGrid.setDate(startOfCurrentMonth.getDate() - getDay(startOfCurrentMonth));

    const calendarConsole = [];
    // Generate 42 days
    for (let i = 0; i < 42; i++) {
        const d = new Date(startOfGrid);
        d.setDate(startOfGrid.getDate() + i);
        calendarConsole.push(d);
    }

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    // Helper to find subs for a day
    const getSubsForDay = (date: Date) => {
        return subscriptions.filter(sub => {
            if (!sub.nextPaymentDate) return false;
            const nextPay = new Date(sub.nextPaymentDate);
            return isSameDay(nextPay, date);
        });
    };

    return (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition">
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
                {calendarConsole.map(day => {
                    const daySubs = getSubsForDay(day);
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                    return (
                        <div
                            key={day.toISOString()}
                            className={`relative p-1 md:p-2 rounded-xl border transition-all hover:shadow-md group h-full flex flex-col
                ${isTodayDate
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                    : isCurrentMonth
                                        ? 'bg-white dark:bg-[#252525] border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                        : 'bg-gray-50/30 dark:bg-[#252525]/30 border-transparent opacity-50'
                                }
              `}
                        >
                            <div className={`text-xs md:text-sm font-medium mb-1 ${isTodayDate ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                {format(day, 'd')}
                            </div>

                            <div className="flex flex-wrap gap-1 content-start">
                                {daySubs.map(sub => {
                                    // Find category color if available
                                    const category = categories.find(cat => cat.id === sub.categoryId);
                                    const dotColor = category?.color || settings.themeColor || '#ccc'; // Fallback to themeColor, then default grey
                                    return (
                                        <div key={sub.id} className="relative group/sub">
                                            <div
                                                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                                                style={{ backgroundColor: dotColor }}
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sub:block z-10 w-max max-w-[150px]">
                                                <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-2 shadow-xl whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {sub.name} - {sub.price} {sub.currency}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {daySubs.length > 0 && (
                                    <div className="w-full mt-1 hidden lg:block">
                                        {daySubs.slice(0, 1).map(sub => (
                                            <div key={sub.id} className="text-[9px] leading-tight text-gray-500 truncate dark:text-gray-400">
                                                {sub.name}
                                            </div>
                                        ))}
                                        {daySubs.length > 1 && <div className="text-[9px] text-gray-300 leading-tight">+{daySubs.length - 1}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;

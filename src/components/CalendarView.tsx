import React, { useState } from 'react';
import { Game } from '../types';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface CalendarViewProps {
    games: Game[];
    onStartGame: (gameId: string) => void;
    onViewReport: (game: Game) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ games, onStartGame, onViewReport }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Helper to get local YYYY-MM-DD from an ISO or local string
    const getGameDateKey = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;

        // If the date string looks like YYYY-MM-DD (length 10 or starts with it), 
        // we should try to parse it without timezone shifting if it's potentially UTC
        if (dateStr.includes('T')) {
            // It has time, usually safe to use local components
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        } else {
            // It might be just a date string which JS parses as UTC
            // Correct way is to split and use parts if it matches YYYY-MM-DD
            const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return `${parseInt(match[1])}-${parseInt(match[2])}-${parseInt(match[3])}`;
            }
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        }
    };

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Get games for the current month using robust comparison
    const monthGames = games.filter(g => {
        const d = new Date(g.scheduledTime);
        if (isNaN(d.getTime())) return false;

        // Use local year and month if it has time, otherwise look at the string
        let gameYear, gameMonth;
        if (g.scheduledTime.includes('T')) {
            gameYear = d.getFullYear();
            gameMonth = d.getMonth();
        } else {
            const match = g.scheduledTime.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                gameYear = parseInt(match[1]);
                gameMonth = parseInt(match[2]) - 1;
            } else {
                gameYear = d.getFullYear();
                gameMonth = d.getMonth();
            }
        }
        return gameYear === year && gameMonth === month;
    });

    // Padding for first day
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-28 sm:h-36 border border-surface-border/20 opacity-20 bg-white/[0.01]"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayGames = monthGames
            .filter(g => {
                const key = getGameDateKey(g.scheduledTime);
                return key === `${year}-${month + 1}-${day}`;
            })
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        days.push(
            <div key={day} className={`h-28 sm:h-36 border border-surface-border/40 p-2 sm:p-4 group transition-all hover:bg-brand/5 relative overflow-hidden ${isToday ? 'bg-brand/10' : ''}`}>
                <div className="flex justify-between items-start relative z-10">
                    <span className={`text-xs font-mono font-bold ${isToday ? 'text-brand underline underline-offset-4 decoration-2' : 'text-gray-500 group-hover:text-white'}`}>
                        {day.toString().padStart(2, '0')}
                    </span>
                    {dayGames.length > 0 && (
                        <div className="flex -space-x-1">
                            {dayGames.map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(255,87,34,0.6)] animate-pulse"></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] custom-scrollbar relative z-10 pr-1">
                    {dayGames.map(game => (
                        <div
                            key={game.id}
                            className={`text-[8px] sm:text-[9px] font-mono p-1.5 rounded-sm border truncate cursor-pointer uppercase tracking-tighter transition-colors ${game.status === 'live' ? 'border-brand bg-brand text-black font-bold animate-pulse' :
                                game.status === 'finished' ? 'border-surface-border bg-surface-card/50 text-gray-500 hover:border-brand/40 hover:text-white' :
                                    'border-brand/20 bg-brand/5 text-gray-300 hover:border-brand/50 hover:bg-brand/10'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                game.status === 'finished' ? onViewReport(game) : onStartGame(game.id);
                            }}
                            title={`${game.homeTeam.name} vs ${game.awayTeam.name}`}
                        >
                            <span className="opacity-70">{game.homeTeam.name.split(' ')[0]}</span>
                            <span className="text-brand/50 px-1">v</span>
                            <span>{game.awayTeam.name.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>

                {isToday && (
                    <div className="absolute top-0 right-0 p-1 opacity-20">
                        <Activity className="w-6 h-6 text-brand" />
                    </div>
                )}
            </div>
        );
    }

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-card/30 p-6 border border-surface-border">
                <div className="flex items-center gap-6">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-brand/10 text-gray-400 hover:text-brand transition-all border border-transparent hover:border-brand/30"
                        title="PREV MONTH"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center sm:text-left min-w-[200px]">
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter leading-none flex items-baseline gap-3">
                            {monthName} <span className="text-brand">{year}</span>
                        </h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-1">GAME SCHEDULE</p>
                    </div>

                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-brand/10 text-gray-400 hover:text-brand transition-all border border-transparent hover:border-brand/30"
                        title="NEXT MONTH"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="ml-4 px-4 py-2 bg-brand/5 border border-brand/20 text-brand text-[8px] font-mono uppercase tracking-widest hover:bg-brand/10 transition-all"
                    >
                        Today
                    </button>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand"></div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Archive</span>
                    </div>
                </div>
            </div>

            <div className="cyber-card p-1">
                <div className="bg-black border border-surface-border overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-surface-border bg-surface-card/50">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center border-r last:border-r-0 border-surface-border">
                                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em]">{day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {days}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;

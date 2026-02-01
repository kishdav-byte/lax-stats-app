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

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Get games for the current month
    const monthGames = games.filter(g => {
        const d = new Date(g.scheduledTime);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    // Padding for first day
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 border border-surface-border/20 opacity-20 bg-white/[0.02]"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayGames = monthGames.filter(g => new Date(g.scheduledTime).getDate() === day);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        days.push(
            <div key={day} className={`h-24 sm:h-32 border border-surface-border/40 p-2 sm:p-4 group transition-all hover:bg-brand/5 relative overflow-hidden ${isToday ? 'bg-brand/5' : ''}`}>
                <div className="flex justify-between items-start relative z-10">
                    <span className={`text-xs font-mono font-bold ${isToday ? 'text-brand' : 'text-gray-500 group-hover:text-white'}`}>
                        {day.toString().padStart(2, '0')}
                    </span>
                    {dayGames.length > 0 && (
                        <div className="flex -space-x-1">
                            {dayGames.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(255,87,34,0.6)] animate-pulse"></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] custom-scrollbar relative z-10">
                    {dayGames.map(game => (
                        <div
                            key={game.id}
                            className={`text-[8px] sm:text-[9px] font-mono p-1 rounded-sm border truncate cursor-pointer uppercase tracking-tighter ${game.status === 'live' ? 'border-brand bg-brand/10 text-brand animate-pulse' :
                                    game.status === 'finished' ? 'border-surface-border bg-black/40 text-gray-500' :
                                        'border-brand/20 bg-white/5 text-gray-300'
                                }`}
                            onClick={() => game.status === 'finished' ? onViewReport(game) : onStartGame(game.id)}
                        >
                            {game.homeTeam.name.split(' ')[0]} v {game.awayTeam.name.split(' ')[0]}
                        </div>
                    ))}
                </div>

                {isToday && (
                    <div className="absolute bottom-0 right-0 p-1">
                        <Activity className="w-3 h-3 text-brand opacity-40" />
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
                    <button onClick={prevMonth} className="p-2 hover:bg-brand/10 text-gray-400 hover:text-brand transition-all border border-transparent hover:border-brand/30">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center sm:text-left min-w-[150px]">
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter leading-none">
                            {monthName} <span className="text-brand">{year}</span>
                        </h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-1">Orbit Cycle // Scheduled Events</p>
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-brand/10 text-gray-400 hover:text-brand transition-all border border-transparent hover:border-brand/30">
                        <ChevronRight className="w-5 h-5" />
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

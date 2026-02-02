import React from 'react';
import { Game, Role, Team } from '../types';
import { View } from '../services/storageService';
import { Activity, Calendar, Users, Volume2, ChevronRight, Binary, ShieldCheck } from 'lucide-react';

interface DashboardProps {
    games: Game[];
    teams: Team[];
    onStartGame: (gameId: string) => void;
    onViewChange: (view: View, preference?: any) => void;
    activeGameId: string | null;
    onViewReport: (game: Game) => void;
    userRole?: Role;
    managedTeamId: string | null;
    onManagedTeamChange: (teamId: string | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ games, teams, onStartGame, onViewChange, activeGameId, onViewReport, userRole, managedTeamId, onManagedTeamChange }) => {
    // Filter games by managed team if selected
    const filteredGames = managedTeamId
        ? games.filter(g => g.homeTeam.id === managedTeamId || (typeof g.awayTeam !== 'string' && g.awayTeam.id === managedTeamId))
        : games;

    // Sort upcoming: Earliest first (all scheduled, not just future)
    const upcomingGames = filteredGames
        .filter(g => g.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    // Sort finished: Latest first
    const finishedGames = filteredGames
        .filter(g => g.status === 'finished')
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

    const activeGame = games.find(g => g.id === activeGameId);

    return (
        <div className="space-y-12 pb-12">
            {/* Header Section */}
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase font-bold">Command Center</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
                        DASH<span className="text-brand">BOARD</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-3 opacity-60">Intelligent // Athletic // Systems // V4.2</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[280px]">
                    <p className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em]">Managed Team</p>
                    <div className="relative group">
                        <select
                            value={managedTeamId || ''}
                            onChange={(e) => onManagedTeamChange(e.target.value || null)}
                            className="w-full bg-surface-card border border-surface-border text-white px-4 py-3 text-[10px] font-mono uppercase tracking-widest outline-none appearance-none focus:border-brand transition-all cursor-pointer"
                        >
                            <option value="">ALL SYSTEMS ACTIVE</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Game Alert */}
            {activeGame && (
                <div className="cyber-card p-1 border-brand/50 bg-brand/5 animate-pulse">
                    <div className="bg-black p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand blur-xl opacity-30 rounded-full"></div>
                                <Activity className="relative w-10 h-10 text-brand" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Deployment Active</h2>
                                <p className="text-brand font-mono text-xs uppercase tracking-[0.2em] mt-1 font-bold">{activeGame.homeTeam.name} vs {activeGame.awayTeam.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onViewChange('game')}
                            className="cyber-button w-full md:w-auto px-12 py-4 flex items-center justify-center gap-3 font-display font-bold italic tracking-widest text-sm"
                        >
                            RESUME OPS <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Scheduled Games', value: upcomingGames.length, sub: 'Ready for Kickoff', icon: Calendar, onClick: () => onViewChange('schedule', { mode: 'calendar' }) },
                    { label: 'Completed Sets', value: finishedGames.length, sub: 'Performance Logged', icon: Binary, onClick: () => onViewChange('schedule') },
                    { label: 'System Status', value: 'ONLINE', sub: 'Secure & Synchronized', icon: ShieldCheck, onClick: () => onViewChange('globalSettings') }
                ].map((metric, i) => (
                    <div
                        key={i}
                        className="cyber-card p-8 flex flex-col justify-between min-h-[160px] group hover:border-brand transition-all cursor-pointer"
                        onClick={metric.onClick}
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold group-hover:text-brand transition-colors">{metric.label}</p>
                            <metric.icon className="w-5 h-5 text-brand opacity-20 group-hover:opacity-100 transition-all" />
                        </div>
                        <div>
                            <span className={`text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter ${typeof metric.value === 'string' ? 'text-2xl md:text-3xl' : ''}`}>
                                {metric.value}
                            </span>
                            <p className="text-gray-600 text-[10px] uppercase font-mono tracking-[0.2em] mt-2 group-hover:text-gray-400 transition-colors">{metric.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Navigation Modules */}
            <div>
                <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-600 mb-8 flex items-center gap-6">
                    Core Protocols
                    <div className="h-px bg-surface-border flex-grow"></div>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div
                        className="cyber-card p-10 group cursor-pointer hover:bg-brand/5 border-surface-border/50 hover:border-brand/40 transition-all duration-500"
                        onClick={() => onViewChange('teams')}
                    >
                        <div className="w-12 h-12 rounded-full border border-brand/20 flex items-center justify-center mb-6 group-hover:border-brand/60 group-hover:scale-110 transition-all">
                            <Users className="w-6 h-6 text-brand" />
                        </div>
                        <h3 className="text-2xl font-display font-black text-white mb-3 italic tracking-tight uppercase group-hover:text-brand transition-colors">Teams</h3>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest leading-relaxed mb-8">Personnel management, roster extraction & bio profiling.</p>
                        <div className="flex items-center gap-3 text-brand font-mono text-[10px] uppercase tracking-[0.3em] font-bold group-hover:translate-x-2 transition-transform">
                            Access Module <ChevronRight className="w-3 h-3" />
                        </div>
                    </div>

                    <div
                        className="cyber-card p-10 group cursor-pointer hover:bg-brand/5 border-surface-border/50 hover:border-brand/40 transition-all duration-500"
                        onClick={() => onViewChange('schedule')}
                    >
                        <div className="w-12 h-12 rounded-full border border-brand/20 flex items-center justify-center mb-6 group-hover:border-brand/60 group-hover:scale-110 transition-all">
                            <Calendar className="w-6 h-6 text-brand" />
                        </div>
                        <h3 className="text-2xl font-display font-black text-white mb-3 italic tracking-tight uppercase group-hover:text-brand transition-colors">Engagement Log</h3>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest leading-relaxed mb-8">Mission scheduling, event sequencing & orbital planning.</p>
                        <div className="flex items-center gap-3 text-brand font-mono text-[10px] uppercase tracking-[0.3em] font-bold group-hover:translate-x-2 transition-transform">
                            Access Module <ChevronRight className="w-3 h-3" />
                        </div>
                    </div>

                    {userRole === Role.ADMIN && (
                        <div
                            className="cyber-card p-10 group cursor-pointer hover:bg-brand/5 border-surface-border/50 hover:border-brand/40 transition-all duration-500"
                            onClick={() => onViewChange('soundEffects')}
                        >
                            <div className="w-12 h-12 rounded-full border border-brand/20 flex items-center justify-center mb-6 group-hover:border-brand/60 group-hover:scale-110 transition-all">
                                <Volume2 className="w-6 h-6 text-brand" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-white mb-3 italic tracking-tight uppercase group-hover:text-brand transition-colors">Neural Audio</h3>
                            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest leading-relaxed mb-8">Audio feedback frequency management & whistle triggers.</p>
                            <div className="flex items-center gap-3 text-brand font-mono text-[10px] uppercase tracking-[0.3em] font-bold group-hover:translate-x-2 transition-transform">
                                Access Module <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lists Section */}
            <div className="grid lg:grid-cols-2 gap-12 pt-8">
                {/* Upcoming */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-display font-black text-white italic flex items-center gap-6">
                        UPCOMING <span className="text-brand">GAMES</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    {upcomingGames.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingGames.slice(0, 10).map(game => (
                                <div key={game.id} className="cyber-card p-6 flex flex-col md:flex-row items-center justify-between group hover:border-brand/30 transition-all gap-4">
                                    <div className="w-full">
                                        <p className="font-display font-black text-xl text-white group-hover:text-brand transition-colors italic uppercase tracking-tighter">{game.homeTeam.name} <span className="text-brand/50 px-2">//</span> {game.awayTeam.name}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="h-1 w-1 bg-brand rounded-full animate-pulse"></div>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">T-MINUS: {new Date(game.scheduledTime).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => onStartGame(game.id)} className="cyber-button w-full md:w-auto py-3 px-8 text-[10px] font-display font-bold italic tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(255,87,34,0.15)]">
                                        ENGAGE TEAM
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="cyber-card p-12 text-center border-dashed border-surface-border grayscale flex flex-col items-center justify-center min-h-[300px]">
                            <Binary className="w-12 h-12 mb-6 opacity-20 text-brand" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-gray-500">Scanning for next deployment...</p>
                        </div>
                    )}
                </div>

                {/* Finished */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-display font-black text-white italic flex items-center gap-6">
                        LEGACY <span className="text-brand">REPORTS</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    {finishedGames.length > 0 ? (
                        <div className="space-y-4">
                            {finishedGames.slice(0, 10).map(game => (
                                <div key={game.id} className="cyber-card p-6 flex flex-col md:flex-row items-center justify-between group border-l-2 border-brand hover:bg-brand/5 transition-all gap-4">
                                    <div className="w-full">
                                        <div className="flex flex-wrap items-baseline gap-4 mb-2">
                                            <p className="font-display font-black text-xl text-white uppercase italic tracking-tighter">{game.homeTeam.name} <span className="text-brand/50 px-1">/</span> {game.awayTeam.name}</p>
                                            <span className="font-display font-black text-brand italic tracking-tight text-lg underline underline-offset-4 decoration-brand/30">{game.score.home}-{game.score.away}</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-bold">Session Closed: {new Date(game.scheduledTime).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => onViewReport(game)}
                                        className="cyber-button-outline w-full md:w-auto py-3 px-8 text-[10px] font-display font-bold italic tracking-widest whitespace-nowrap hover:bg-white/5 transition-all"
                                    >
                                        INTEL BRIEF
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="cyber-card p-12 text-center border-dashed border-surface-border grayscale flex flex-col items-center justify-center min-h-[300px]">
                            <Binary className="w-12 h-12 mb-6 opacity-20 text-brand" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-gray-500">Archive database empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

import React from 'react';
import { Game, Role } from '../types';
import { View } from '../services/storageService';
import { Activity, Calendar, Users, Volume2, ChevronRight, Binary, ShieldCheck } from 'lucide-react';

interface DashboardProps {
    games: Game[];
    onStartGame: (gameId: string) => void;
    onViewChange: (view: View) => void;
    activeGameId: string | null;
    onViewReport: (game: Game) => void;
    userRole?: Role;
}

const Dashboard: React.FC<DashboardProps> = ({ games, onStartGame, onViewChange, activeGameId, onViewReport, userRole }) => {
    const upcomingGames = games.filter(g => g.status === 'scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    const finishedGames = games.filter(g => g.status === 'finished').sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
    const activeGame = games.find(g => g.id === activeGameId);

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="relative">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-px bg-brand w-12"></div>
                    <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Operational Overview</p>
                </div>
                <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-white">
                    COMMAND <span className="text-brand">CENTER</span>
                </h1>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">Secure Session // Verified Access // Node 0-1</p>
            </div>

            {/* Live Game Alert */}
            {activeGame && (
                <div className="cyber-card p-1 border-brand/50 bg-brand/5">
                    <div className="bg-black p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand blur-md animate-pulse rounded-full"></div>
                                <Activity className="relative w-8 h-8 text-brand" />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-white uppercase italic">Live Protocol Active</h2>
                                <p className="text-brand font-mono text-[10px] uppercase tracking-widest">{activeGame.homeTeam.name} vs {activeGame.awayTeam.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onViewChange('game')}
                            className="cyber-button w-full md:w-auto flex items-center justify-center gap-2"
                        >
                            RESUME PROTOCOL <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="cyber-card p-6">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Scheduled Games</p>
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-display font-black text-white">{upcomingGames.length}</span>
                        <Calendar className="w-8 h-8 text-brand opacity-20" />
                    </div>
                    <p className="text-gray-600 text-[10px] uppercase mt-2">Awaiting Initialization</p>
                </div>
                <div className="cyber-card p-6">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Completed Cycles</p>
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-display font-black text-white">{finishedGames.length}</span>
                        <Binary className="w-8 h-8 text-brand opacity-20" />
                    </div>
                    <p className="text-gray-600 text-[10px] uppercase mt-2">Total Log Entries</p>
                </div>
                <div className="cyber-card p-6">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Security Level</p>
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-display font-black text-white">L-01</span>
                        <ShieldCheck className="w-8 h-8 text-brand opacity-20" />
                    </div>
                    <p className="text-gray-600 text-[10px] uppercase mt-2">End-to-End Encrypted</p>
                </div>
            </div>

            {/* Main Navigation Modules */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    className="cyber-card p-8 group cursor-pointer hover:bg-brand/5 transition-colors"
                    onClick={() => onViewChange('teams')}
                >
                    <Users className="w-10 h-10 text-brand mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-display font-bold text-white mb-2 italic">Roster Matrix</h3>
                    <p className="text-gray-400 text-sm font-sans mb-6">Manage player identifiers, team structures, and assignment protocols.</p>
                    <div className="flex items-center gap-2 text-brand font-mono text-[10px] uppercase tracking-widest">
                        Access Module <ChevronRight className="w-3 h-3" />
                    </div>
                </div>

                <div
                    className="cyber-card p-8 group cursor-pointer hover:bg-brand/5 transition-colors"
                    onClick={() => onViewChange('schedule')}
                >
                    <Calendar className="w-10 h-10 text-brand mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-display font-bold text-white mb-2 italic">Sequence Schedule</h3>
                    <p className="text-gray-400 text-sm font-sans mb-6">Orchestrate game occurrences and temporal planning for the active season.</p>
                    <div className="flex items-center gap-2 text-brand font-mono text-[10px] uppercase tracking-widest">
                        Access Module <ChevronRight className="w-3 h-3" />
                    </div>
                </div>

                {userRole === Role.ADMIN && (
                    <div
                        className="cyber-card p-8 group cursor-pointer hover:bg-brand/5 transition-colors"
                        onClick={() => onViewChange('soundEffects')}
                    >
                        <Volume2 className="w-10 h-10 text-brand mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-display font-bold text-white mb-2 italic">Acoustic Assets</h3>
                        <p className="text-gray-400 text-sm font-sans mb-6">Manage custom sonic triggers for tactical training and drill execution.</p>
                        <div className="flex items-center gap-2 text-brand font-mono text-[10px] uppercase tracking-widest">
                            Access Module <ChevronRight className="w-3 h-3" />
                        </div>
                    </div>
                )}
            </div>

            {/* Lists Section */}
            <div className="grid lg:grid-cols-2 gap-12 pt-8">
                {/* Upcoming */}
                <div>
                    <h2 className="text-2xl font-display font-black text-white italic mb-6 flex items-center gap-4">
                        UPCOMING <span className="text-brand">SEQUENCES</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    {upcomingGames.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingGames.slice(0, 3).map(game => (
                                <div key={game.id} className="cyber-card p-6 flex items-center justify-between group">
                                    <div>
                                        <p className="font-display font-bold text-lg text-white group-hover:text-brand transition-colors italic uppercase">{game.homeTeam.name} // {game.awayTeam.name}</p>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Deploying: {new Date(game.scheduledTime).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => onStartGame(game.id)} className="cyber-button py-1 px-4 text-xs">
                                        INITIALIZE
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="cyber-card p-12 text-center opacity-50 grayscale">
                            <Binary className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No Upcoming Data Strings</p>
                        </div>
                    )}
                </div>

                {/* Finished */}
                <div>
                    <h2 className="text-2xl font-display font-black text-white italic mb-6 flex items-center gap-4">
                        ARCHIVED <span className="text-brand">LOGS</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    {finishedGames.length > 0 ? (
                        <div className="space-y-4">
                            {finishedGames.slice(0, 3).map(game => (
                                <div key={game.id} className="cyber-card p-6 flex items-center justify-between group border-l-2 border-l-brand">
                                    <div>
                                        <div className="flex items-baseline gap-3">
                                            <p className="font-display font-bold text-lg text-white uppercase italic">{game.homeTeam.name} // {game.awayTeam.name}</p>
                                            <span className="font-display font-black text-brand italic">{game.score.home} - {game.score.away}</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Archived: {new Date(game.scheduledTime).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => onViewReport(game)}
                                        className="cyber-button-outline py-1 px-4 text-xs"
                                    >
                                        ANALYSIS
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="cyber-card p-12 text-center opacity-50 grayscale">
                            <Binary className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Archive Database Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

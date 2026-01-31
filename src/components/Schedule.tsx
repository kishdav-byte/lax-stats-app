import React, { useState } from 'react';
import { Game, Team } from '../types';
import { Calendar, Binary, Trash2, Play, TableProperties } from 'lucide-react';

interface ScheduleProps {
    teams: Team[];
    games: Game[];
    onAddGame: (homeTeamId: string, awayTeamInfo: { id?: string; name?: string }, scheduledTime: string) => void;
    onStartGame: (gameId: string) => void;
    onDeleteGame: (gameId: string) => void;
    onReturnToDashboard: (view: 'dashboard') => void;
    onViewReport: (game: Game) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ teams, games, onAddGame, onStartGame, onDeleteGame, onReturnToDashboard, onViewReport }) => {
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [gameDate, setGameDate] = useState('');

    const handleAddGame = () => {
        const trimmedAwayName = awayTeamName.trim();
        const homeTeam = teams.find(t => t.id === homeTeamId);

        if (homeTeam && trimmedAwayName && gameDate) {
            if (homeTeam.name.toLowerCase() === trimmedAwayName.toLowerCase()) {
                alert("Problem: Home and Away teams cannot be the same.");
                return;
            }

            const existingAwayTeam = teams.find(t => t.name.toLowerCase() === trimmedAwayName.toLowerCase());
            const awayTeamInfo = existingAwayTeam ? { id: existingAwayTeam.id } : { name: trimmedAwayName };

            onAddGame(homeTeamId, awayTeamInfo, gameDate);
            setHomeTeamId('');
            setAwayTeamName('');
            setGameDate('');
        } else {
            alert("Problem: All team and time fields must be filled out.");
        }
    };

    const scheduledGames = games.filter(g => g.status === 'scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    const finishedGames = games.filter(g => g.status === 'finished').sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());


    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Manage Games</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        GAME <span className="text-brand">SCHEDULE</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            {teams.length > 0 ? (
                <div className="cyber-card p-8">
                    <h2 className="text-lg font-display font-bold mb-8 uppercase italic">Schedule New Game</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label htmlFor="homeTeam" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Home Team</label>
                            <select
                                id="homeTeam"
                                value={homeTeamId}
                                onChange={e => setHomeTeamId(e.target.value)}
                                className="w-full cyber-input appearance-none"
                            >
                                <option value="" className="bg-black">SELECT HOME TEAM</option>
                                {teams.map(t => <option key={t.id} value={t.id} className="bg-black">{t.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="awayTeam" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Away Team / Opponent</label>
                            <div className="relative">
                                <input
                                    id="awayTeam"
                                    type="text"
                                    value={awayTeamName}
                                    onChange={e => setAwayTeamName(e.target.value)}
                                    placeholder="OPPONENT NAME..."
                                    className="w-full cyber-input"
                                    list="teams-list"
                                />
                                <datalist id="teams-list">
                                    {teams.filter(t => t.id !== homeTeamId).map(t => <option key={t.id} value={t.name} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="gameDate" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Game Time</label>
                            <input
                                type="datetime-local"
                                id="gameDate"
                                value={gameDate}
                                onChange={e => setGameDate(e.target.value)}
                                className="w-full cyber-input"
                            />
                        </div>
                    </div>
                    <button onClick={handleAddGame} className="mt-8 cyber-button w-full md:w-auto px-12 flex items-center justify-center gap-3">
                        ADD GAME <Calendar className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="cyber-card p-12 text-center border-dashed border-surface-border grayscale">
                    <TableProperties className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Notice: Create teams before scheduling games.</p>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-12 pt-8">
                {/* Upcoming */}
                <div>
                    <h2 className="text-2xl font-display font-black text-white italic mb-8 flex items-center gap-4">
                        UPCOMING <span className="text-brand">GAMES</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    <div className="space-y-4">
                        {scheduledGames.map(game => (
                            <div key={game.id} className="cyber-card p-1 bg-surface-card/50">
                                <div className="bg-black p-6 flex items-center justify-between group">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-1 h-1 bg-brand rounded-full animate-pulse"></div>
                                            <p className="font-display font-bold text-lg text-white group-hover:text-brand transition-colors italic uppercase tracking-tight">
                                                {game.homeTeam.name} // {game.awayTeam.name}
                                            </p>
                                        </div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1 ml-4">
                                            Scheduled: {new Date(game.scheduledTime).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => onStartGame(game.id)} className="cyber-button py-2 px-6 flex items-center gap-2 group/btn">
                                            START <Play className="w-3 h-3 group-hover/btn:fill-black" />
                                        </button>
                                        <button onClick={() => onDeleteGame(game.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {scheduledGames.length === 0 && (
                            <div className="p-12 text-center border border-dashed border-surface-border opacity-50">
                                <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">No Pending Games</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed */}
                <div>
                    <h2 className="text-2xl font-display font-black text-white italic mb-8 flex items-center gap-4">
                        COMPLETED <span className="text-brand">GAMES</span>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </h2>
                    <div className="space-y-4">
                        {finishedGames.map(game => (
                            <div key={game.id} className="cyber-card p-1 border-brand/20">
                                <div className="bg-black p-6 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-baseline gap-3 mb-1">
                                            <p className="font-display font-bold text-lg text-white uppercase italic tracking-tight">{game.homeTeam.name} // {game.awayTeam.name}</p>
                                            <span className="font-display font-black text-brand italic">{game.score.home} - {game.score.away}</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                                            Played: {new Date(game.scheduledTime).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onViewReport(game)}
                                        className="cyber-button-outline py-1 px-4 text-[10px]"
                                    >
                                        GAME REPORT
                                    </button>
                                </div>
                            </div>
                        ))}
                        {finishedGames.length === 0 && (
                            <div className="p-12 text-center border border-dashed border-surface-border opacity-50">
                                <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">History Empty</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Schedule;

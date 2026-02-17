import React, { useMemo } from 'react';
import { Player, Team, Game, StatType } from '../types';
import { ChevronLeft, TrendingUp, Target, Zap, Activity } from 'lucide-react';

interface PlayerProfileProps {
    player: Player;
    team: Team;
    games: Game[];
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="cyber-card p-6 border-brand/20 bg-brand/5 flex flex-col items-center justify-center text-center group hover:border-brand/50 transition-all duration-300">
        <div className="mb-2 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all text-brand">
            {icon}
        </div>
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-display font-black text-white italic tracking-tighter">{value}</p>
    </div>
);

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, team, games, onClose }) => {
    const playerStatsData = useMemo(() => {
        const totalStats: { [key in StatType]?: number } = {};
        const gamesPlayed: Game[] = [];
        const gameStatsMap: { [gameId: string]: { [key in StatType]?: number } } = {};

        games.forEach(game => {
            if (game.status !== 'finished' || (game.homeTeam.id !== team.id && game.awayTeam.id !== team.id)) {
                return;
            }

            let playerParticipated = false;
            const statsForThisGame: { [key in StatType]?: number } = {};

            game.stats.forEach(stat => {
                if (stat.playerId === player.id) {
                    playerParticipated = true;
                    statsForThisGame[stat.type] = (statsForThisGame[stat.type] || 0) + 1;
                }
                if (stat.type === StatType.GOAL && stat.assistingPlayerId === player.id) {
                    playerParticipated = true;
                    statsForThisGame[StatType.ASSIST] = (statsForThisGame[StatType.ASSIST] || 0) + 1;
                }
            });

            if (playerParticipated) {
                gamesPlayed.push(game);
                gameStatsMap[game.id] = statsForThisGame;
                Object.entries(statsForThisGame).forEach(([statKey, statValue]) => {
                    totalStats[statKey as StatType] = (totalStats[statKey as StatType] || 0) + statValue;
                });
            }
        });

        const foWins = totalStats[StatType.FACEOFF_WIN] || 0;
        const foLosses = totalStats[StatType.FACEOFF_LOSS] || 0;
        const foTotal = foWins + foLosses;
        const foPercentage = foTotal > 0 ? (foWins / foTotal) * 100 : 0;

        return {
            totalStats,
            gamesPlayed: gamesPlayed.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()),
            gameStatsMap,
            points: (totalStats[StatType.GOAL] || 0) + (totalStats[StatType.ASSIST] || 0),
            foPercentage,
            foTotal
        };
    }, [player, team, games]);

    const allStatTypes = Object.values(StatType);

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Player Profile</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        {player.name} <span className="text-brand">#{player.jerseyNumber}</span>
                    </h1>
                    Position: <span className="text-white italic">{player.position}</span> // Team: <span className="text-brand italic">{team.name}</span>
                </div>
                <button onClick={onClose} className="cyber-button-outline py-2 px-6 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> BACK TO TEAM
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard label="Games Played" value={playerStatsData.gamesPlayed.length} icon={<Activity className="w-5 h-5" />} />
                <StatCard label="Goals" value={playerStatsData.totalStats[StatType.GOAL] || 0} icon={<Target className="w-5 h-5" />} />
                <StatCard label="Assists" value={playerStatsData.totalStats[StatType.ASSIST] || 0} icon={<TrendingUp className="w-5 h-5" />} />
                <StatCard label="Total Points" value={playerStatsData.points} icon={<Zap className="w-5 h-5" />} />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Career Breakdown */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-8">
                        <TrendingUp className="w-5 h-5 text-brand" />
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Full Season <span className="text-brand">Stats</span></h2>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {allStatTypes.map(statType => (
                            <div key={statType} className="cyber-card p-4 text-center group">
                                <p className="text-2xl font-display font-bold text-white mb-1 group-hover:text-brand transition-colors italic">{playerStatsData.totalStats[statType] || 0}</p>
                                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{statType}</p>
                            </div>
                        ))}
                        {playerStatsData.foTotal > 0 && (
                            <div className="cyber-card p-4 text-center group border-brand/30 bg-brand/5 shadow-[0_0_15px_rgba(255,87,34,0.1)]">
                                <p className="text-2xl font-display font-black text-brand mb-1 italic">
                                    {(playerStatsData.totalStats[StatType.FACEOFF_WIN] || 0)} <span className="text-gray-600 text-xs">VS</span> {(playerStatsData.totalStats[StatType.FACEOFF_LOSS] || 0)}
                                </p>
                                <p className="text-[10px] font-display font-black text-brand uppercase tracking-widest">{playerStatsData.foPercentage.toFixed(1)}% FO WIN</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Log */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <Activity className="w-5 h-5 text-brand" />
                        <h2 className="text-lg font-display font-bold text-white italic uppercase tracking-widest">Game <span className="text-brand">History</span></h2>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {playerStatsData.gamesPlayed.length > 0 ? playerStatsData.gamesPlayed.map(game => {
                            const stats = playerStatsData.gameStatsMap[game.id] || {};
                            const opponent = game.homeTeam.id === team.id ? game.awayTeam.name : game.homeTeam.name;
                            const goals = stats[StatType.GOAL] || 0;
                            const assists = stats[StatType.ASSIST] || 0;
                            return (
                                <div key={game.id} className="bg-surface-card border-l-2 border-brand p-4 space-y-3 group hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-display font-black text-white uppercase italic">vs {opponent}</p>
                                            <p className="text-[8px] font-mono text-gray-500 uppercase mt-1">{new Date(game.scheduledTime).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-display font-black text-brand italic leading-none">{goals + assists}</p>
                                            <p className="text-[8px] font-mono text-gray-600 uppercase">Points</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 border-t border-surface-border pt-2">
                                        <div className="flex-1"><p className="text-xs font-mono font-bold text-white">{goals}</p><p className="text-[7px] font-mono text-gray-600 uppercase">Goals</p></div>
                                        <div className="flex-1"><p className="text-xs font-mono font-bold text-white">{assists}</p><p className="text-[7px] font-mono text-gray-600 uppercase">Assists</p></div>

                                        {/* FO Breakdown in Game Log */}
                                        {((stats[StatType.FACEOFF_WIN] || 0) + (stats[StatType.FACEOFF_LOSS] || 0)) > 0 && (
                                            <div className="flex-1 border-l border-surface-border pl-2">
                                                <p className="text-xs font-mono font-bold text-brand">
                                                    {stats[StatType.FACEOFF_WIN] || 0}-{stats[StatType.FACEOFF_LOSS] || 0}
                                                </p>
                                                <p className="text-[7px] font-mono text-gray-600 uppercase">
                                                    {((stats[StatType.FACEOFF_WIN] || 0) / ((stats[StatType.FACEOFF_WIN] || 0) + (stats[StatType.FACEOFF_LOSS] || 0)) * 100).toFixed(0)}% FO
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex-1 text-right">
                                            <p className="text-xs font-mono font-bold text-gray-400">
                                                {Object.entries(stats)
                                                    .filter(([key]) => key !== StatType.GOAL && key !== StatType.ASSIST && key !== StatType.FACEOFF_WIN && key !== StatType.FACEOFF_LOSS && stats[key as StatType]! > 0)
                                                    .length}
                                            </p>
                                            <p className="text-[7px] font-mono text-gray-600 uppercase">Other</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">No game history found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;

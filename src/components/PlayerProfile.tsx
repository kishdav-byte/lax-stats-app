import React, { useMemo } from 'react';
import { Player, Team, Game, StatType } from '../types';

interface PlayerProfileProps {
    player: Player;
    team: Team;
    games: Game[];
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-cyan-400">{value}</p>
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

        return {
            totalStats,
            gamesPlayed: gamesPlayed.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()),
            gameStatsMap,
            points: (totalStats[StatType.GOAL] || 0) + (totalStats[StatType.ASSIST] || 0)
        };
    }, [player, team, games]);

    const allStatTypes = Object.values(StatType);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white">#{player.jerseyNumber} {player.name}</h1>
                        <p className="text-xl text-cyan-400">{player.position}</p>
                        <p className="text-md text-gray-400">{team.name}</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        &larr; Back to Team Roster
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Games Played" value={playerStatsData.gamesPlayed.length} />
                <StatCard label="Goals" value={playerStatsData.totalStats[StatType.GOAL] || 0} />
                <StatCard label="Assists" value={playerStatsData.totalStats[StatType.ASSIST] || 0} />
                <StatCard label="Points" value={playerStatsData.points} />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4">Career Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allStatTypes.map(statType => (
                        <div key={statType} className="bg-gray-700 p-3 rounded-md text-center">
                            <p className="text-lg font-bold">{playerStatsData.totalStats[statType] || 0}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">{statType}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4">Game Log</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {playerStatsData.gamesPlayed.length > 0 ? playerStatsData.gamesPlayed.map(game => {
                        const stats = playerStatsData.gameStatsMap[game.id] || {};
                        const opponent = game.homeTeam.id === team.id ? game.awayTeam.name : game.homeTeam.name;
                        const goals = stats[StatType.GOAL] || 0;
                        const assists = stats[StatType.ASSIST] || 0;
                        return (
                            <div key={game.id} className="bg-gray-700 p-4 rounded-md">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        <p className="font-semibold">vs {opponent}</p>
                                        <p className="text-xs text-gray-400">{new Date(game.scheduledTime).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-4 text-center">
                                        <div><p className="font-bold text-lg">{goals}</p><p className="text-xs text-gray-400">G</p></div>
                                        <div><p className="font-bold text-lg">{assists}</p><p className="text-xs text-gray-400">A</p></div>
                                        <div><p className="font-bold text-lg text-cyan-400">{goals + assists}</p><p className="text-xs text-gray-400">P</p></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-gray-500 text-center py-4">No game data available for this player.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;

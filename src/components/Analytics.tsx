import React, { useMemo, useState, useCallback } from 'react';
import { Game, StatType, Team, TrainingSession, DrillType } from '../types';
import { analyzePlayerPerformance, PlayerAnalysisData } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Shield, Cpu, Binary, Box } from 'lucide-react';

interface AnalyticsProps {
    teams: Team[];
    games: Game[];
    trainingSessions?: TrainingSession[];
    onReturnToDashboard: () => void;
}

type SortKey = 'name' | 'teamName' | 'gamesPlayed' | StatType;
type SortDirection = 'asc' | 'desc';

interface AggregatedStats {
    playerId: string;
    name: string;
    jerseyNumber: string;
    position: string;
    teamName: string;
    teamId: string;
    gamesPlayed: number;
    stats: { [key in StatType]?: number };
}

const AnalysisModal: React.FC<{
    player: AggregatedStats;
    onClose: () => void;
}> = ({ player, onClose }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const getAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const analysisData: PlayerAnalysisData = {
                name: player.name,
                position: player.position,
                totalGames: player.gamesPlayed,
                stats: player.stats,
            };
            const result = await analyzePlayerPerformance(analysisData);
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [player]);

    React.useEffect(() => {
        getAnalysis();
    }, [getAnalysis]);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="cyber-card p-8 max-w-2xl w-full border-brand/50 bg-black">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-brand w-8"></div>
                            <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase">AI Player Insights</p>
                        </div>
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">
                            ANALYSIS // <span className="text-brand">{player.name}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <Box className="w-6 h-6" />
                    </button>
                </div>

                {isLoading && (
                    <div className="py-20 text-center space-y-4">
                        <Cpu className="w-12 h-12 text-brand mx-auto animate-spin" />
                        <p className="text-[10px] font-mono text-brand uppercase tracking-[0.3em] animate-pulse">Generating Player Analysis...</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-900/10 border-l-2 border-red-500 mb-6">
                        <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">Problem: {error}</p>
                    </div>
                )}

                {analysis && (
                    <div className="bg-surface-card border border-surface-border p-6 custom-scrollbar max-h-96 overflow-y-auto">
                        <div className="prose prose-invert prose-sm max-w-none prose-orange selection:bg-brand selection:text-black">
                            <div className="text-[11px] font-mono leading-relaxed text-gray-300 space-y-4 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="cyber-button py-2 px-8">CLOSE ANALYSIS</button>
                </div>
            </div>
        </div>
    );
};


const Analytics: React.FC<AnalyticsProps> = ({ teams, games, trainingSessions = [], onReturnToDashboard }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
    const [analyzingPlayer, setAnalyzingPlayer] = useState<AggregatedStats | null>(null);

    const faceOffData = useMemo(() => {
        const sessionsByDate: { [date: string]: number[] } = {};

        trainingSessions.forEach(s => {
            if (s.drillType === DrillType.FACE_OFF && s.results.reactionTimes && s.results.reactionTimes.length > 0) {
                const dateKey = new Date(s.date).toLocaleDateString();
                if (!sessionsByDate[dateKey]) {
                    sessionsByDate[dateKey] = [];
                }
                sessionsByDate[dateKey].push(...s.results.reactionTimes);
            }
        });

        return Object.entries(sessionsByDate)
            .map(([date, times]) => ({
                date,
                averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [trainingSessions]);

    const aggregatedStats: AggregatedStats[] = useMemo(() => {
        const playerStatsMap: { [playerId: string]: AggregatedStats } = {};

        teams.forEach(team => {
            team.roster.forEach(player => {
                playerStatsMap[player.id] = {
                    playerId: player.id,
                    name: player.name,
                    jerseyNumber: player.jerseyNumber,
                    position: player.position,
                    teamName: team.name,
                    teamId: team.id,
                    gamesPlayed: 0,
                    stats: {},
                };
            });
        });

        games.forEach(game => {
            if (game.status !== 'finished') return;

            const gamePlayerIds = new Set<string>();
            game.stats.forEach(stat => {
                gamePlayerIds.add(stat.playerId);
                if (stat.assistingPlayerId) gamePlayerIds.add(stat.assistingPlayerId);
            });

            gamePlayerIds.forEach(playerId => {
                if (playerStatsMap[playerId]) playerStatsMap[playerId].gamesPlayed += 1;
            });

            game.stats.forEach(stat => {
                const playerAgg = playerStatsMap[stat.playerId];
                if (playerAgg) {
                    playerAgg.stats[stat.type] = (playerAgg.stats[stat.type] || 0) + 1;
                    if (stat.type === StatType.GOAL && stat.assistingPlayerId) {
                        const assistPlayerAgg = playerStatsMap[stat.assistingPlayerId];
                        if (assistPlayerAgg) {
                            assistPlayerAgg.stats[StatType.ASSIST] = (assistPlayerAgg.stats[StatType.ASSIST] || 0) + 1;
                        }
                    }
                }
            });
        });

        return Object.values(playerStatsMap);
    }, [teams, games]);

    const sortedPlayers = useMemo(() => {
        let sortablePlayers = [...aggregatedStats];
        if (sortConfig.key) {
            sortablePlayers.sort((a, b) => {
                const aVal = sortConfig.key in StatType ? (a.stats[sortConfig.key as StatType] || 0) : a[sortConfig.key as 'name' | 'teamName' | 'gamesPlayed'];
                const bVal = sortConfig.key in StatType ? (b.stats[sortConfig.key as StatType] || 0) : b[sortConfig.key as 'name' | 'teamName' | 'gamesPlayed'];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortablePlayers;
    }, [aggregatedStats, sortConfig]);

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const statColumns: { key: StatType, label: string }[] = [
        StatType.GOAL, StatType.ASSIST, StatType.SHOT, StatType.GROUND_BALL,
        StatType.TURNOVER, StatType.CAUSED_TURNOVER, StatType.SAVE, StatType.FACEOFF_WIN
    ].map(key => ({ key, label: key.substring(0, 3).toUpperCase() }));


    return (
        <>
            {analyzingPlayer && <AnalysisModal player={analyzingPlayer} onClose={() => setAnalyzingPlayer(null)} />}
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-brand w-12"></div>
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Performance Data</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            ANALYTICS <span className="text-brand">CENTER</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="cyber-button-outline py-2 px-6">
                        BACK TO DASHBOARD
                    </button>
                </div>

                {/* Training Progress Section */}
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border">
                        <div className="flex items-center gap-4 mb-8">
                            <Activity className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Reaction <span className="text-brand">Training</span></h2>
                        </div>

                        <div className="grid md:grid-cols-1 gap-8">
                            <div className="bg-surface-card p-6 border border-surface-border">
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400 mb-8 ml-2">Face-Off Reaction Time Trends</p>
                                {faceOffData.length > 0 ? (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={faceOffData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#525252"
                                                    fontSize={10}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="#525252"
                                                    fontSize={10}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{ value: 'MS', angle: -90, position: 'insideLeft', fill: '#525252', fontSize: 10, offset: 0 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '0', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                                                    itemStyle={{ color: '#ff5722' }}
                                                    cursor={{ stroke: '#ff5722', strokeWidth: 1 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="averageTime"
                                                    name="REACTION TIME"
                                                    stroke="#ff5722"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#ff5722', strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="p-20 text-center opacity-20">
                                        <Binary className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting Training Data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Shield className="w-5 h-5 text-brand" />
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Player <span className="text-brand">Stats</span></h2>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </div>

                    <div className="cyber-card group">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[1000px] text-left border-collapse">
                                <thead className="bg-surface-card border-b border-surface-border">
                                    <tr>
                                        {[{ key: 'name', label: 'PLAYER' }, { key: 'teamName', label: 'TEAM' }, { key: 'gamesPlayed', label: 'GAMES' }].map(({ key, label }) => (
                                            <th key={key} className="p-4 px-6 cursor-pointer group/th" onClick={() => requestSort(key as SortKey)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 group-hover/th:text-brand transition-colors">{label}</span>
                                                    {sortConfig.key === key && (
                                                        <span className="text-brand text-[8px] animate-pulse">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {statColumns.map(({ key, label }) => (
                                            <th key={key} className="p-4 text-center cursor-pointer group/th" onClick={() => requestSort(key)}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 group-hover/th:text-brand transition-colors">{label}</span>
                                                    {sortConfig.key === key && (
                                                        <span className="text-brand text-[8px] animate-pulse">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4 px-6 text-right">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">ACTIONS</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-black">
                                    {sortedPlayers.map(player => (
                                        <tr key={player.playerId} className="border-b border-surface-border/50 hover:bg-brand/5 transition-colors group">
                                            <td className="p-4 px-6">
                                                <p className="font-display font-bold text-white uppercase italic tracking-tight">{player.name}</p>
                                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mt-0.5">#{player.jerseyNumber}</p>
                                            </td>
                                            <td className="p-4 px-6">
                                                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{player.teamName}</span>
                                            </td>
                                            <td className="p-4 px-6 text-center">
                                                <span className="font-mono text-xs text-white bg-surface-card px-2 py-0.5 border border-surface-border">{player.gamesPlayed}</span>
                                            </td>
                                            {statColumns.map(({ key }) => (
                                                <td key={key} className="p-4 text-center">
                                                    <span className={`font-mono text-xs ${(player.stats[key] || 0) > 0 ? 'text-white' : 'text-gray-700'}`}>
                                                        {player.stats[key] || 0}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="p-4 px-6 text-right">
                                                <button
                                                    onClick={() => setAnalyzingPlayer(player)}
                                                    className="cyber-button-outline py-1 px-4 text-[9px] flex items-center gap-2 ml-auto group-hover:bg-brand group-hover:text-black transition-all duration-300"
                                                >
                                                    AI ANALYSIS <Activity className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sortedPlayers.length === 0 && (
                            <div className="p-20 text-center border-t border-surface-border">
                                <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Team Stats Empty // No Data Available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Analytics;

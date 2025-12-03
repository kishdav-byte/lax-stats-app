import React, { useMemo, useState, useEffect } from 'react';
import { Game, Team, StatType, User, Role } from '../types';

interface GameReportProps {
    game: Game;
    onClose: () => void;
    currentUser: User;
    onUpdateGame: (game: Game) => void;
}

const STAT_DEFINITIONS: { key: StatType, label: string }[] = [
    { key: StatType.GOAL, label: 'G' },
    { key: StatType.ASSIST, label: 'A' },
    { key: StatType.SHOT, label: 'SHT' },
    { key: StatType.GROUND_BALL, label: 'GB' },
    { key: StatType.TURNOVER, label: 'TO' },
    { key: StatType.CAUSED_TURNOVER, label: 'CT' },
    { key: StatType.SAVE, label: 'SV' },
    { key: StatType.FACEOFF_WIN, label: 'FOW' },
    { key: StatType.FACEOFF_LOSS, label: 'FOL' }
];

const ReportStatsTable: React.FC<{ team: Team, playerStats: { [playerId: string]: { [key in StatType]?: number } } }> = ({ team, playerStats }) => {

    const teamTotals = STAT_DEFINITIONS.reduce((acc, statDef) => {
        acc[statDef.key] = team.roster.reduce((sum, player) => sum + (playerStats[player.id]?.[statDef.key] || 0), 0);
        return acc;
    }, {} as { [key in StatType]?: number });

    const totalGoals = teamTotals[StatType.GOAL] || 0;
    const totalAssists = teamTotals[StatType.ASSIST] || 0;

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold mb-2 text-cyan-600">{team.name} - Final Stats</h3>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm text-left text-gray-800">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Player</th>
                            <th className="p-2">Pos</th>
                            <th className="p-2 text-center">G</th>
                            <th className="p-2 text-center">A</th>
                            <th className="p-2 text-center">P</th>
                            {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                <th key={s.key} className="p-2 text-center">{s.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {team.roster.map(player => {
                            const stats = playerStats[player.id] || {};
                            const goals = stats[StatType.GOAL] || 0;
                            const assists = stats[StatType.ASSIST] || 0;
                            const points = goals + assists;
                            return (
                                <tr key={player.id}>
                                    <td className="p-2 font-bold text-cyan-700">{player.jerseyNumber}</td>
                                    <td className="p-2">{player.name}</td>
                                    <td className="p-2 text-gray-500">{player.position}</td>
                                    <td className="p-2 text-center">{goals}</td>
                                    <td className="p-2 text-center">{assists}</td>
                                    <td className="p-2 text-center font-bold">{points}</td>
                                    {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                        <td key={s.key} className="p-2 text-center">{(stats[s.key] || 0)}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td colSpan={3} className="p-2 text-right">Team Totals</td>
                            <td className="p-2 text-center">{totalGoals}</td>
                            <td className="p-2 text-center">{totalAssists}</td>
                            <td className="p-2 text-center">{totalGoals + totalAssists}</td>
                            {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                <td key={s.key} className="p-2 text-center">{teamTotals[s.key] || 0}</td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const GameReport: React.FC<GameReportProps> = ({ game, onClose, currentUser, onUpdateGame }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedGame, setEditedGame] = useState<Game>(game);

    useEffect(() => {
        setEditedGame(game);
    }, [game]);

    const playerStats = useMemo(() => {
        const statsByPlayer: { [playerId: string]: { [key in StatType]?: number } } = {};

        [...game.homeTeam.roster, ...game.awayTeam.roster].forEach(p => {
            statsByPlayer[p.id] = {};
        });

        game.stats.forEach(stat => {
            if (!statsByPlayer[stat.playerId]) statsByPlayer[stat.playerId] = {};

            statsByPlayer[stat.playerId][stat.type] = (statsByPlayer[stat.playerId][stat.type] || 0) + 1;

            if (stat.type === StatType.GOAL && stat.assistingPlayerId) {
                if (!statsByPlayer[stat.assistingPlayerId]) statsByPlayer[stat.assistingPlayerId] = {};
                statsByPlayer[stat.assistingPlayerId][StatType.ASSIST] = (statsByPlayer[stat.assistingPlayerId][StatType.ASSIST] || 0) + 1;
            }
        });
        return statsByPlayer;
    }, [game.stats, game.homeTeam.roster, game.awayTeam.roster]);

    const handleSave = () => {
        onUpdateGame(editedGame);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedGame(game);
        setIsEditing(false);
    };

    const handleScoreChange = (team: 'home' | 'away', delta: number) => {
        setEditedGame(prev => ({
            ...prev,
            score: {
                ...prev.score,
                [team]: Math.max(0, prev.score[team] + delta)
            }
        }));
    };

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.COACH;

    return (
        <div>
            <style>
                {`
                @media print {
                    body {
                        background-color: #fff;
                    }
                    .no-print {
                        display: none;
                    }
                    .print-area {
                        box-shadow: none !important;
                        border: none !important;
                        color: #000 !important;
                    }
                    .print-area h1, .print-area h2, .print-area h3, .print-area p, .print-area td, .print-area th {
                        color: #000 !important;
                    }
                    .print-area .bg-white {
                        background-color: #fff !important;
                    }
                     .print-area .bg-gray-50 {
                        background-color: #f9fafb !important;
                    }
                }
                `}
            </style>
            <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg">Save Changes</button>
                        <button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg">Cancel</button>
                    </>
                ) : (
                    <>
                        {canEdit && <button onClick={() => setIsEditing(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg shadow-lg">Edit Game</button>}
                        <button onClick={() => window.print()} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg">Print Report</button>
                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg">Close</button>
                    </>
                )}
            </div>

            <div className="print-area max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-2xl text-gray-900">
                {isEditing && (
                    <div className="no-print bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-r-lg">
                        <p className="font-bold">Editing Mode</p>
                        <p>You are currently editing this game report. Changes are not saved until you click "Save Changes".</p>
                    </div>
                )}
                <header className="text-center mb-8 border-b-2 border-gray-200 pb-4">
                    <h1 className="text-4xl font-bold text-gray-800">Official Game Report</h1>
                    <p className="text-lg text-gray-600 mt-2">{new Date(game.scheduledTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </header>

                <div className="flex justify-around items-center text-center mb-8">
                    <div className="w-2/5">
                        <h2 className="text-3xl font-bold truncate">{game.homeTeam.name}</h2>
                    </div>
                    <div className="w-1/5">
                        {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleScoreChange('home', -1)} className="bg-gray-200 p-1 rounded-full">-</button>
                                <span className="text-5xl font-mono font-bold text-cyan-600">{editedGame.score.home}</span>
                                <button onClick={() => handleScoreChange('home', 1)} className="bg-gray-200 p-1 rounded-full">+</button>
                                <span className="text-5xl font-mono font-bold text-cyan-600">-</span>
                                <button onClick={() => handleScoreChange('away', -1)} className="bg-gray-200 p-1 rounded-full">-</button>
                                <span className="text-5xl font-mono font-bold text-cyan-600">{editedGame.score.away}</span>
                                <button onClick={() => handleScoreChange('away', 1)} className="bg-gray-200 p-1 rounded-full">+</button>
                            </div>
                        ) : (
                            <p className="text-5xl font-mono font-bold text-cyan-600">{game.score.home} - {game.score.away}</p>
                        )}
                    </div>
                    <div className="w-2/5">
                        <h2 className="text-3xl font-bold truncate">{game.awayTeam.name}</h2>
                    </div>
                </div>

                {isEditing ? (
                    <div className="no-print mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit AI Game Summary</h2>
                        <textarea
                            value={editedGame.aiSummary || ''}
                            onChange={(e) => setEditedGame(prev => ({ ...prev, aiSummary: e.target.value }))}
                            rows={8}
                            className="w-full bg-white text-gray-800 p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                ) : game.aiSummary && (
                    <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Game Summary</h2>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{game.aiSummary}</p>
                    </div>
                )}

                {isEditing ? (
                    <div className="no-print mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Correction Notes</h2>
                        <textarea
                            value={editedGame.correctionNotes || ''}
                            onChange={(e) => setEditedGame(prev => ({ ...prev, correctionNotes: e.target.value }))}
                            placeholder="e.g., Corrected final score due to a missed goal entry in the 3rd period."
                            rows={3}
                            className="w-full bg-white text-gray-800 p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                ) : game.correctionNotes && (
                    <div className="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                        <h2 className="text-2xl font-bold text-yellow-800 mb-2">Correction Notes</h2>
                        <p className="text-yellow-700 whitespace-pre-wrap leading-relaxed">{game.correctionNotes}</p>
                    </div>
                )}


                <div className="space-y-8">
                    <ReportStatsTable team={game.homeTeam} playerStats={playerStats} />
                    <ReportStatsTable team={game.awayTeam} playerStats={playerStats} />
                </div>
            </div>
        </div>
    );
};

export default GameReport;

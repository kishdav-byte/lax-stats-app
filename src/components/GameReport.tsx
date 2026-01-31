import React, { useMemo, useState, useEffect } from 'react';
import { Game, Team, StatType, User, Role } from '../types';
import { Printer, X, Edit3, Save, Check, Shield, FileText, BarChart3, Binary, Cpu } from 'lucide-react';

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
        <div className="bg-black border border-surface-border overflow-hidden">
            <div className="bg-surface-card p-4 border-b border-surface-border">
                <h3 className="text-sm font-mono font-black text-brand uppercase tracking-[0.3em] flex items-center gap-2">
                    <Shield className="w-4 h-4" /> TEAM STATS // {team.name}
                </h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead className="bg-black/40 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                        <tr>
                            <th className="p-4 border-b border-surface-border">#</th>
                            <th className="p-4 border-b border-surface-border">PLAYER</th>
                            <th className="p-4 border-b border-surface-border">POS</th>
                            <th className="p-4 text-center border-b border-surface-border text-white">G</th>
                            <th className="p-4 text-center border-b border-surface-border text-white">A</th>
                            <th className="p-4 text-center border-b border-surface-border text-white">P</th>
                            {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                <th key={s.key} className="p-4 text-center border-b border-surface-border">{s.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/30">
                        {team.roster.map(player => {
                            const stats = playerStats[player.id] || {};
                            const goals = stats[StatType.GOAL] || 0;
                            const assists = stats[StatType.ASSIST] || 0;
                            const points = goals + assists;
                            return (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs text-brand">#{player.jerseyNumber}</td>
                                    <td className="p-4 font-display font-bold text-white uppercase italic text-sm">{player.name}</td>
                                    <td className="p-4 font-mono text-[10px] text-gray-600 uppercase tracking-tighter">{player.position}</td>
                                    <td className="p-4 text-center font-bold text-white">{goals}</td>
                                    <td className="p-4 text-center font-bold text-white">{assists}</td>
                                    <td className="p-4 text-center font-black text-brand italic">{points}</td>
                                    {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                        <td key={s.key} className="p-4 text-center font-mono text-[10px] text-gray-500">{(stats[s.key] || 0)}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-surface-card/20 font-display italic font-black text-white uppercase text-xs">
                        <tr>
                            <td colSpan={3} className="p-4 text-right text-gray-600 tracking-widest font-mono">TEAM TOTALS</td>
                            <td className="p-4 text-center text-brand underline">{totalGoals}</td>
                            <td className="p-4 text-center text-brand underline">{totalAssists}</td>
                            <td className="p-4 text-center text-brand underline underline-offset-4 decoration-2">{totalGoals + totalAssists}</td>
                            {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                <td key={s.key} className="p-4 text-center font-mono text-gray-600">{teamTotals[s.key] || 0}</td>
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

    useEffect(() => { setEditedGame(game); }, [game]);

    const playerStats = useMemo(() => {
        const statsByPlayer: { [playerId: string]: { [key in StatType]?: number } } = {};
        [...game.homeTeam.roster, ...game.awayTeam.roster].forEach(p => { statsByPlayer[p.id] = {}; });
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

    const handleSave = () => { onUpdateGame(editedGame); setIsEditing(false); };
    const handleCancel = () => { setEditedGame(game); setIsEditing(false); };
    const handleScoreChange = (team: 'home' | 'away', delta: number) => {
        setEditedGame(prev => ({ ...prev, score: { ...prev.score, [team]: Math.max(0, prev.score[team] + delta) } }));
    };

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.COACH;

    return (
        <div className="bg-black min-h-screen">
            <style>
                {`
                @media print {
                    body { background-color: #fff !important; color: #000 !important; }
                    .no-print { display: none !important; }
                    .print-area { box-shadow: none !important; border: none !important; color: #000 !important; max-width: 100% !important; padding: 0 !important; }
                    .print-area h1, .print-area h2, .print-area h3, .print-area p, .print-area td, .print-area th { color: #000 !important; border-color: #ccc !important; }
                    .print-area .bg-black { background-color: #fff !important; }
                    .print-area .bg-surface-card { background-color: #f5f5f5 !important; }
                    .print-area span.text-brand { color: #ff5722 !important; font-weight: bold; }
                    .cyber-card { border: 1px solid #ccc !important; }
                }
                `}
            </style>

            {/* Header / Actions */}
            <div className="no-print bg-black/80 backdrop-blur-md sticky top-0 z-[100] border-b border-surface-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-brand" />
                        <h1 className="text-sm font-mono font-black text-white uppercase tracking-[0.4em]">GAME REPORT // {game.id.substring(0, 8).toUpperCase()}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className="cyber-button py-2 px-6 text-[10px] flex items-center gap-2">SAVE CHANGES <Save className="w-4 h-4" /></button>
                                <button onClick={handleCancel} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white px-4">Cancel</button>
                            </>
                        ) : (
                            <>
                                {canEdit && (
                                    <button onClick={() => setIsEditing(true)} className="cyber-button-outline py-2 px-6 text-[10px] flex items-center gap-2">
                                        EDIT REPORT <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => window.print()} className="bg-white text-black px-6 py-2 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all flex items-center gap-2">
                                    PRINT <Printer className="w-4 h-4" />
                                </button>
                                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">
                                    <X className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="print-area max-w-5xl mx-auto p-8 sm:p-12 space-y-12">
                {isEditing && (
                    <div className="no-print p-4 bg-brand/5 border-l-2 border-brand mb-12 flex items-center gap-4">
                        <Binary className="w-5 h-5 text-brand animate-pulse" />
                        <p className="text-[10px] font-mono text-brand uppercase tracking-widest">EDIT MODE ACTIVE: You can now adjust game data.</p>
                    </div>
                )}

                <header className="text-center relative py-12">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-brand to-transparent"></div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-4">Official Game Record</p>
                    <h1 className="text-6xl font-display font-black text-white italic uppercase tracking-tighter mb-4">GAME <span className="text-brand">REPORT</span></h1>
                    <p className="text-sm font-mono text-white/50 uppercase tracking-widest">
                        {new Date(game.scheduledTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </header>

                <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-12 border-y border-surface-border py-12">
                    <div className="text-right">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4">{game.homeTeam.name}</h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Home Team</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-6">
                            {isEditing ? (
                                <div className="flex items-center gap-4 bg-surface-card p-4 border border-surface-border">
                                    <button onClick={() => handleScoreChange('home', -1)} className="text-brand hover:text-white"><X className="w-4 h-4 rotate-45" /></button>
                                    <span className="text-7xl font-mono font-black text-white">{editedGame.score.home}</span>
                                    <button onClick={() => handleScoreChange('home', 1)} className="text-brand hover:text-white"><Check className="w-4 h-4" /></button>
                                    <span className="text-4xl font-mono font-black text-gray-700">/</span>
                                    <button onClick={() => handleScoreChange('away', -1)} className="text-brand hover:text-white"><X className="w-4 h-4 rotate-45" /></button>
                                    <span className="text-7xl font-mono font-black text-white">{editedGame.score.away}</span>
                                    <button onClick={() => handleScoreChange('away', 1)} className="text-brand hover:text-white"><Check className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-8xl font-display font-black text-white italic tracking-tighter shadow-brand/20 drop-shadow-2xl">{game.score.home}</span>
                                    <span className="text-4xl font-mono font-black text-brand opacity-30">V</span>
                                    <span className="text-8xl font-display font-black text-white italic tracking-tighter shadow-brand/20 drop-shadow-2xl">{game.score.away}</span>
                                </>
                            )}
                        </div>
                        <div className="h-px bg-brand w-20 mt-6 blur-[1px]"></div>
                    </div>

                    <div className="text-left">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4">{game.awayTeam.name}</h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Away Team</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="cyber-card p-1">
                        <div className="bg-black p-8 border border-surface-border h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <Cpu className="w-5 h-5 text-brand" />
                                <h3 className="text-lg font-display font-black text-white italic uppercase tracking-tighter">AI SUMMARY</h3>
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={editedGame.aiSummary || ''}
                                    onChange={(e) => setEditedGame(prev => ({ ...prev, aiSummary: e.target.value }))}
                                    className="w-full bg-surface-card border border-surface-border p-4 font-mono text-[11px] text-gray-300 custom-scrollbar uppercase tracking-wider"
                                    rows={10}
                                />
                            ) : (
                                <div className="font-mono text-[11px] text-gray-400 leading-relaxed uppercase tracking-wider whitespace-pre-wrap">
                                    {game.aiSummary || 'NO AI SUMMARY GENERATED'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="cyber-card p-1 border-brand/20">
                            <div className="bg-black p-8 border border-surface-border">
                                <div className="flex items-center gap-3 mb-6">
                                    <Binary className="w-5 h-5 text-brand" />
                                    <h3 className="text-lg font-display font-black text-white italic uppercase tracking-tighter">NOTES / CORRECTIONS</h3>
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editedGame.correctionNotes || ''}
                                        onChange={(e) => setEditedGame(prev => ({ ...prev, correctionNotes: e.target.value }))}
                                        placeholder="Add notes or corrections here..."
                                        className="w-full bg-surface-card border border-surface-border p-4 font-mono text-[11px] text-gray-300 custom-scrollbar uppercase tracking-wider"
                                        rows={4}
                                    />
                                ) : (
                                    <div className={`p-4 font-mono text-[11px] leading-relaxed uppercase tracking-wider ${game.correctionNotes ? 'text-brand italic bg-brand/5 border-l border-brand' : 'text-gray-600 italic'}`}>
                                        {game.correctionNotes || 'NO NOTES LOGGED'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-surface-card border border-surface-border p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
                            <p className="text-[10px] font-mono text-gray-500 uppercase mb-2 tracking-[0.2em]">Game ID Verification</p>
                            <p className="text-[9px] font-mono text-brand font-black break-all uppercase opacity-40">ID: {game.id.replace(/-/g, '')}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-12 pt-12">
                    <div className="flex items-center gap-4">
                        <BarChart3 className="w-5 h-5 text-brand" />
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Team <span className="text-brand">Performance</span></h2>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </div>
                    <ReportStatsTable team={game.homeTeam} playerStats={playerStats} />
                    <ReportStatsTable team={game.awayTeam} playerStats={playerStats} />
                </div>

                <footer className="text-center pt-24 pb-12 opacity-30">
                    <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-gray-500">Lax Stats AI Analysis // End of Report</p>
                </footer>
            </div>
        </div>
    );
};

export default GameReport;

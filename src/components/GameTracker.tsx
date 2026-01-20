import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Game, StatType, Stat, Player, Team, Penalty, PenaltyType } from '../types';
import { generateGameSummary } from '../services/geminiService';
import { Timer, Trophy, ShieldAlert, Binary, Plus, Activity, Cpu, ChevronRight, Zap } from 'lucide-react';

interface GameTrackerProps {
    game: Game;
    onUpdateGame: (game: Game) => void;
    onReturnToDashboard: () => void;
    onViewReport: (game: Game) => void;
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

const StatsTable: React.FC<{ team: Team, playerStats: { [playerId: string]: { [key in StatType]?: number } } }> = ({ team, playerStats }) => {

    const teamTotals = STAT_DEFINITIONS.reduce((acc, statDef) => {
        acc[statDef.key] = team.roster.reduce((sum, player) => sum + (playerStats[player.id]?.[statDef.key] || 0), 0);
        return acc;
    }, {} as { [key in StatType]?: number });

    const totalGoals = teamTotals[StatType.GOAL] || 0;
    const totalAssists = teamTotals[StatType.ASSIST] || 0;

    return (
        <div className="cyber-card p-1">
            <div className="bg-black p-6 border border-surface-border">
                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3">
                    {team.name} // <span className="text-brand text-sm">FINAL_METRICS</span>
                </h3>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead className="bg-surface-card border-b border-white/10">
                            <tr>
                                <th className="p-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">#</th>
                                <th className="p-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">ENTITY</th>
                                <th className="p-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">POS</th>
                                <th className="p-2 text-center text-[9px] font-mono text-brand uppercase tracking-widest">G</th>
                                <th className="p-2 text-center text-[9px] font-mono text-brand uppercase tracking-widest">A</th>
                                <th className="p-2 text-center text-[9px] font-mono text-brand uppercase tracking-widest">P</th>
                                {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                    <th key={s.key} className="p-2 text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {team.roster.map(player => {
                                const stats = playerStats[player.id] || {};
                                const goals = stats[StatType.GOAL] || 0;
                                const assists = stats[StatType.ASSIST] || 0;
                                const points = goals + assists;
                                return (
                                    <tr key={player.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors">
                                        <td className="p-2 font-mono text-xs text-brand">#{player.jerseyNumber}</td>
                                        <td className="p-2 font-display font-bold text-white uppercase italic text-sm">{player.name}</td>
                                        <td className="p-2 font-mono text-[10px] text-gray-500 uppercase">{player.position}</td>
                                        <td className="p-2 text-center font-bold text-white">{goals}</td>
                                        <td className="p-2 text-center font-bold text-white">{assists}</td>
                                        <td className="p-2 text-center font-black text-brand italic">{points}</td>
                                        {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                            <td key={s.key} className="p-2 text-center font-mono text-xs text-gray-400">{(stats[s.key] || 0)}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-surface-card/50 border-t-2 border-brand/20">
                            <tr className="font-display italic font-black text-white uppercase">
                                <td colSpan={3} className="p-3 text-right text-xs tracking-widest text-gray-500">AGGREGATE_TOTALS</td>
                                <td className="p-3 text-center text-brand">{totalGoals}</td>
                                <td className="p-3 text-center text-brand">{totalAssists}</td>
                                <td className="p-3 text-center text-brand underline decoration-brand/50">{totalGoals + totalAssists}</td>
                                {STAT_DEFINITIONS.filter(s => s.key !== StatType.GOAL && s.key !== StatType.ASSIST).map(s => (
                                    <td key={s.key} className="p-3 text-center text-gray-400 font-mono text-xs">{teamTotals[s.key] || 0}</td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

const RosterColumn: React.FC<{
    team: Game['homeTeam'];
    onSelectPlayer: (player: Player, teamId: string) => void;
    selectedPlayerId: string | null;
}> = ({ team, onSelectPlayer, selectedPlayerId }) => (
    <div className="space-y-3">
        <h3 className="text-xs font-mono font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center border-b border-surface-border pb-2">{team.name} // UNITS</h3>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {team.roster.map(player => (
                <div
                    key={player.id}
                    onClick={() => onSelectPlayer(player, team.id)}
                    className={`p-3 border transition-all duration-300 cursor-pointer group flex items-baseline gap-3 ${selectedPlayerId === player.id
                        ? 'bg-brand/10 border-brand shadow-[inset_0_0_15px_rgba(255,87,34,0.1)]'
                        : 'bg-black border-surface-border hover:border-brand/40'
                        }`}
                >
                    <span className={`font-mono text-[10px] font-black group-hover:text-brand transition-colors ${selectedPlayerId === player.id ? 'text-brand' : 'text-gray-600'}`}>#{player.jerseyNumber}</span>
                    <span className={`font-display font-bold uppercase italic text-sm tracking-tight transition-colors ${selectedPlayerId === player.id ? 'text-white' : 'text-gray-400'}`}>{player.name}</span>
                </div>
            ))}
        </div>
    </div>
);

const StatEntryButton: React.FC<{ label: string, onClick: () => void, className?: string }> = ({ label, onClick, className }) => (
    <button
        onClick={onClick}
        className={`p-4 font-display font-black italic uppercase tracking-tighter text-sm transition-all duration-300 relative group overflow-hidden border border-black/10 ${className}`}
    >
        <span className="relative z-10">{label}</span>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
);

const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const PenaltyBox: React.FC<{ penalties: Penalty[], clock: number, homeTeam: Team, awayTeam: Team }> = ({ penalties, clock, homeTeam, awayTeam }) => {
    const activePenalties = penalties.filter(p => clock > p.releaseTime).sort((a, b) => a.releaseTime - b.releaseTime);

    const getPlayerInfo = (playerId: string, teamId: string) => {
        const team = teamId === homeTeam.id ? homeTeam : awayTeam;
        return { teamName: team.name, player: team.roster.find(p => p.id === playerId) };
    };

    if (activePenalties.length === 0) return null;

    return (
        <div className="my-6 cyber-card p-1 border-yellow-500/50 bg-yellow-500/5">
            <div className="bg-black p-4 border border-yellow-500/20">
                <h3 className="text-xs font-mono font-black text-yellow-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4" /> PENALTY_ARRAY_STATUS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activePenalties.map(penalty => {
                        const { teamName, player } = getPlayerInfo(penalty.playerId, penalty.teamId);
                        const remainingTime = clock - penalty.releaseTime;
                        return (
                            <div key={penalty.id} className="bg-surface-card border border-surface-border p-3 flex flex-col items-center">
                                <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">{teamName} // #{player?.jerseyNumber}</p>
                                <p className="font-display font-bold text-white uppercase italic text-xs mb-3 truncate w-full text-center">{player?.name}</p>
                                <p className="text-[14px] font-mono font-black text-yellow-500 tracking-tighter shadow-yellow-500/20">{formatTime(remainingTime)}</p>
                                <p className="text-[8px] font-mono text-yellow-500/50 uppercase mt-1">RELEASE_TMINUS</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const PenaltyModal: React.FC<{
    isOpen: boolean;
    player: Player;
    teamName: string;
    onClose: () => void;
    onAddPenalty: (penaltyType: PenaltyType, duration: number) => void;
}> = ({ isOpen, player, teamName, onClose, onAddPenalty }) => {
    const [type, setType] = useState<PenaltyType>(PenaltyType.SLASHING);
    const [duration, setDuration] = useState(30);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-mono">
            <div className="cyber-card p-8 max-w-md w-full border-yellow-500">
                <div className="flex items-center gap-4 mb-8">
                    <ShieldAlert className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">INFRACTION // <span className="text-yellow-500">ENTRY</span></h2>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/30">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">TARGET_UNIT</p>
                        <p className="text-white font-display italic font-bold uppercase">{teamName} // #{player.jerseyNumber} {player.name}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">VIOLATION_TYPE</label>
                        <select value={type} onChange={e => setType(e.target.value as PenaltyType)} className="w-full cyber-input appearance-none text-sm">
                            {Object.values(PenaltyType).map(ptype => <option key={ptype} value={ptype} className="bg-black">{ptype.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">TEMPORAL_DURATION</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[30, 60, 90, 120, 180].map(d => (
                                <button key={d} onClick={() => setDuration(d)} className={`py-2 text-[10px] border transition-all ${duration === d ? 'bg-yellow-500 text-black border-yellow-500 font-bold' : 'bg-black text-gray-500 border-surface-border'}`}>
                                    {d}S
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-between gap-6">
                    <button onClick={onClose} className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort</button>
                    <button onClick={() => onAddPenalty(type, duration)} className="cyber-button-outline border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black py-2 px-8 text-xs font-bold">COMMIT_PENALTY</button>
                </div>
            </div>
        </div>
    );
};

const GameSetup: React.FC<{
    game: Game;
    onStartGame: (config: { periodType: 'quarters' | 'halves'; clockType: 'running' | 'stop'; periodLength: number; totalPeriods: number; }) => void;
    onReturnToDashboard: () => void;
}> = ({ game, onStartGame, onReturnToDashboard }) => {
    const [periodType, setPeriodType] = useState<'quarters' | 'halves'>(game.periodType || 'quarters');
    const [clockType, setClockType] = useState<'running' | 'stop'>(game.clockType || 'stop');

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-px bg-brand w-12"></div>
                    <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Battlefield Configuration</p>
                </div>
                <h1 className="text-6xl font-display font-black tracking-tighter text-white uppercase italic">
                    GAME <span className="text-brand">SETUP</span>
                </h1>
            </div>

            <div className="cyber-card p-1 max-w-4xl mx-auto">
                <div className="bg-black p-12 text-center border border-surface-border">
                    <div className="grid md:grid-cols-2 gap-12 mb-12">
                        <div className="space-y-6">
                            <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Temporal Segments</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPeriodType('quarters')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${periodType === 'quarters' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    QUARTERS
                                </button>
                                <button
                                    onClick={() => setPeriodType('halves')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${periodType === 'halves' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    HALVES
                                </button>
                            </div>
                            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{periodType === 'quarters' ? '4x 12-Minute Iterations' : '2x 20-Minute Iterations'}</p>
                        </div>
                        <div className="space-y-6">
                            <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Chronograph Model</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setClockType('stop')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${clockType === 'stop' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    STOP_TIME
                                </button>
                                <button
                                    onClick={() => setClockType('running')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${clockType === 'running' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    RUNNING
                                </button>
                            </div>
                            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Running clock: strictly tournament protocol.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 border-t border-surface-border/30">
                        <button
                            onClick={onReturnToDashboard}
                            className="bg-gray-900 border border-gray-800 text-gray-500 hover:text-white px-12 py-4 text-xs font-mono uppercase tracking-widest transition-all"
                        >
                            Abort_Setup
                        </button>
                        <button
                            onClick={() => onStartGame({
                                periodType,
                                clockType,
                                periodLength: periodType === 'quarters' ? 12 * 60 : 20 * 60,
                                totalPeriods: periodType === 'quarters' ? 4 : 2,
                            })}
                            className="cyber-button px-20 py-4 text-xl flex items-center gap-3 justify-center"
                        >
                            INITIALIZE_COMBAT <Zap className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LiveStatsSummary: React.FC<{
    homeTeam: Team;
    awayTeam: Team;
    playerStats: { [playerId: string]: { [key in StatType]?: number } };
}> = ({ homeTeam, awayTeam, playerStats }) => {
    const calculateTeamTotals = (team: Team) => {
        const totals: { [key in StatType]?: number } = {};
        for (const player of team.roster) {
            const stats = playerStats[player.id];
            if (stats) {
                for (const statType in stats) {
                    totals[statType as StatType] = (totals[statType as StatType] || 0) + stats[statType as StatType]!;
                }
            }
        }
        return totals;
    };

    const homeTotals = calculateTeamTotals(homeTeam);
    const awayTotals = calculateTeamTotals(awayTeam);
    const statsToDisplay: { key: StatType; label: string }[] = [
        { key: StatType.SHOT, label: "BALLISTICS" },
        { key: StatType.SAVE, label: "INTERCEPTIONS" },
        { key: StatType.GROUND_BALL, label: "POSS_RECOVERY" },
        { key: StatType.FACEOFF_WIN, label: "CLASH_WINS" },
        { key: StatType.TURNOVER, label: "OS_ERRORS" },
    ];

    return (
        <div className="cyber-card p-1 border-brand/20">
            <div className="bg-black p-6 border border-surface-border">
                <h3 className="text-xs font-mono font-black text-brand uppercase tracking-[0.3em] mb-6 text-center">LIVE_SIGNAL_ANALYSIS</h3>
                <div className="grid grid-cols-3 gap-4 font-mono">
                    <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-widest underline decoration-brand/30 underline-offset-8 mb-4">{homeTeam.name.toUpperCase()}</div>
                    <div className="text-center text-[10px] font-black text-brand uppercase tracking-widest mb-4">METRIC</div>
                    <div className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest underline decoration-brand/30 underline-offset-8 mb-4">{awayTeam.name.toUpperCase()}</div>

                    {statsToDisplay.map(({ key, label }) => (
                        <React.Fragment key={key}>
                            <div className="text-right text-3xl font-display italic font-black text-white">{homeTotals[key] || 0}</div>
                            <div className="text-center flex flex-col items-center justify-center">
                                <div className="h-px bg-surface-border w-full mb-1"></div>
                                <span className="text-[8px] text-gray-500 uppercase tracking-tighter">{label}</span>
                            </div>
                            <div className="text-left text-3xl font-display italic font-black text-white">{awayTotals[key] || 0}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GameTracker: React.FC<GameTrackerProps> = ({ game, onUpdateGame, onReturnToDashboard, onViewReport }) => {
    const [clock, setClock] = useState(game.gameClock);
    const [isClockRunning, setIsClockRunning] = useState(false);
    const [assistModal, setAssistModal] = useState<{ show: boolean, scoringPlayer: Player | null, scoringTeamId: string | null }>({ show: false, scoringPlayer: null, scoringTeamId: null });
    const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [selectedPlayerInfo, setSelectedPlayerInfo] = useState<{ player: Player; teamId: string } | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playBuzzer = useCallback(() => {
        if (!audioCtxRef.current) {
            try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch (e) { return; }
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.8);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.8);
    }, []);

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.3;
            utterance.pitch = 0.5; // Robotic tone
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    useEffect(() => {
        let timer: number;
        if (isClockRunning && clock > 0) {
            timer = window.setInterval(() => {
                setClock(prevClock => {
                    const newClock = prevClock - 1;
                    if (newClock <= 10 && newClock > 0) speak(String(newClock));
                    else if (newClock === 0) {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        playBuzzer();
                    }
                    return newClock;
                });
            }, 1000);
        }
        return () => {
            clearInterval(timer);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [isClockRunning, clock, playBuzzer, speak]);

    useEffect(() => {
        if (game.gameClock !== clock) onUpdateGame({ ...game, gameClock: clock });
    }, [clock, game, onUpdateGame]);

    const handleStatAdd = useCallback((player: Player, teamId: string, type: StatType, assistingPlayerId?: string) => {
        const newStat: Stat = {
            id: `stat_${Date.now()}`,
            playerId: player.id,
            teamId: teamId,
            type: type,
            timestamp: clock,
            assistingPlayerId
        };
        let newScore = { ...game.score };
        if (type === StatType.GOAL) {
            if (teamId === game.homeTeam.id) newScore.home++;
            else newScore.away++;
        }
        onUpdateGame({ ...game, stats: [...game.stats, newStat], score: newScore });
    }, [game, onUpdateGame, clock]);

    const handleStatButtonClick = (type: StatType) => {
        if (selectedPlayerInfo) {
            handleStatAdd(selectedPlayerInfo.player, selectedPlayerInfo.teamId, type);
            setSelectedPlayerInfo(null);
        }
    };

    const allPlayers = useMemo(() => [...game.homeTeam.roster, ...game.awayTeam.roster], [game.homeTeam.roster, game.awayTeam.roster]);

    const playerStats = useMemo(() => {
        const statsByPlayer: { [playerId: string]: { [key in StatType]?: number } } = {};
        allPlayers.forEach(p => { statsByPlayer[p.id] = {}; });
        game.stats.forEach(stat => {
            if (!statsByPlayer[stat.playerId]) statsByPlayer[stat.playerId] = {};
            statsByPlayer[stat.playerId][stat.type] = (statsByPlayer[stat.playerId][stat.type] || 0) + 1;
            if (stat.type === StatType.GOAL && stat.assistingPlayerId) {
                if (!statsByPlayer[stat.assistingPlayerId]) statsByPlayer[stat.assistingPlayerId] = {};
                statsByPlayer[stat.assistingPlayerId][StatType.ASSIST] = (statsByPlayer[stat.assistingPlayerId][StatType.ASSIST] || 0) + 1;
            }
        });
        return statsByPlayer;
    }, [game.stats, allPlayers]);

    const handleReturnToDashboard = () => {
        setIsClockRunning(false); // Pause the clock before leaving
        onReturnToDashboard();
    };

    if (game.status === 'scheduled') {
        return <GameSetup game={game} onStartGame={(config) => {
            onUpdateGame({ ...game, status: 'live', ...config, gameClock: config.periodLength, currentPeriod: 1 });
            setClock(config.periodLength);
            setIsClockRunning(true);
        }} onReturnToDashboard={onReturnToDashboard} />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-24">
            {/* HUD / Scoreboard */}
            <div className="sticky top-16 z-50 animate-in slide-in-from-top-4 duration-500">
                <div className="cyber-card p-1 border-white/20 bg-black/80 backdrop-blur-xl">
                    <div className="px-12 py-8 flex items-center justify-between gap-12 border border-white/5">
                        <div className="flex-1 text-right">
                            <h2 className="text-sm font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">{game.homeTeam.name}</h2>
                            <p className="text-8xl font-display font-black text-white italic tracking-tighter shadow-[0_0_30px_rgba(255,255,255,0.1)]">{game.score.home}</p>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-1 bg-brand rounded-full animate-ping"></div>
                                <p className="text-[10px] font-mono text-brand uppercase tracking-[0.4em]">Signal_Live</p>
                            </div>
                            <p className={`text-7xl font-mono font-black tracking-tighter ${isClockRunning ? 'text-brand drop-shadow-[0_0_10px_rgba(255,87,34,0.3)]' : 'text-gray-700'}`}>
                                {formatTime(clock)}
                            </p>
                            <div className="flex items-center gap-4 bg-brand/10 border border-brand/30 px-6 py-1">
                                <span className="text-[10px] font-mono font-black text-brand uppercase tracking-widest italic">{game.periodType?.slice(0, -1) || 'Period'} {game.currentPeriod}</span>
                            </div>
                        </div>

                        <div className="flex-1 text-left">
                            <h2 className="text-sm font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">{game.awayTeam.name}</h2>
                            <p className="text-8xl font-display font-black text-white italic tracking-tighter shadow-[0_0_30px_rgba(255,255,255,0.1)]">{game.score.away}</p>
                        </div>
                    </div>

                    {/* Control HUD Overlay */}
                    <div className="bg-surface-card border-t border-white/10 p-4 flex flex-wrap items-center justify-center gap-6">
                        <button onClick={() => setIsClockRunning(!isClockRunning)} className={`flex items-center gap-3 px-8 py-2 font-display italic font-black text-xs uppercase tracking-widest transition-all ${isClockRunning ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'}`}>
                            {isClockRunning ? 'HALT_CHRONO' : 'INIT_CHRONO'}
                            {isClockRunning ? <Timer className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        </button>

                        <div className="flex items-center gap-4 border-x border-white/10 px-6">
                            <button onClick={() => onUpdateGame({ ...game, currentPeriod: Math.max(1, game.currentPeriod - 1) })} className="p-1 text-gray-500 hover:text-white"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                            <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest">SEG_INCR</span>
                            <button onClick={() => onUpdateGame({ ...game, currentPeriod: Math.min(game.totalPeriods || 4, game.currentPeriod + 1) })} className="p-1 text-gray-500 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setClock(game.periodLength || 720)} className="text-[10px] font-mono font-black text-gray-500 uppercase hover:text-brand transition-colors p-2">RESET_T</button>
                            <button onClick={() => setClock(p => Math.max(0, p - 10))} className="text-[10px] font-mono font-black text-gray-500 hover:text-brand transition-colors p-2">-10S</button>
                            <button onClick={() => setClock(p => p + 10)} className="text-[10px] font-mono font-black text-gray-500 hover:text-brand transition-colors p-2">+10S</button>
                        </div>

                        {game.status !== 'finished' && (
                            <button onClick={() => { if (window.confirm("TERMINATE OPERATION?")) onUpdateGame({ ...game, status: 'finished', gameClock: 0 }); }} className="bg-red-900 border border-red-500/50 text-white px-6 py-2 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                                END_COMBAT
                            </button>
                        )}
                        <button onClick={onReturnToDashboard} className="text-[10px] font-mono font-black text-gray-500 hover:text-white uppercase tracking-widest ml-4">CMD_RETURN</button>
                    </div>
                </div>
            </div>

            <PenaltyBox penalties={game.penalties || []} clock={clock} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />

            {game.status === 'live' ? (
                <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-8 mt-12">
                    <RosterColumn team={game.homeTeam} onSelectPlayer={(p, t) => setSelectedPlayerInfo({ player: p, teamId: t })} selectedPlayerId={selectedPlayerInfo?.player.id ?? null} />

                    <div className="space-y-8">
                        {/* Tactical Stat Entry */}
                        <div className="cyber-card p-1 border-brand h-full min-h-[400px]">
                            <div className="bg-black p-8 border border-brand/30 h-full flex flex-col">
                                {selectedPlayerInfo ? (
                                    <div className="flex-grow flex flex-col animate-in fade-in duration-300">
                                        <div className="mb-8 border-b border-surface-border pb-4">
                                            <p className="text-[10px] font-mono italic text-brand uppercase tracking-[0.2em] mb-1">Target_Unit_Selected</p>
                                            <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">#{selectedPlayerInfo.player.jerseyNumber} {selectedPlayerInfo.player.name}</h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{selectedPlayerInfo.teamId === game.homeTeam.id ? game.homeTeam.name : game.awayTeam.name}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            <StatEntryButton label="GOAL" onClick={() => { setIsClockRunning(false); setAssistModal({ show: true, scoringPlayer: selectedPlayerInfo.player, scoringTeamId: selectedPlayerInfo.teamId }); }} className="bg-green-500 text-black h-20" />
                                            <StatEntryButton label="SHOT_ON_TRG" onClick={() => handleStatButtonClick(StatType.SHOT)} className="bg-white/10 text-white border-white/20 h-20" />
                                            <StatEntryButton label="GB_RECOVERY" onClick={() => handleStatButtonClick(StatType.GROUND_BALL)} className="bg-brand text-black" />
                                            <StatEntryButton label="LOSS_OF_POSS" onClick={() => handleStatButtonClick(StatType.TURNOVER)} className="bg-red-500 text-black" />
                                            <StatEntryButton label="CAUSED_ERR" onClick={() => handleStatButtonClick(StatType.CAUSED_TURNOVER)} className="bg-blue-500 text-black" />
                                            <StatEntryButton label="INFRACTION" onClick={() => setIsPenaltyModalOpen(true)} className="bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]" />
                                            <StatEntryButton label="CLASH_WIN" onClick={() => handleStatButtonClick(StatType.FACEOFF_WIN)} className="bg-teal-500 text-black" />
                                            <StatEntryButton label="CLASH_LOSS" onClick={() => handleStatButtonClick(StatType.FACEOFF_LOSS)} className="bg-gray-800 text-gray-400" />
                                        </div>

                                        <button onClick={() => setSelectedPlayerInfo(null)} className="w-full py-4 text-[10px] font-mono text-gray-700 uppercase hover:text-white border-t border-surface-border mt-auto">TERMINATE_SELECTION</button>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20">
                                        <Activity className="w-16 h-16 mb-4 text-brand animate-pulse" />
                                        <p className="font-mono text-[10px] uppercase tracking-[0.4em] max-w-[200px]">Awaiting Entity Identification Protocol...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <LiveStatsSummary homeTeam={game.homeTeam} awayTeam={game.awayTeam} playerStats={playerStats} />
                    </div>

                    <RosterColumn team={game.awayTeam} onSelectPlayer={(p, t) => setSelectedPlayerInfo({ player: p, teamId: t })} selectedPlayerId={selectedPlayerInfo?.player.id ?? null} />
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="cyber-card p-1">
                        <div className="bg-black p-12 text-center border border-brand/50">
                            <Trophy className="w-16 h-16 text-brand mx-auto mb-6" />
                            <h2 className="text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-8">OPERATION <span className="text-brand">ARCHIVED</span></h2>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <button onClick={() => onViewReport(game)} className="cyber-button px-12 py-4 text-xl">VIEW_SYNTHESIS_REPORT</button>
                                <button onClick={handleReturnToDashboard} className="cyber-button-outline px-12 py-4 text-xl">EXIT_COMMAND</button>
                            </div>
                        </div>
                    </div>

                    {game.aiSummary ? (
                        <div className="cyber-card p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <Cpu className="w-6 h-6 text-brand" />
                                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">NEURAL <span className="text-brand">SYNOPSIS</span></h2>
                                <div className="h-px bg-surface-border flex-grow"></div>
                            </div>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-sm font-mono text-gray-300 leading-relaxed uppercase tracking-wide whitespace-pre-wrap">{game.aiSummary}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="cyber-card p-12 text-center border-dashed">
                            <button onClick={async () => { setIsGeneratingSummary(true); const s = await generateGameSummary(game); onUpdateGame({ ...game, aiSummary: s }); setIsGeneratingSummary(false); }} disabled={isGeneratingSummary} className="cyber-button px-12 py-4 flex items-center gap-4 mx-auto disabled:opacity-50">
                                {isGeneratingSummary ? <Cpu className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                                {isGeneratingSummary ? 'SYNTHESIZING...' : 'GENERATE_AI_SUMMARY'}
                            </button>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <Binary className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">CHRONO <span className="text-brand">LOG</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>
                        <div className="cyber-card h-80 overflow-y-auto custom-scrollbar bg-surface-card p-6">
                            {game.stats.slice().sort((a, b) => b.timestamp - a.timestamp).map(stat => {
                                const p = allPlayers.find(pl => pl.id === stat.playerId);
                                const t = stat.teamId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
                                return (
                                    <div key={stat.id} className="flex gap-4 border-b border-surface-border py-2 text-[10px] font-mono group hover:bg-white/5 transition-colors">
                                        <span className="text-gray-600">[{formatTime(stat.timestamp)}]</span>
                                        <span className="text-brand font-bold">{t.name.toUpperCase()}</span>
                                        <span className="text-white">#{p?.jerseyNumber} {p?.name.toUpperCase()}</span>
                                        <span className="text-gray-500 ml-auto">{stat.type.replace('_', ' ')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <StatsTable team={game.homeTeam} playerStats={playerStats} />
                    <StatsTable team={game.awayTeam} playerStats={playerStats} />
                </div>
            )}

            {/* Modals integrated with cyber style */}
            {assistModal.show && assistModal.scoringPlayer && assistModal.scoringTeamId && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-xs font-mono">
                    <div className="cyber-card p-8 max-w-2xl w-full border-brand">
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter mb-4">ASSIST_PROTOCOL // <span className="text-brand">SELECT_SOURCE</span></h2>
                        <p className="text-gray-500 uppercase tracking-widest mb-8 font-mono">IDENTIFY PRIMARY SOURCE FOR GOAL AT {formatTime(clock)} BY {assistModal.scoringPlayer.name.toUpperCase()}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                            {(assistModal.scoringTeamId === game.homeTeam.id ? game.homeTeam.roster : game.awayTeam.roster)
                                .filter(p => p.id !== assistModal.scoringPlayer!.id)
                                .map(p => (
                                    <button key={p.id} onClick={() => { handleStatAdd(assistModal.scoringPlayer!, assistModal.scoringTeamId!, StatType.GOAL, p.id); setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); setSelectedPlayerInfo(null); }} className="bg-surface-card border border-surface-border hover:border-brand p-4 text-left transition-all">
                                        <div className="text-brand text-[10px] font-black pb-1">#{p.jerseyNumber}</div>
                                        <div className="text-white uppercase italic font-bold tracking-tight">{p.name}</div>
                                    </button>
                                ))}
                        </div>
                        <div className="mt-12 flex justify-between border-t border-surface-border pt-6">
                            <button onClick={() => { handleStatAdd(assistModal.scoringPlayer!, assistModal.scoringTeamId!, StatType.GOAL); setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); setSelectedPlayerInfo(null); }} className="text-gray-500 hover:text-white uppercase tracking-widest">UNASSISTED_GOAL</button>
                            <button onClick={() => { setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); setIsClockRunning(true); }} className="text-red-500 uppercase tracking-widest font-black">ABORT</button>
                        </div>
                    </div>
                </div>
            )}

            {isPenaltyModalOpen && selectedPlayerInfo && (
                <PenaltyModal
                    isOpen={isPenaltyModalOpen}
                    player={selectedPlayerInfo.player}
                    teamName={selectedPlayerInfo.teamId === game.homeTeam.id ? game.homeTeam.name : game.awayTeam.name}
                    onClose={() => setIsPenaltyModalOpen(false)}
                    onAddPenalty={(type, duration) => {
                        const newPenalty: Penalty = { id: `penalty_${Date.now()}`, playerId: selectedPlayerInfo.player.id, teamId: selectedPlayerInfo.teamId, type, duration, startTime: clock, releaseTime: clock - duration };
                        onUpdateGame({ ...game, penalties: [...(game.penalties || []), newPenalty] });
                        setIsPenaltyModalOpen(false); setSelectedPlayerInfo(null);
                    }}
                />
            )}
        </div>
    );
};

export default GameTracker;

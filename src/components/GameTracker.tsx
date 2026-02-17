import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Game, StatType, Stat, Player, Team, Penalty, PenaltyType, User } from '../types';
import { Trophy, ShieldAlert, Plus, Activity, ChevronRight, Zap, Trash2, Pin } from 'lucide-react';
import { Role } from '../types';

interface GameTrackerProps {
    game: Game;
    currentUser: User | null;
    onUpdateGame: (game: Game) => void;
    onSaveStat: (stat: Stat) => void;
    onDeleteStat: (statId: string) => void;
    onSavePenalty: (penalty: Penalty) => void;
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
                    {team.name} // <span className="text-brand text-sm">STATS</span>
                </h3>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead className="bg-surface-card border-b border-white/10">
                            <tr>
                                <th className="p-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">#</th>
                                <th className="p-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">PLAYER</th>
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
                                <td colSpan={3} className="p-3 text-right text-xs tracking-widest text-gray-500">TOTALS</td>
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
                    <ShieldAlert className="w-4 h-4" /> PENALTIES ACTIVE
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
                                <p className="text-[8px] font-mono text-yellow-500/50 uppercase mt-1">TIME REMAINING</p>
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
                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">PENALTY // <span className="text-yellow-500">REPORT</span></h2>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/30">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">PLAYER</p>
                        <p className="text-white font-display italic font-bold uppercase">{teamName} // #{player.jerseyNumber} {player.name}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">PENALTY TYPE</label>
                        <select value={type} onChange={e => setType(e.target.value as PenaltyType)} className="w-full cyber-input appearance-none text-sm">
                            {Object.values(PenaltyType).map(ptype => <option key={ptype} value={ptype} className="bg-black">{ptype.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">PENALTY TIME</label>
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
                    <button onClick={onClose} className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button onClick={() => onAddPenalty(type, duration)} className="cyber-button-outline border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black py-2 px-8 text-xs font-bold">ADD PENALTY</button>
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
                    <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Game Configuration</p>
                </div>
                <h1 className="text-6xl font-display font-black tracking-tighter text-white uppercase italic">
                    GAME <span className="text-brand">SETUP</span>
                </h1>
                <div className="mt-6 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                    <span className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">{game.homeTeam.name}</span>
                    <div className="flex flex-col items-center">
                        <div className="h-4 w-px bg-brand/20 mb-1"></div>
                        <span className="text-[10px] font-mono text-brand font-black tracking-widest bg-brand/10 px-3 py-1 rounded-full border border-brand/20">VS</span>
                        <div className="h-4 w-px bg-brand/20 mt-1"></div>
                    </div>
                    <span className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">{game.awayTeam.name}</span>
                </div>
            </div>

            <div className="cyber-card p-1 max-w-4xl mx-auto">
                <div className="bg-black p-12 text-center border border-surface-border">
                    <div className="grid md:grid-cols-2 gap-12 mb-12">
                        <div className="space-y-6">
                            <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Game Segments</p>
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
                            <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Time Mode</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setClockType('stop')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${clockType === 'stop' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    STOP_CLOCK
                                </button>
                                <button
                                    onClick={() => setClockType('running')}
                                    className={`cyber-button-outline py-4 font-display italic font-black text-xl transition-all ${clockType === 'running' ? 'bg-brand text-black border-brand' : ''}`}
                                >
                                    RUNNING
                                </button>
                            </div>
                            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Running clock: standard tournament rules.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 border-t border-surface-border/30">
                        <button
                            onClick={onReturnToDashboard}
                            className="bg-gray-900 border border-gray-800 text-gray-500 hover:text-white px-12 py-4 text-xs font-mono uppercase tracking-widest transition-all"
                        >
                            Cancel Setup
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
                            START GAME <Zap className="w-5 h-5" />
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
        { key: StatType.SHOT, label: "SHOTS" },
        { key: StatType.SAVE, label: "SAVES" },
        { key: StatType.GROUND_BALL, label: "GROUND BALLS" },
        { key: StatType.FACEOFF_WIN, label: "FACEOFF WINS" },
        { key: StatType.TURNOVER, label: "TURNOVERS" },
    ];

    return (
        <div className="cyber-card p-1 border-brand/20">
            <div className="bg-black p-6 border border-surface-border">
                <h3 className="text-xs font-mono font-black text-brand uppercase tracking-[0.3em] mb-6 text-center">LIVE STATS SUMMARY</h3>
                <div className="grid grid-cols-3 gap-4 font-mono">
                    <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-widest underline decoration-brand/30 underline-offset-8 mb-4">{homeTeam?.name?.toUpperCase() || 'HOME'}</div>
                    <div className="text-center text-[10px] font-black text-brand uppercase tracking-widest mb-4">STAT</div>
                    <div className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest underline decoration-brand/30 underline-offset-8 mb-4">{awayTeam?.name?.toUpperCase() || 'AWAY'}</div>

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

                    {/* Face-off Percentage Row */}
                    <React.Fragment>
                        <div className="text-right text-3xl font-display italic font-black text-brand">
                            {(() => {
                                const wins = homeTotals[StatType.FACEOFF_WIN] || 0;
                                const losses = homeTotals[StatType.FACEOFF_LOSS] || 0;
                                const total = wins + losses;
                                return total > 0 ? `${((wins / total) * 100).toFixed(0)}%` : '0%';
                            })()}
                        </div>
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="h-px bg-brand/30 w-full mb-1"></div>
                            <span className="text-[8px] text-brand uppercase tracking-tighter font-bold">FO %</span>
                        </div>
                        <div className="text-left text-3xl font-display italic font-black text-brand">
                            {(() => {
                                const wins = awayTotals[StatType.FACEOFF_WIN] || 0;
                                const losses = awayTotals[StatType.FACEOFF_LOSS] || 0;
                                const total = wins + losses;
                                return total > 0 ? `${((wins / total) * 100).toFixed(0)}%` : '0%';
                            })()}
                        </div>
                    </React.Fragment>
                </div>
            </div>
        </div>
    );
};

const GameTracker: React.FC<GameTrackerProps> = ({
    game,
    currentUser,
    onUpdateGame,
    onSaveStat,
    onDeleteStat,
    onSavePenalty,
    onReturnToDashboard,
    onViewReport
}) => {
    const isTimekeeper = useMemo(() => {
        // Since timekeeperId is not stored in the database, allow anyone to be timekeeper
        // If timekeeperId is set, check if current user matches
        // Otherwise, default to true (anyone can control the clock)
        if (!game.timekeeperId) return true;
        return currentUser?.id === game.timekeeperId;
    }, [game.timekeeperId, currentUser]);

    // Calculate current clock value from server state
    const calculateCurrentClock = useCallback(() => {
        if (!game.clockRunning || !game.clockLastStarted) {
            return game.gameClock;
        }

        // Calculate elapsed time since clock was started
        const startTime = new Date(game.clockLastStarted).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);

        // Subtract elapsed time from the clock value when it was started
        const currentClock = Math.max(0, game.gameClock - elapsedSeconds);
        return currentClock;
    }, [game.clockRunning, game.clockLastStarted, game.gameClock]);

    const [clock, setClock] = useState(calculateCurrentClock());
    const [assistModal, setAssistModal] = useState<{ show: boolean, scoringPlayer: Player | null, scoringTeamId: string | null }>({ show: false, scoringPlayer: null, scoringTeamId: null });
    const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
    const [selectedPlayerInfo, setSelectedPlayerInfo] = useState<{ player: Player; teamId: string } | null>(null);
    const [isLogStatDrawerOpen, setIsLogStatDrawerOpen] = useState(false);
    const [pinnedPlayerIds, setPinnedPlayerIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('pinnedPlayerIds');
        return saved ? JSON.parse(saved) : [];
    });
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Save pinned players to localStorage
    useEffect(() => {
        localStorage.setItem('pinnedPlayerIds', JSON.stringify(pinnedPlayerIds));
    }, [pinnedPlayerIds]);

    const togglePinPlayer = useCallback((playerId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't select the player when pinning
        setPinnedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    }, []);

    const sortedHomeRoster = useMemo(() => {
        return [...game.homeTeam.roster].sort((a, b) => {
            const aPinned = pinnedPlayerIds.includes(a.id);
            const bPinned = pinnedPlayerIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        });
    }, [game.homeTeam.roster, pinnedPlayerIds]);

    const sortedAwayRoster = useMemo(() => {
        return [...game.awayTeam.roster].sort((a, b) => {
            const aPinned = pinnedPlayerIds.includes(a.id);
            const bPinned = pinnedPlayerIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        });
    }, [game.awayTeam.roster, pinnedPlayerIds]);

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

    // Update local clock display every 100ms when clock is running
    useEffect(() => {
        let timer: number;
        if (game.clockRunning) {
            timer = window.setInterval(() => {
                const newClock = calculateCurrentClock();
                setClock(newClock);

                // Play countdown sounds
                if (newClock <= 10 && newClock > 0) speak(String(newClock));
                else if (newClock === 0) {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    playBuzzer();
                }
            }, 100); // Update every 100ms for smooth display
        } else {
            // When clock is paused, just show the stored value
            setClock(game.gameClock);
        }
        return () => {
            clearInterval(timer);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [game.clockRunning, game.gameClock, game.clockLastStarted, calculateCurrentClock, playBuzzer, speak]);

    // Sync clock to server when it hits 0
    useEffect(() => {
        if (clock === 0 && game.clockRunning && isTimekeeper) {
            onUpdateGame({
                ...game,
                gameClock: 0,
                clockRunning: false,
                clockLastStarted: undefined
            });
        }
    }, [clock, game, onUpdateGame, isTimekeeper]);

    // Toggle clock running state (server-side)
    const toggleClock = useCallback(() => {
        if (game.clockRunning) {
            // Pause the clock - save current calculated time
            const currentClock = calculateCurrentClock();
            onUpdateGame({
                ...game,
                clockRunning: false,
                gameClock: currentClock,
                clockLastStarted: undefined
            });
        } else {
            // Start the clock - record start time
            onUpdateGame({
                ...game,
                clockRunning: true,
                gameClock: clock, // Use current display value
                clockLastStarted: new Date().toISOString()
            });
        }
    }, [game, clock, calculateCurrentClock, onUpdateGame]);

    // Manual clock adjustment
    const adjustClock = useCallback((newClock: number) => {
        if (game.clockRunning) {
            // If clock is running, update the start time to maintain the new value
            onUpdateGame({
                ...game,
                gameClock: newClock,
                clockLastStarted: new Date().toISOString()
            });
        } else {
            // If clock is paused, just update the value
            onUpdateGame({
                ...game,
                gameClock: newClock
            });
        }
    }, [game, onUpdateGame]);

    const handleStatAdd = useCallback((player: Player, teamId: string, type: StatType, assistingPlayerId?: string) => {
        const newStat: Stat = {
            id: crypto.randomUUID(), // Generate proper UUID for Supabase
            gameId: game.id,
            playerId: player.id,
            teamId: teamId,
            type: type,
            timestamp: clock,
            period: game.currentPeriod,
            assistingPlayerId,
            recordedBy: currentUser?.id || undefined
        };

        onSaveStat(newStat);
        setIsLogStatDrawerOpen(false); // Close drawer after stat
        setSelectedPlayerInfo(null); // Clear selection
    }, [game.id, game.currentPeriod, clock, currentUser?.id, onSaveStat]);

    const handleStatButtonClick = (type: StatType) => {
        if (selectedPlayerInfo) {
            handleStatAdd(selectedPlayerInfo.player, selectedPlayerInfo.teamId, type);
            // setIsStatDrawerOpen(false); // Handled in handleStatAdd
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
        // Pause the clock before leaving
        if (game.clockRunning) {
            toggleClock();
        }
        onReturnToDashboard();
    };

    if (game.status === 'scheduled') {
        return <GameSetup game={game} onStartGame={(config) => {
            onUpdateGame({
                ...game,
                status: 'live',
                ...config,
                gameClock: config.periodLength,
                currentPeriod: 1,
                timekeeperId: currentUser?.id
            });
            setClock(config.periodLength);
            if (!game.clockRunning) {
                toggleClock();
            }
        }} onReturnToDashboard={onReturnToDashboard} />;
    }

    return (
        <div className="max-w-7xl mx-auto pb-32">
            {/* COMPACT STICKY HUD */}
            <div className="sticky top-2 z-[60] px-2 sm:px-4 animate-in slide-in-from-top-2 duration-500">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-stretch divide-x divide-white/10 h-20 sm:h-28">
                        {/* HOME SCORE */}
                        <div
                            onClick={() => isTimekeeper && onUpdateGame({ ...game, score: { ...game.score, home: game.score.home + 1 } })}
                            className={`flex-1 flex flex-col items-center justify-center p-2 tap-target cursor-pointer group transition-colors ${isTimekeeper ? 'hover:bg-brand/5' : ''}`}
                        >
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest truncate max-w-full italic px-2">{game.homeTeam.name}</span>
                            <div className="relative">
                                <span className="text-5xl sm:text-7xl font-display font-black group-hover:text-brand transition-colors italic">{game.score.home}</span>
                                {isTimekeeper && <Plus className="w-4 h-4 text-brand absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                            {isTimekeeper && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateGame({ ...game, score: { ...game.score, home: Math.max(0, game.score.home - 1) } }); }}
                                    className="text-[8px] font-mono text-gray-700 hover:text-red-500 uppercase tracking-[0.2em] mt-1"
                                >
                                    DECREASE
                                </button>
                            )}
                        </div>

                        {/* CENTER: CLOCK & PERIOD */}
                        <div className="w-32 sm:w-48 flex flex-col items-center justify-center bg-white/5 px-2 relative">
                            <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${game.clockRunning ? 'bg-brand animate-ping' : 'bg-gray-600'}`}></div>
                                <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.3em] ${game.clockRunning ? 'text-brand font-bold' : 'text-gray-600'}`}>
                                    {game.clockRunning ? 'LIVE' : 'PAUSED'}
                                </span>
                            </div>

                            <div
                                onClick={() => isTimekeeper && toggleClock()}
                                className="cursor-pointer tap-target group"
                            >
                                <p className={`text-4xl sm:text-6xl font-mono font-black tracking-tighter transition-all duration-500 ${game.clockRunning ? 'text-brand drop-shadow-[0_0_15px_rgba(255,87,34,0.4)]' : 'text-gray-400 group-hover:text-white'}`}>
                                    {formatTime(clock)}
                                </p>
                            </div>

                            <div className="mt-1 sm:mt-2 text-center">
                                <span className="text-[8px] sm:text-[10px] font-mono font-black text-white/40 uppercase tracking-widest bg-white/10 px-3 py-0.5 rounded-full">
                                    {game.periodType?.slice(0, -1) || 'P'} {game.currentPeriod}
                                </span>
                            </div>
                        </div>

                        {/* AWAY SCORE */}
                        <div
                            onClick={() => isTimekeeper && onUpdateGame({ ...game, score: { ...game.score, away: game.score.away + 1 } })}
                            className={`flex-1 flex flex-col items-center justify-center p-2 tap-target cursor-pointer group transition-colors ${isTimekeeper ? 'hover:bg-brand/5' : ''}`}
                        >
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest truncate max-w-full italic px-2">{game.awayTeam.name}</span>
                            <div className="relative">
                                <span className="text-5xl sm:text-7xl font-display font-black group-hover:text-brand transition-colors italic">{game.score.away}</span>
                                {isTimekeeper && <Plus className="w-4 h-4 text-brand absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                            {isTimekeeper && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateGame({ ...game, score: { ...game.score, away: Math.max(0, game.score.away - 1) } }); }}
                                    className="text-[8px] font-mono text-gray-700 hover:text-red-500 uppercase tracking-[0.2em] mt-1"
                                >
                                    DECREASE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* QUICK ACTION BAR */}
                    {isTimekeeper && (
                        <div className="bg-black/40 border-t border-white/5 px-4 py-2 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => onUpdateGame({ ...game, currentPeriod: Math.max(1, game.currentPeriod - 1) })} className="p-2 text-gray-600 hover:text-white transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                                <span className="text-[9px] font-mono font-black text-white/20 uppercase tracking-widest">PERIOD</span>
                                <button onClick={() => onUpdateGame({ ...game, currentPeriod: Math.min(game.totalPeriods || 4, game.currentPeriod + 1) })} className="p-2 text-gray-600 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                                <button onClick={() => adjustClock(Math.max(0, clock - 60))} className="text-[9px] font-mono text-gray-500 hover:text-white transition-colors px-1.5 focus:text-brand"> -1M </button>
                                <button onClick={() => adjustClock(Math.max(0, clock - 10))} className="text-[9px] font-mono text-gray-500 hover:text-white transition-colors px-1.5 focus:text-brand"> -10S </button>
                                <div className="w-px h-3 bg-white/10 mx-1"></div>
                                <button onClick={() => adjustClock(clock + 10)} className="text-[9px] font-mono text-gray-500 hover:text-white transition-colors px-1.5 focus:text-brand"> +10S </button>
                                <button onClick={() => adjustClock(clock + 60)} className="text-[9px] font-mono text-gray-500 hover:text-white transition-colors px-1.5 focus:text-brand"> +1M </button>
                            </div>

                            {game.status !== 'finished' && (
                                <button onClick={() => { if (window.confirm("FINISH GAME?")) onUpdateGame({ ...game, status: 'finished', gameClock: 0 }); }} className="text-red-500/50 hover:text-red-500 text-[8px] font-mono font-black uppercase tracking-widest transition-colors mr-2">
                                    END
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 mt-8 space-y-8">
                <PenaltyBox penalties={game.penalties || []} clock={clock} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />

                {game.status === 'live' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1.5 h-6 bg-brand"></div>
                                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter">LIVE <span className="text-brand">TRACKING</span></h3>
                            </div>
                            <LiveStatsSummary homeTeam={game.homeTeam} awayTeam={game.awayTeam} playerStats={playerStats} />

                            <div className="mt-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-display font-black text-white italic uppercase tracking-widest">RECORDED LOGS</h3>
                                    <Activity className="w-4 h-4 text-brand/30" />
                                </div>
                                <div className="bg-surface-card/30 border border-white/5 rounded-xl h-64 overflow-y-auto custom-scrollbar p-1">
                                    {(game.stats || []).slice().sort((a, b) => b.timestamp - a.timestamp).map(stat => {
                                        const p = allPlayers.find(pl => pl.id === stat.playerId);
                                        const t = stat.teamId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
                                        return (
                                            <div key={stat.id} className="flex items-center gap-3 border-b border-white/5 p-3 text-[10px] font-mono group hover:bg-white/5 transition-colors">
                                                <span className="text-gray-600">[{formatTime(stat.timestamp)}]</span>
                                                <span className="text-brand font-bold">{t.name.substring(0, 3).toUpperCase()}</span>
                                                <span className="text-white">#{p?.jerseyNumber} {p?.name.split(' ')[0].toUpperCase()}</span>
                                                <span className="text-gray-500 ml-auto whitespace-nowrap">{stat.type.replace('_', ' ')}</span>
                                                {(isTimekeeper || currentUser?.id === stat.recordedBy || currentUser?.role === Role.ADMIN) && (
                                                    <button onClick={() => { if (window.confirm("Delete stat?")) onDeleteStat(stat.id); }} className="p-1 text-gray-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <StatsTable team={game.homeTeam} playerStats={playerStats} />
                            <StatsTable team={game.awayTeam} playerStats={playerStats} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 py-12">
                        <div className="cyber-card p-1">
                            <div className="bg-black p-12 text-center border border-brand/50 rounded-lg">
                                <Trophy className="w-16 h-16 text-brand mx-auto mb-6" />
                                <h2 className="text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-8">GAME <span className="text-brand">FINISHED</span></h2>
                                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                    <button onClick={() => onViewReport(game)} className="cyber-button px-12 py-4 text-xl rounded-lg">VIEW GAME REPORT</button>
                                    <button onClick={handleReturnToDashboard} className="cyber-button-outline px-12 py-4 text-xl rounded-lg">EXIT TO DASHBOARD</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY "LOG STAT" BUTTON (MOBILE-FACING) */}
            {game.status === 'live' && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[90] pointer-events-none">
                    <button
                        onClick={() => {
                            if (isLogStatDrawerOpen) {
                                setIsLogStatDrawerOpen(false);
                                setSelectedPlayerInfo(null);
                            } else {
                                setIsLogStatDrawerOpen(true);
                            }
                        }}
                        className="pointer-events-auto bg-brand hover:bg-brand-dark text-black font-display font-black px-10 py-4 sm:px-12 sm:py-5 rounded-full shadow-[0_15px_40px_rgba(255,87,34,0.4)] flex items-center gap-3 tap-target uppercase italic tracking-wider group border-2 border-black/20"
                    >
                        {isLogStatDrawerOpen ? 'CLOSE' : 'LOG STAT'}
                        {isLogStatDrawerOpen ? <Trash2 className="w-5 h-5" /> : <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />}
                    </button>
                </div>
            )}

            {/* FULL-SCREEN DRAWER OVERLAY */}
            {(isLogStatDrawerOpen || selectedPlayerInfo) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] animate-in fade-in duration-300 flex flex-col pt-20 overflow-hidden">
                    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 overflow-hidden">

                        {/* HEADER */}
                        <div className="border-b border-white/10 pb-6 mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tight">
                                    {selectedPlayerInfo ? 'SELECT ACTION' : 'LOG STATISTICAL DATA'}
                                </h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                                    {selectedPlayerInfo ? `RECORD FOR #${selectedPlayerInfo.player.jerseyNumber} ${selectedPlayerInfo.player.name}` : 'STEP 1: SELECT SOURCE PLAYER'}
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsLogStatDrawerOpen(false); setSelectedPlayerInfo(null); }}
                                className="p-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                            {selectedPlayerInfo ? (
                                <div className="space-y-8 animate-slide-up">
                                    {/* HUGE ACTION GRID */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => { if (game.clockRunning) toggleClock(); setAssistModal({ show: true, scoringPlayer: selectedPlayerInfo.player, scoringTeamId: selectedPlayerInfo.teamId }); }} className="h-28 flex flex-col items-center justify-center bg-green-500 text-black rounded-xl font-display font-black italic tracking-wider tap-target">
                                            <Trophy className="w-8 h-8 mb-2" />
                                            GOAL
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.SHOT)} className="h-28 flex flex-col items-center justify-center bg-white/10 text-white border border-white/20 rounded-xl font-display font-black italic tracking-wider tap-target">
                                            <Zap className="w-8 h-8 mb-2" />
                                            SHOT
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.GROUND_BALL)} className="h-24 flex flex-col items-center justify-center bg-brand text-black rounded-xl font-display font-black italic tracking-wider tap-target">
                                            GB
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.TURNOVER)} className="h-24 flex flex-col items-center justify-center bg-red-500 text-black rounded-xl font-display font-black italic tracking-wider tap-target">
                                            TO
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.CAUSED_TURNOVER)} className="h-24 flex flex-col items-center justify-center bg-surface-card border border-brand/40 text-brand rounded-xl font-display font-black italic tracking-wider tap-target uppercase">
                                            CT
                                        </button>
                                        <button onClick={() => setIsPenaltyModalOpen(true)} className="h-24 flex flex-col items-center justify-center bg-yellow-500 text-black rounded-xl font-display font-black italic tracking-wider tap-target">
                                            <ShieldAlert className="w-6 h-6 mb-1" />
                                            PENALTY
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.FACEOFF_WIN)} className="h-24 flex flex-col items-center justify-center bg-white/5 text-brand border border-white/10 rounded-xl font-display font-black italic tracking-wider tap-target">
                                            FO WIN
                                        </button>
                                        <button onClick={() => handleStatButtonClick(StatType.FACEOFF_LOSS)} className="h-24 flex flex-col items-center justify-center bg-white/5 text-gray-500 border border-white/10 rounded-xl font-display font-black italic tracking-wider tap-target">
                                            FO LOSS
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPlayerInfo(null)}
                                        className="w-full py-6 text-[10px] font-mono text-gray-600 hover:text-white border-y border-white/5 uppercase tracking-[0.4em] transition-colors"
                                    >
                                        ← Change Player
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {/* ROSTER SELECTION */}
                                    {[
                                        { team: game.homeTeam, roster: sortedHomeRoster },
                                        { team: game.awayTeam, roster: sortedAwayRoster }
                                    ].map(({ team, roster }) => (
                                        <div key={team.id} className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-brand font-black uppercase tracking-widest">{team.name}</span>
                                                <div className="h-px bg-white/10 flex-grow"></div>
                                            </div>
                                            <div className="stats-grid-mobile">
                                                {roster.map(player => {
                                                    const isPinned = pinnedPlayerIds.includes(player.id);
                                                    return (
                                                        <button
                                                            key={player.id}
                                                            onClick={() => setSelectedPlayerInfo({ player, teamId: team.id })}
                                                            className={`bg-white/5 hover:bg-white/10 border ${isPinned ? 'border-brand/40 bg-brand/5' : 'border-white/10'} rounded-xl p-4 text-left transition-all tap-target flex flex-col group active:border-brand relative`}
                                                        >
                                                            <div className="flex justify-between items-start w-full">
                                                                <span className="text-brand font-mono text-xs font-black mb-1 group-active:text-white">#{player.jerseyNumber}</span>
                                                                <button
                                                                    onClick={(e) => togglePinPlayer(player.id, e)}
                                                                    className={`p-2 -mr-3 -mt-3 transition-all ${isPinned ? 'text-brand' : 'text-gray-600 hover:text-white'}`}
                                                                >
                                                                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-brand' : ''}`} />
                                                                </button>
                                                            </div>
                                                            <span className="text-white font-display font-bold uppercase italic tracking-tight text-sm truncate">{player.name}</span>
                                                            <span className="text-[8px] font-mono text-gray-600 uppercase mt-1">{player.position}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals integrated with cyber style */}
            {assistModal.show && assistModal.scoringPlayer && assistModal.scoringTeamId && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-xs font-mono">
                    <div className="cyber-card p-8 max-w-2xl w-full border-brand">
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter mb-4">ASSIST // <span className="text-brand">SELECT PLAYER</span></h2>
                        <p className="text-gray-500 uppercase tracking-widest mb-8 font-mono">IDENTIFY PRIMARY SOURCE FOR GOAL AT {formatTime(clock)} BY {assistModal.scoringPlayer.name.toUpperCase()}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                            {(assistModal.scoringTeamId === game.homeTeam.id ? sortedHomeRoster : sortedAwayRoster)
                                .filter(p => p.id !== assistModal.scoringPlayer!.id)
                                .map(p => {
                                    const isPinned = pinnedPlayerIds.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => { handleStatAdd(assistModal.scoringPlayer!, assistModal.scoringTeamId!, StatType.GOAL, p.id); setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); setSelectedPlayerInfo(null); }}
                                            className={`border ${isPinned ? 'border-brand/40 bg-brand/5' : 'bg-surface-card border-surface-border'} hover:border-brand p-4 text-left transition-all relative`}
                                        >
                                            <div className="flex justify-between items-start w-full">
                                                <div className="text-brand text-[10px] font-black pb-1">#{p.jerseyNumber}</div>
                                                {isPinned && <Pin className="w-2.5 h-2.5 text-brand fill-brand" />}
                                            </div>
                                            <div className="text-white uppercase italic font-bold tracking-tight text-sm truncate">{p.name}</div>
                                        </button>
                                    );
                                })}
                        </div>
                        <div className="mt-12 flex justify-between border-t border-surface-border pt-6">
                            <button onClick={() => { handleStatAdd(assistModal.scoringPlayer!, assistModal.scoringTeamId!, StatType.GOAL); setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); setSelectedPlayerInfo(null); }} className="text-gray-500 hover:text-white uppercase tracking-widest">UNASSISTED GOAL</button>
                            <button onClick={() => { setAssistModal({ show: false, scoringPlayer: null, scoringTeamId: null }); if (!game.clockRunning) toggleClock(); }} className="text-red-500 uppercase tracking-widest font-black">CANCEL</button>
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
                        const newPenalty: Penalty = {
                            id: crypto.randomUUID(), // Generate proper UUID for Supabase
                            gameId: game.id,
                            playerId: selectedPlayerInfo.player.id,
                            teamId: selectedPlayerInfo.teamId,
                            type,
                            duration,
                            startTime: clock,
                            releaseTime: clock - duration,
                            period: game.currentPeriod,
                            recordedBy: currentUser?.id || undefined
                        };
                        onSavePenalty(newPenalty);
                        setIsPenaltyModalOpen(false);
                        setSelectedPlayerInfo(null);
                    }}
                />
            )}
        </div>
    );
};

export default GameTracker;

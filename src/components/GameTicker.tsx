import React from 'react';
import { Game, StatType } from '../types';
import { Activity, Target, Trophy, Zap, Users, ShieldAlert } from 'lucide-react';

interface GameTickerProps {
    game: Game;
}

const GameTicker: React.FC<GameTickerProps> = ({ game }) => {
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const getImpactfulPlays = () => {
        const impactful: { description: string, icon: React.ReactNode }[] = [];
        const sortedStats = [...game.stats].sort((a, b) => a.timestamp - b.timestamp);

        // Track score progression to identify lead changes/equalizers
        let homeScore = 0;
        let awayScore = 0;

        sortedStats.forEach((stat) => {
            const isHome = stat.teamId === game.homeTeam.id;
            const prevDiff = homeScore - awayScore;

            if (stat.type === StatType.GOAL) {
                if (isHome) homeScore++; else awayScore++;
                const newDiff = homeScore - awayScore;
                const p = [...game.homeTeam.roster, ...game.awayTeam.roster].find(pl => pl.id === stat.playerId);
                const playerName = p?.name.split(' ')[0].toUpperCase() || 'PLAYER';

                // Lead Change
                if ((prevDiff <= 0 && newDiff > 0) || (prevDiff >= 0 && newDiff < 0)) {
                    impactful.push({
                        description: `LEAD CHANGE: ${playerName} PUTS ${isHome ? game.homeTeam.name : game.awayTeam.name} AHEAD!`,
                        icon: <Activity className="w-3 h-3 text-red-500 animate-pulse" />
                    });
                }
                // Equalizer
                else if (newDiff === 0 && prevDiff !== 0) {
                    impactful.push({
                        description: `EQUALIZER: ${playerName} TIES IT UP!`,
                        icon: <Zap className="w-3 h-3 text-yellow-400" />
                    });
                }
            }

            // Clutch Saves (within 1 goal difference)
            if (stat.type === StatType.SAVE && Math.abs(prevDiff) <= 1) {
                const p = [...game.homeTeam.roster, ...game.awayTeam.roster].find(pl => pl.id === stat.playerId);
                impactful.push({
                    description: `CLUTCH SAVE: ${p?.name.split(' ')[0].toUpperCase() || 'GOALIE'} DENIES EQUALIZER!`,
                    icon: <ShieldAlert className="w-3 h-3 text-brand" />
                });
            }
        });

        return impactful.reverse().slice(0, 3); // Get latest 3 impactful plays
    };

    const getRecentEvents = () => {
        return [...game.stats]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
    };

    const getStatLeaders = () => {
        const stats: Record<string, { g: number, a: number, name: string }> = {};
        game.stats.forEach(s => {
            const p = [...game.homeTeam.roster, ...game.awayTeam.roster].find(player => player.id === s.playerId);
            if (!p) return;
            if (!stats[p.id]) stats[p.id] = { g: 0, a: 0, name: p.name };
            if (s.type === StatType.GOAL) stats[p.id].g++;
            if (s.type === StatType.ASSIST) stats[p.id].a++;
        });
        return Object.values(stats)
            .sort((a, b) => (b.g + b.a) - (a.g + a.a))
            .slice(0, 3);
    };

    const recentEvents = getRecentEvents();
    const leaders = getStatLeaders();
    const impactfulPlays = getImpactfulPlays();
    const activePenalties = game.penalties.filter(p => game.gameClock > p.releaseTime);

    // Triple the items to ensure it fills even large displays before looping
    const renderSequence = (keyPrefix: string) => (
        <React.Fragment key={keyPrefix}>
            <div className="flex items-center gap-6">
                <Activity className="w-3 h-3 text-brand animate-pulse" />
                <span className="text-brand font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                    LIVE SCORE: {game.homeTeam.name} {game.score.home} - {game.score.away} {game.awayTeam.name}
                </span>
            </div>

            <div className="flex items-center gap-6">
                <Target className="w-3 h-3 text-brand" />
                <span className="text-brand font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                    PERIOD {game.currentPeriod} | {formatTime(game.gameClock)}
                </span>
            </div>

            {impactfulPlays.map((play, i) => (
                <div key={`${keyPrefix}-impact-${i}`} className="flex items-center gap-6 text-white bg-white/10 px-4 py-1 rounded-sm border-x border-white/20">
                    {play.icon}
                    <span className="font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                        KEY MOMENT: {play.description}
                    </span>
                </div>
            ))}

            {recentEvents.map((stat, i) => {
                const p = [...game.homeTeam.roster, ...game.awayTeam.roster].find(p => p.id === stat.playerId);
                return (
                    <div key={`${keyPrefix}-event-${i}`} className="flex items-center gap-6 text-white/90">
                        {stat.type === StatType.GOAL ? <Trophy className="w-3 h-3 text-green-500" /> : <Zap className="w-3 h-3" />}
                        <span className="font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                            {stat.type.toUpperCase()}: {p?.name || 'UNKNOWN'}
                        </span>
                    </div>
                );
            })}

            {leaders.map((l, i) => (
                <div key={`${keyPrefix}-leader-${i}`} className="flex items-center gap-6 text-brand/80">
                    <Users className="w-3 h-3" />
                    <span className="font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                        LEADER: {l.name} ({l.g}G, {l.a}A)
                    </span>
                </div>
            ))}

            {activePenalties.map((p, i) => (
                <div key={`${keyPrefix}-penalty-${i}`} className="flex items-center gap-6 text-yellow-500">
                    <ShieldAlert className="w-3 h-3 animate-pulse" />
                    <span className="font-mono text-[11px] font-black italic tracking-[0.2em] whitespace-nowrap uppercase">
                        PENALTY #{p.playerId}
                    </span>
                </div>
            ))}
        </React.Fragment>
    );

    return (
        <div className="w-full bg-brand/5 border-y border-brand/20 overflow-hidden py-4 backdrop-blur-md relative z-10">
            <div className="animate-ticker flex items-center gap-12 px-12">
                {renderSequence('loop-1')}
                {renderSequence('loop-2')}
                {renderSequence('loop-3')}
            </div>
        </div>
    );
};

export default GameTicker;

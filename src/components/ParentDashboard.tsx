import React from 'react';
import { Game, Team, User } from '../types';
import { Shield, Eye, Activity, Calendar, Users, Trash2, ArrowRight } from 'lucide-react';

interface ParentDashboardProps {
    currentUser: User;
    teams: Team[];
    games: Game[];
    onUpdateUser: (user: User) => void;
}

const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

// --- Live Game Viewer Component ---
const LiveGameViewer: React.FC<{ game: Game }> = ({ game }) => {
    const [clock, setClock] = React.useState(game.gameClock);
    const gameStatusRef = React.useRef(game.status);

    React.useEffect(() => {
        setClock(game.gameClock);
        gameStatusRef.current = game.status;
    }, [game.gameClock, game.status]);

    React.useEffect(() => {
        let timer: number;
        if (gameStatusRef.current === 'live' && clock > 0) {
            timer = window.setInterval(() => {
                setClock(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [clock]);

    const allPlayers = [...game.homeTeam.roster, ...game.awayTeam.roster];
    const gameLog = [...game.stats]
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(stat => {
            const player = allPlayers.find(p => p.id === stat.playerId);
            const team = stat.teamId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
            if (!player) return null;
            let text = `${team.name}: #${player.jerseyNumber} ${player.name} - ${stat.type}`;
            if (stat.type === 'Goal' && stat.assistingPlayerId) {
                const assistPlayer = allPlayers.find(p => p.id === stat.assistingPlayerId);
                if (assistPlayer) text += ` (Assist #${assistPlayer.jerseyNumber} ${assistPlayer.name})`;
            }
            return { id: stat.id, text, timestamp: stat.timestamp };
        })
        .filter(Boolean);

    const tickerText = gameLog.slice(0, 15).map(log => log!.text).join('  //  ');

    return (
        <div className="cyber-card p-1 border-brand/50 bg-brand/5 mb-12">
            <div className="bg-black p-8 rounded-lg overflow-hidden relative">
                <div className="flex items-center gap-4 mb-8 justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand blur-md animate-pulse rounded-full opacity-50"></div>
                        <Activity className="relative w-6 h-6 text-brand" />
                    </div>
                    <h2 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase italic">Live Protocol Active</h2>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-12 max-w-4xl mx-auto mb-8">
                    <div className="flex-1 text-center md:text-right">
                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-2">{game.homeTeam.name}</h3>
                        <p className="text-6xl font-display font-black text-brand italic">{game.score.home}</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="bg-surface-card border border-surface-border px-8 py-4 rounded-none">
                            <p className="text-5xl font-mono font-bold text-white mb-1 tracking-tighter">{formatTime(clock)}</p>
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] text-center">Period {game.currentPeriod}</p>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-2">{game.awayTeam.name}</h3>
                        <p className="text-6xl font-display font-black text-brand italic">{game.score.away}</p>
                    </div>
                </div>

                {gameLog.length > 0 ? (
                    <div className="relative w-full bg-surface-card border-t border-surface-border mt-8 -mx-8 px-8 py-3 overflow-hidden">
                        <div className="ticker-move">
                            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{tickerText}</p>
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-surface-border/30 mt-8 pt-4 text-center">
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] italic">Awaiting Telemetry Stream...</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const ParentDashboard: React.FC<ParentDashboardProps> = ({ currentUser, teams, games, onUpdateUser }) => {
    const followedTeamIds = currentUser.followedTeamIds || [];
    const followedPlayerIds = currentUser.followedPlayerIds || [];

    const followedTeams = teams.filter(t => followedTeamIds.includes(t.id));
    const unfollowedTeams = teams.filter(t => !followedTeamIds.includes(t.id));
    const liveGames = games.filter(g => g.status === 'live' && (followedTeamIds.includes(g.homeTeam.id) || followedTeamIds.includes(g.awayTeam.id)));

    const handleFollowTeam = (teamId: string) => {
        const newFollowedTeams = [...followedTeamIds, teamId];
        onUpdateUser({ ...currentUser, followedTeamIds: newFollowedTeams });
    };

    const handleUnfollowTeam = (teamId: string) => {
        const newFollowedTeams = followedTeamIds.filter(id => id !== teamId);
        const teamPlayerIds = teams.find(t => t.id === teamId)?.roster.map(p => p.id) || [];
        const newFollowedPlayers = followedPlayerIds.filter(id => !teamPlayerIds.includes(id));
        onUpdateUser({ ...currentUser, followedTeamIds: newFollowedTeams, followedPlayerIds: newFollowedPlayers });
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Observer Console</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        PARENT <span className="text-brand">DASHBOARD</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 py-2 px-4 bg-surface-card border border-surface-border">
                    <Eye className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Status: Monitoring</span>
                </div>
            </div>

            {liveGames.map(game => (
                <LiveGameViewer key={game.id} game={game} />
            ))}

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <Shield className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Monitored <span className="text-brand">Units</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>

                        {followedTeams.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {followedTeams.map(team => {
                                    const teamGames = games.filter(g => g.homeTeam.id === team.id || g.awayTeam.id === team.id);
                                    const upcomingGames = teamGames.filter(g => g.status === 'scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

                                    return (
                                        <div key={team.id} className="cyber-card p-6 border-l-2 border-l-brand">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-xl font-display font-bold text-white uppercase italic tracking-tight">{team.name}</h3>
                                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Active Stream Linked</p>
                                                </div>
                                                <button onClick={() => handleUnfollowTeam(team.id)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" /> Next Sequence
                                                    </p>
                                                    {upcomingGames.length > 0 ? (
                                                        <div className="bg-surface-card/50 p-3 border border-surface-border">
                                                            <p className="text-xs font-display font-bold text-white uppercase">vs {upcomingGames[0].homeTeam.id === team.id ? upcomingGames[0].awayTeam.name : upcomingGames[0].homeTeam.name}</p>
                                                            <p className="text-[8px] font-mono text-gray-500 mt-1 uppercase">{new Date(upcomingGames[0].scheduledTime).toLocaleString()}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[9px] font-mono text-gray-600 italic">No Sequences Scheduled</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Users className="w-3 h-3" /> Unit Roster
                                                    </p>
                                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                                                        {team.roster.map(player => (
                                                            <div key={player.id} className="flex justify-between items-center text-[10px] font-mono p-1 border-b border-surface-border/30">
                                                                <span className="text-gray-300">#{player.jerseyNumber} {player.name}</span>
                                                                <span className="text-[8px] text-gray-500">{player.position}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No Units Monitored</p>
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Discovery Stream</h2>
                        <div className="cyber-card p-6 bg-brand/5">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4">Available Units</p>
                            <div className="space-y-3">
                                {unfollowedTeams.length > 0 ? unfollowedTeams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                        <span className="text-xs font-mono text-gray-300 uppercase truncate pr-4">{team.name}</span>
                                        <button
                                            onClick={() => handleFollowTeam(team.id)}
                                            className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            LINK_STREAM <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-[8px] font-mono text-gray-600 uppercase italic">All Units Sync'd</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;

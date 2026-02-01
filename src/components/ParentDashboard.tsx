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
                    <h2 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase italic">Live Game Active</h2>
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
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] italic">Waiting for game updates...</p>
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

    const handleFollowPlayer = (playerId: string) => {
        const newFollowedPlayers = [...followedPlayerIds, playerId];
        onUpdateUser({ ...currentUser, followedPlayerIds: newFollowedPlayers });
    };

    const handleUnfollowPlayer = (playerId: string) => {
        const newFollowedPlayers = followedPlayerIds.filter(id => id !== playerId);
        onUpdateUser({ ...currentUser, followedPlayerIds: newFollowedPlayers });
    };

    // Get all players from followed teams
    const allPlayersFromFollowedTeams = followedTeams.flatMap(team =>
        team.roster.map(player => ({ ...player, teamId: team.id, teamName: team.name }))
    );
    const followedPlayers = allPlayersFromFollowedTeams.filter(p => followedPlayerIds.includes(p.id));
    const unfollowedPlayers = allPlayersFromFollowedTeams.filter(p => !followedPlayerIds.includes(p.id));

    return (
        <div className="space-y-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-1">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase font-bold">Observatory Link</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
                        PARENT <span className="text-brand">HUB</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-1 opacity-60">Status: Secure Watch // Client 02</p>
                </div>
                <div className="flex items-center gap-6 py-4 px-6 bg-surface-card border border-surface-border group hover:border-brand/30 transition-all">
                    <div className="relative">
                        <Eye className="w-5 h-5 text-brand" />
                        <div className="absolute inset-0 bg-brand/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Access Mode</p>
                        <p className="text-xs font-display font-bold text-white uppercase tracking-wider">Passive Observer</p>
                    </div>
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
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Followed <span className="text-brand">Teams</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>

                        {followedTeams.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-8">
                                {followedTeams.map(team => {
                                    const teamGames = games.filter(g => g.homeTeam.id === team.id || g.awayTeam.id === team.id);
                                    const upcomingGames = teamGames.filter(g => g.status === 'scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

                                    return (
                                        <div key={team.id} className="cyber-card p-8 border-l-2 border-l-brand flex flex-col min-h-[400px]">
                                            <div className="flex justify-between items-start mb-8">
                                                <div>
                                                    <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">{team.name}</h3>
                                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Network Member</p>
                                                </div>
                                                <button onClick={() => handleUnfollowTeam(team.id)} className="w-10 h-10 rounded-full bg-red-900/10 border border-red-900/30 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:border-red-500 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-8 flex-grow">
                                                <div>
                                                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4 flex items-center gap-3 font-bold">
                                                        <Calendar className="w-4 h-4" /> Operational Window
                                                    </p>
                                                    {upcomingGames.length > 0 ? (
                                                        <div className="bg-surface-card/40 p-4 border border-surface-border hover:border-brand/20 transition-colors">
                                                            <p className="text-sm font-display font-bold text-white uppercase italic tracking-wide">Next Engagement: {upcomingGames[0].homeTeam.id === team.id ? upcomingGames[0].awayTeam.name : upcomingGames[0].homeTeam.name}</p>
                                                            <p className="text-[9px] font-mono text-gray-400 mt-2 uppercase tracking-widest leading-none">{new Date(upcomingGames[0].scheduledTime).toLocaleString()}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-surface-card/20 border border-surface-border/50 border-dashed">
                                                            <p className="text-[10px] font-mono text-gray-600 italic tracking-widest">No Future Deployments Logged</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4 flex items-center gap-3 font-bold">
                                                        <Users className="w-4 h-4" /> Field Personnel
                                                    </p>
                                                    <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2 bg-black/40 p-3 border border-surface-border">
                                                        {team.roster.length > 0 ? team.roster.map(player => (
                                                            <div key={player.id} className="flex justify-between items-center text-[10px] font-mono p-2 border-b border-surface-border/30 hover:bg-white/5 transition-colors group">
                                                                <span className="text-white group-hover:text-brand transition-colors font-bold">#{player.jerseyNumber} {player.name}</span>
                                                                <span className="text-[9px] text-gray-500 uppercase tracking-tighter opacity-70 group-hover:opacity-100">{player.position}</span>
                                                            </div>
                                                        )) : (
                                                            <p className="text-[9px] font-mono text-gray-600 italic text-center py-4">No personnel identified</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No teams followed</p>
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Discover Teams</h2>
                        <div className="cyber-card p-6 bg-brand/5">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4">Available Teams</p>
                            <div className="space-y-3">
                                {unfollowedTeams.length > 0 ? unfollowedTeams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                        <span className="text-xs font-mono text-gray-300 uppercase truncate pr-4">{team.name}</span>
                                        <button
                                            onClick={() => handleFollowTeam(team.id)}
                                            className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            FOLLOW TEAM <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-[8px] font-mono text-gray-600 uppercase italic">All teams followed</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Tracked Players Section */}
                    {followedPlayers.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Tracked Players</h2>
                            <div className="cyber-card p-4 bg-brand/5">
                                <div className="space-y-2">
                                    {followedPlayers.map(player => (
                                        <div key={player.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                            <div className="flex-1">
                                                <p className="text-xs font-mono text-white">#{player.jerseyNumber} {player.name}</p>
                                                <p className="text-[8px] font-mono text-gray-500 uppercase">{player.teamName} • {player.position}</p>
                                            </div>
                                            <button
                                                onClick={() => handleUnfollowPlayer(player.id)}
                                                className="text-red-500/50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Available Players Section */}
                    {unfollowedPlayers.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Available Players</h2>
                            <div className="cyber-card p-4 bg-surface-card/50">
                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                    {unfollowedPlayers.map(player => (
                                        <div key={player.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                            <div className="flex-1">
                                                <p className="text-xs font-mono text-gray-300">#{player.jerseyNumber} {player.name}</p>
                                                <p className="text-[8px] font-mono text-gray-600 uppercase">{player.teamName} • {player.position}</p>
                                            </div>
                                            <button
                                                onClick={() => handleFollowPlayer(player.id)}
                                                className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                TRACK <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;

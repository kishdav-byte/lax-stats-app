import React, { useState } from 'react';
import { Game, Team, User, DrillAssignment, DrillStatus } from '../types';
import { Users, Crosshair, Calendar, ArrowRight, Shield, Activity } from 'lucide-react';
import GameTicker from './GameTicker';

const lacrossePositions = ['Attack', 'Midfield', 'Defense', 'Goalie', 'LSM', 'Face Off Specialist'];

interface JoinTeamModalProps {
    team: Team;
    onClose: () => void;
    onSubmit: (teamId: string, jersey: string, position: string) => void;
}

const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ team, onClose, onSubmit }) => {
    const [jersey, setJersey] = useState('');
    const [position, setPosition] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (jersey.trim() && position) {
            onSubmit(team.id, jersey.trim(), position);
            onClose();
        } else {
            alert("Error: Jersey number and position required.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <form onSubmit={handleSubmit} className="cyber-card w-full max-w-md max-h-[90vh] flex flex-col bg-black border-brand/50 shadow-[0_0_50px_rgba(255,87,34,0.15)]">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-surface-border shrink-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-brand w-8"></div>
                        <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase shrink-0">Network Request</p>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic uppercase tracking-tighter">
                        JOIN OPS <span className="text-brand">//</span> {team.name}
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 flex-grow overflow-y-auto custom-scrollbar space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1 font-bold">Designated Jersey #</label>
                            <input
                                type="text"
                                value={jersey}
                                onChange={e => setJersey(e.target.value)}
                                className="w-full cyber-input text-sm py-3 px-4"
                                placeholder="E.G. 22"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1 font-bold">Tactical Position</label>
                            <div className="relative">
                                <select
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    className="w-full cyber-input text-sm appearance-none py-3 px-4 pr-10"
                                    required
                                >
                                    <option value="" className="bg-black">SELECT CORE POSITION</option>
                                    {lacrossePositions.map(pos => <option key={pos} value={pos} className="bg-black">{pos.toUpperCase()}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand/50">
                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-brand/5 border border-brand/20 rounded-sm">
                        <p className="text-[9px] font-mono text-brand/70 uppercase leading-relaxed text-center">Your request will be transmitted to the coaching staff for verification and network inclusion.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-surface-border bg-black/50 shrink-0 flex items-center justify-between gap-6">
                    <button type="button" onClick={onClose} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors">Abort</button>
                    <button type="submit" className="cyber-button px-10 py-3 font-display font-bold italic tracking-widest text-xs">
                        SEND_REQUEST
                    </button>
                </div>
            </form>
        </div>
    );
};


interface PlayerDashboardProps {
    currentUser: User;
    teams: Team[];
    games: Game[];
    onJoinRequest: (teamId: string, playerJersey: string, playerPosition: string) => void;
    drillAssignments: DrillAssignment[];
    onStartDrill: (assignment: DrillAssignment) => void;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ currentUser, teams, games, onJoinRequest, drillAssignments, onStartDrill }) => {
    const myTeams = teams.filter(t => currentUser.teamIds?.includes(t.id));

    const isSampleTeamTheOnlyTeam = teams.length === 1 && teams[0].id === 'sample_team_id';
    const otherTeams = teams.filter(t => {
        if (!currentUser.teamIds?.includes(t.id)) {
            if (t.id === 'sample_team_id') return isSampleTeamTheOnlyTeam;
            return true;
        }
        return false;
    });

    const myTeamIds = myTeams.map(t => t.id);
    const myGames = games.filter(g => myTeamIds.includes(g.homeTeam.id) || myTeamIds.includes(g.awayTeam.id));
    const upcomingGames = myGames.filter(g => g.status === 'scheduled').sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    const myAssignedDrills = drillAssignments.filter(d => d.playerId === currentUser.id && d.status === DrillStatus.ASSIGNED);

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const handleOpenJoinModal = (team: Team) => {
        setSelectedTeam(team);
        setIsJoinModalOpen(true);
    };

    return (
        <div className="space-y-12 pb-12">
            {isJoinModalOpen && selectedTeam && (
                <JoinTeamModal
                    team={selectedTeam as Team}
                    onClose={() => setIsJoinModalOpen(false)}
                    onSubmit={onJoinRequest}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-1">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase font-bold">Player Terminal</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
                        PLAYER <span className="text-brand">DASH</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-1 opacity-60">Status: Tactical View // Sector {currentUser.username.substring(0, 2).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-6 py-4 px-6 bg-brand/5 border-l-2 border-brand/40 group hover:bg-brand/10 transition-all">
                    <div className="relative">
                        <Activity className="w-5 h-5 text-brand animate-pulse" />
                        <div className="absolute inset-0 bg-brand/20 blur-md rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Signal Locked</p>
                        <p className="text-xs font-display font-bold text-white uppercase tracking-wider">{currentUser.username}</p>
                    </div>
                </div>
            </div>

            {games.filter(g => g.status === 'live').map(game => (
                <GameTicker key={game.id} game={game} />
            ))}

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Teams Joined', value: myTeams.length, sub: 'Units Joined', icon: Users },
                    { label: 'Tactical Drills', value: myAssignedDrills.length, sub: 'Target Objectives', icon: Crosshair },
                    { label: 'Deployment Feed', value: upcomingGames.length, sub: 'Active Missions', icon: Calendar },
                    { label: 'Reaction PR', value: currentUser.bestClampSpeed ? `${currentUser.bestClampSpeed}ms` : '---', sub: 'Peak Velocity', icon: Activity, accent: true }
                ].map((stat, i) => (
                    <div key={i} className={`cyber-card p-8 flex flex-col justify-between min-h-[160px] group hover:border-brand/50 transition-all ${stat.accent ? 'bg-brand/5 border-brand/30' : ''}`}>
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold group-hover:text-brand transition-colors">{stat.label}</p>
                            <stat.icon className={`w-5 h-5 text-brand opacity-20 group-hover:opacity-100 transition-all ${stat.accent ? 'opacity-40 animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <span className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter">
                                {stat.value}
                            </span>
                            <p className="text-gray-600 text-[10px] uppercase font-mono tracking-[0.2em] mt-1 group-hover:text-gray-400 transition-colors uppercase">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Teams & Drills */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Assigned Drills Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <Crosshair className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Drill <span className="text-brand">Assignments</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>

                        {myAssignedDrills.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {myAssignedDrills.map(drill => (
                                    <div key={drill.id} className="cyber-card p-6 group hover:border-brand/50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="py-1 px-3 bg-brand/10 border border-brand/20 text-[10px] font-mono text-brand uppercase tracking-widest">
                                                {drill.drillType}
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand transition-colors" />
                                        </div>
                                        <p className="text-sm text-gray-400 font-sans mb-6 line-clamp-2">"{drill.notes}"</p>
                                        <button
                                            onClick={() => onStartDrill(drill)}
                                            className="cyber-button-outline w-full py-2 text-xs"
                                        >
                                            START DRILL
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No Pending Assignments</p>
                            </div>
                        )}
                    </section>

                    {/* My Teams Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <Shield className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Active <span className="text-brand">Teams</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>

                        <div className="space-y-4">
                            {myTeams.length > 0 ? myTeams.map(team => (
                                <div key={team.id} className="cyber-card p-6">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <h3 className="text-xl font-display font-bold text-white uppercase italic tracking-tight">{team.name}</h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Team Joined</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-surface-border">
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest">ID</th>
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest">PLAYER</th>
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest text-right">POSITION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {team.roster.slice(0, 5).map(p => (
                                                    <tr key={p.id} className="border-b border-surface-border/30 hover:bg-white/5">
                                                        <td className="py-2 text-[10px] font-mono text-brand font-bold">#{p.jerseyNumber}</td>
                                                        <td className="py-2 text-[10px] font-mono text-gray-300 uppercase">{p.name}</td>
                                                        <td className="py-2 text-[8px] font-mono text-gray-500 uppercase text-right">{p.position}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {team.roster.length > 5 && (
                                            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mt-2 text-center">+ {team.roster.length - 5} MORE PLAYERS</p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No teams joined</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Schedule & Exploration */}
                <div className="space-y-8">
                    {/* Game Feed */}
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Game Feed</h2>
                        <div className="space-y-4">
                            {upcomingGames.slice(0, 3).map(game => (
                                <div key={game.id} className="bg-surface-card border-l-2 border-brand p-4 space-y-2">
                                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest">Upcoming // Ready to start</p>
                                    <p className="text-sm font-display font-bold text-white uppercase italic">{game.homeTeam.name} vs {game.awayTeam.name}</p>
                                    <p className="text-[8px] font-mono text-gray-500">START: {new Date(game.scheduledTime).toLocaleString()}</p>
                                </div>
                            ))}
                            {upcomingGames.length === 0 && (
                                <p className="text-[10px] font-mono text-gray-600 uppercase text-center py-4 bg-surface-card/20 border border-surface-border italic">No Upcoming Games</p>
                            )}
                        </div>
                    </section>

                    {/* Join Section */}
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Discover Teams</h2>
                        <div className="cyber-card p-6 bg-brand/5">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4">Available Teams</p>
                            <div className="space-y-2">
                                {otherTeams.length > 0 ? otherTeams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                        <span className="text-xs font-mono text-gray-300 uppercase truncate pr-4">{team.name}</span>
                                        <button
                                            onClick={() => handleOpenJoinModal(team)}
                                            className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors flex-shrink-0"
                                        >
                                            [JOIN TEAM]
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-[8px] font-mono text-gray-600 uppercase italic">No Available Teams</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div >
    );
};

export default PlayerDashboard;

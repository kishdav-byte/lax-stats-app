import React, { useState } from 'react';
import { Game, Team, User, DrillAssignment, DrillStatus } from '../types';
import { Users, Crosshair, Calendar, ArrowRight, Shield, Activity } from 'lucide-react';

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
            alert("Protocol Violation: Jersey number and position required.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="cyber-card p-8 max-w-md w-full space-y-6 bg-black border-brand/50">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-px bg-brand w-8"></div>
                    <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase">Unit Assignment Request</p>
                </div>

                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">
                    JOIN // <span className="text-brand">{team.name}</span>
                </h2>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Desired Jersey #</label>
                        <input
                            type="text"
                            value={jersey}
                            onChange={e => setJersey(e.target.value)}
                            className="w-full cyber-input text-sm"
                            placeholder="e.g. 22"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Primary Assignment (Position)</label>
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full cyber-input text-sm appearance-none"
                            required
                        >
                            <option value="" className="bg-black">SELECT POSITION</option>
                            {lacrossePositions.map(pos => <option key={pos} value={pos} className="bg-black">{pos.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-6 pt-6">
                    <button type="button" onClick={onClose} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort</button>
                    <button type="submit" className="cyber-button py-2 px-8">SUBMIT_REQUEST</button>
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
        <div className="space-y-12">
            {isJoinModalOpen && selectedTeam && (
                <JoinTeamModal
                    team={selectedTeam}
                    onClose={() => setIsJoinModalOpen(false)}
                    onSubmit={onJoinRequest}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Operational Access</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        PLAYER <span className="text-brand">DASHBOARD</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 py-2 px-4 bg-surface-card border border-surface-border">
                    <Activity className="w-4 h-4 text-brand animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Node Online: {currentUser.username}</span>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="cyber-card p-6 border-l-2 border-l-brand">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Active Unit Assignments</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-display font-black text-white italic">{myTeams.length}</span>
                        <Users className="w-8 h-8 text-brand opacity-20" />
                    </div>
                </div>
                <div className="cyber-card p-6">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Pending Tactical Drills</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-display font-black text-white italic">{myAssignedDrills.length}</span>
                        <Crosshair className="w-8 h-8 text-brand opacity-20" />
                    </div>
                </div>
                <div className="cyber-card p-6">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Upcoming Sequences</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-display font-black text-white italic">{upcomingGames.length}</span>
                        <Calendar className="w-8 h-8 text-brand opacity-20" />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Teams & Drills */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Assigned Drills Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <Crosshair className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Tactical <span className="text-brand">Assigments</span></h2>
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
                                            INITIALIZE DRILL
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
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Active <span className="text-brand">Clusters</span></h2>
                            <div className="h-px bg-surface-border flex-grow"></div>
                        </div>

                        <div className="space-y-4">
                            {myTeams.length > 0 ? myTeams.map(team => (
                                <div key={team.id} className="cyber-card p-6">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <h3 className="text-xl font-display font-bold text-white uppercase italic tracking-tight">{team.name}</h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Unit Identified // Node Linked</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-surface-border">
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest">ID</th>
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest">CODENAME</th>
                                                    <th className="py-2 text-[8px] font-mono text-gray-600 uppercase tracking-widest text-right">PROTOCOL</th>
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
                                            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mt-2 text-center">+ {team.roster.length - 5} MORE ENTITIES</p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="cyber-card p-12 text-center opacity-50 grayscale">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No Linked Units</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Schedule & Exploration */}
                <div className="space-y-8">
                    {/* Game Feed */}
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Sequence Feed</h2>
                        <div className="space-y-4">
                            {upcomingGames.slice(0, 3).map(game => (
                                <div key={game.id} className="bg-surface-card border-l-2 border-brand p-4 space-y-2">
                                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest">Upcoming // Live In T-Minus</p>
                                    <p className="text-sm font-display font-bold text-white uppercase italic">{game.homeTeam.name} vs {game.awayTeam.name}</p>
                                    <p className="text-[8px] font-mono text-gray-500">INIT: {new Date(game.scheduledTime).toLocaleString()}</p>
                                </div>
                            ))}
                            {upcomingGames.length === 0 && (
                                <p className="text-[10px] font-mono text-gray-600 uppercase text-center py-4 bg-surface-card/20 border border-surface-border italic">No Upcoming Sequences</p>
                            )}
                        </div>
                    </section>

                    {/* Join Section */}
                    <section>
                        <h2 className="text-sm font-display font-bold text-white uppercase italic tracking-widest mb-4">Unit Expansion</h2>
                        <div className="cyber-card p-6 bg-brand/5">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4">Available Clusters</p>
                            <div className="space-y-2">
                                {otherTeams.length > 0 ? otherTeams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-2 hover:bg-white/5 group transition-colors border-b border-surface-border/50">
                                        <span className="text-xs font-mono text-gray-300 uppercase truncate pr-4">{team.name}</span>
                                        <button
                                            onClick={() => handleOpenJoinModal(team)}
                                            className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors flex-shrink-0"
                                        >
                                            [REQUEST_ASSIGN]
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-[8px] font-mono text-gray-600 uppercase italic">No Available Units</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;

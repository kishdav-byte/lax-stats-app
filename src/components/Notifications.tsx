import React from 'react';
import { AccessRequest, Role, Team, User, RequestStatus } from '../types';
import { ShieldAlert, Check, X, Bell } from 'lucide-react';

interface NotificationsProps {
    currentUser: User;
    requests: AccessRequest[];
    teams: Team[];
    users: User[];
    onUpdateRequestStatus: (requestId: string, newStatus: RequestStatus) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ currentUser, requests, teams, users, onUpdateRequestStatus }) => {
    const { role, teamIds } = currentUser;

    const relevantRequests = requests.filter(req => {
        if (req.status !== RequestStatus.PENDING) return false;
        if (role === Role.ADMIN) return true;
        if (role === Role.COACH && teamIds?.includes(req.teamId)) return true;
        return false;
    });

    if (relevantRequests.length === 0) return null;

    const canTakeAction = role === Role.ADMIN || role === Role.COACH;

    return (
        <div className="cyber-card p-6 border-brand bg-brand/5 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Bell className="w-24 h-24 rotate-12" />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <ShieldAlert className="w-5 h-5 text-brand animate-pulse" />
                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter">Team <span className="text-brand">Requests</span></h3>
                <div className="flex-grow h-[1px] bg-brand/30"></div>
                <p className="text-[10px] font-mono text-brand uppercase tracking-widest">{relevantRequests.length} Pending Actions</p>
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {relevantRequests.map(req => {
                    const requestingUser = users.find(u => u.id === req.requestingUserId);
                    const team = teams.find(t => t.id === req.teamId);

                    if (!requestingUser || !team) return null;

                    return (
                        <div key={req.id} className="bg-black/40 border border-surface-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-brand/50">
                            <div>
                                <p className="text-[11px] font-mono text-gray-300 uppercase tracking-wider leading-relaxed">
                                    Player <span className="text-brand font-bold">{requestingUser.username}</span> wants to join team <span className="text-white font-bold italic">{team.name.toUpperCase()}</span> as <span className="text-brand">#{req.playerJersey}</span> ({req.playerPosition || 'PLAYER'}).
                                </p>
                            </div>
                            {canTakeAction && (
                                <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                                    <button
                                        onClick={() => onUpdateRequestStatus(req.id, RequestStatus.APPROVED)}
                                        className="text-green-500 hover:text-green-400 text-[10px] font-mono uppercase tracking-[0.2em] font-bold flex items-center gap-2 px-3 py-1 border border-green-500/20 hover:bg-green-500/10 transition-all"
                                    >
                                        APPROVE <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onUpdateRequestStatus(req.id, RequestStatus.DENIED)}
                                        className="text-red-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-[0.2em] font-bold flex items-center gap-2 px-3 py-1 border border-red-500/20 hover:bg-red-500/10 transition-all"
                                    >
                                        REJECT <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Notifications;

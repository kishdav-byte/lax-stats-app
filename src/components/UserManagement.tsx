import React, { useState, useEffect } from 'react';
import { User, Role, Team } from '../types';
import { UserPlus, Shield, Binary, Trash2, Edit3, Lock, Unlock, ChevronRight } from 'lucide-react';

interface EditUserModalProps {
    user: User;
    teams: Team[];
    onSave: (user: User) => void;
    onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, teams, onSave, onClose }) => {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [teamIds, setTeamIds] = useState(user.teamIds || []);
    const [followedTeamIds, setFollowedTeamIds] = useState(user.followedTeamIds || []);
    const [followedPlayerIds, setFollowedPlayerIds] = useState(user.followedPlayerIds || []);
    const [password, setPassword] = useState('');

    const allPlayers = teams.flatMap(t => t.roster);

    useEffect(() => {
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setTeamIds(user.teamIds || []);
        setFollowedTeamIds(user.followedTeamIds || []);
        setFollowedPlayerIds(user.followedPlayerIds || []);
        setPassword('');
    }, [user]);

    const isCoachOrPlayer = role === Role.COACH || role === Role.PLAYER;

    const handleTeamSelection = (selectedTeamId: string) => {
        setTeamIds(prev =>
            prev.includes(selectedTeamId)
                ? prev.filter(id => id !== selectedTeamId)
                : [...prev, selectedTeamId]
        );
    };

    const handleRemoveFollowedTeam = (teamIdToRemove: string) => {
        setFollowedTeamIds(prev => prev.filter(id => id !== teamIdToRemove));
    };

    const handleRemoveFollowedPlayer = (playerIdToRemove: string) => {
        setFollowedPlayerIds(prev => prev.filter(id => id !== playerIdToRemove));
    };

    const handleSave = () => {
        const updatedUser: User = {
            ...user,
            username,
            email,
            role,
            teamIds: isCoachOrPlayer ? teamIds : undefined,
            followedTeamIds: role === Role.PARENT ? followedTeamIds : undefined,
            followedPlayerIds: role === Role.PARENT ? followedPlayerIds : undefined,
        };
        if (password.trim()) {
            updatedUser.password = password.trim();
        }
        onSave(updatedUser);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="cyber-card p-8 max-w-lg w-full space-y-6 bg-black border-brand/50">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-px bg-brand w-8"></div>
                    <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase">Entity Overwrite Protocol</p>
                </div>

                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">
                    MODIFY // <span className="text-brand">{user.username}</span>
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Codename</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full cyber-input text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Auth Protocol</label>
                            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full cyber-input text-sm appearance-none">
                                {Object.values(Role).map(r => <option key={r} value={r} className="bg-black">{r.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Comm Channel (Email)</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full cyber-input text-sm" />
                    </div>

                    {isCoachOrPlayer && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Cluster Assignments</label>
                            <div className="max-h-32 overflow-y-auto space-y-1 bg-surface-card p-3 border border-surface-border custom-scrollbar">
                                {teams.map(t => (
                                    <label key={t.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white/5 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={teamIds.includes(t.id)}
                                            onChange={() => handleTeamSelection(t.id)}
                                            className="h-4 w-4 bg-black border-surface-border text-brand focus:ring-brand focus:ring-offset-0 rounded-none pointer-events-none"
                                        />
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{t.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Update Access Key</label>
                        <input
                            type="password"
                            placeholder="REDACTED (LEAVE BLANK TO RETAIN)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full cyber-input text-sm"
                        />
                    </div>

                    {user.role === Role.PARENT && (
                        <div className="pt-4 border-t border-surface-border space-y-4">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-[0.2em] font-bold">Observer Streams</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Followed Units</label>
                                    <div className="max-h-24 overflow-y-auto bg-surface-card p-2 border border-surface-border space-y-1 custom-scrollbar">
                                        {followedTeamIds.length > 0 ? followedTeamIds.map(id => {
                                            const team = teams.find(t => t.id === id);
                                            return (
                                                <div key={id} className="flex justify-between items-center text-[9px] font-mono p-1 border-b border-surface-border/50">
                                                    <span className="text-gray-300 truncate">{team?.name}</span>
                                                    <button onClick={() => handleRemoveFollowedTeam(id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            );
                                        }) : <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">NONE</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Followed Entities</label>
                                    <div className="max-h-24 overflow-y-auto bg-surface-card p-2 border border-surface-border space-y-1 custom-scrollbar">
                                        {followedPlayerIds.length > 0 ? followedPlayerIds.map(id => {
                                            const player = allPlayers.find(p => p.id === id);
                                            return (
                                                <div key={id} className="flex justify-between items-center text-[9px] font-mono p-1 border-b border-surface-border/50">
                                                    <span className="text-gray-300 truncate">#{player?.jerseyNumber} {player?.name}</span>
                                                    <button onClick={() => handleRemoveFollowedPlayer(id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            );
                                        }) : <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">NONE</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-6 pt-6">
                    <button onClick={onClose} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort</button>
                    <button onClick={handleSave} className="cyber-button py-2 px-8">COMMIT_CHANGES</button>
                </div>
            </div>
        </div>
    );
};

interface UserManagementProps {
    users: User[];
    teams: Team[];
    onInviteUser: (user: Omit<User, 'id' | 'email' | 'teamIds' | 'status'>) => void;
    onDeleteUser: (userId: string) => void;
    onUpdateUser: (user: User) => void;
    onReturnToDashboard: (view: 'dashboard') => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, teams, onInviteUser, onDeleteUser, onUpdateUser, onReturnToDashboard }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.FAN);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
            onInviteUser({ username, password, role });
            setUsername(''); setPassword(''); setRole(Role.FAN);
        } else {
            alert("Protocol Violation: Codename and Access Key required.");
        }
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Access Control Matrix</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        USER <span className="text-brand">REGISTRY</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    RETURN TO COMMAND
                </button>
            </div>

            <div className="cyber-card p-8">
                <form onSubmit={handleInvite} className="space-y-8">
                    <div>
                        <h2 className="text-lg font-display font-bold uppercase italic mb-2">Provision New Entity</h2>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Register identity in the system before node assignment.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Codename</label>
                            <input type="text" placeholder="IDENTITY_IDENT" value={username} onChange={e => setUsername(e.target.value)} className="w-full cyber-input" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Access Key</label>
                            <input type="password" placeholder="KEY_AUTH" value={password} onChange={e => setPassword(e.target.value)} className="w-full cyber-input" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Auth Protocol</label>
                            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full cyber-input appearance-none">
                                {Object.values(Role).map(r => <option key={r} value={r} className="bg-black">{r.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="cyber-button px-12 flex items-center gap-3">
                        INITIALIZE ENTITY <UserPlus className="w-4 h-4" />
                    </button>
                </form>
            </div>

            <div className="pt-8">
                <div className="flex items-center gap-4 mb-8">
                    <Shield className="w-5 h-5 text-brand" />
                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Active <span className="text-brand">Node-Set</span></h2>
                    <div className="h-px bg-surface-border flex-grow"></div>
                </div>

                <div className="cyber-card">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[1000px] text-left border-collapse">
                            <thead className="bg-surface-card border-b border-surface-border">
                                <tr>
                                    <th className="p-4 px-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">CODENAME</th>
                                    <th className="p-4 px-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">PROTOCOL</th>
                                    <th className="p-4 px-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">STATUS</th>
                                    <th className="p-4 px-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">UNIT_CLUSTER</th>
                                    <th className="p-4 px-6 text-right text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">OPERATIONS</th>
                                </tr>
                            </thead>
                            <tbody className="bg-black">
                                {users.map(user => (
                                    <tr key={user.id} className={`border-b border-surface-border/50 hover:bg-white/5 transition-colors ${user.status === 'blocked' ? 'opacity-30 grayscale' : ''}`}>
                                        <td className="p-4 px-6">
                                            <p className="font-display font-bold text-white uppercase italic tracking-tight">{user.username}</p>
                                        </td>
                                        <td className="p-4 px-6">
                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{user.role}</span>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'blocked' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse'}`}></div>
                                                <span className={`text-[9px] font-mono uppercase tracking-widest ${user.status === 'blocked' ? 'text-red-500' : 'text-green-500'}`}>
                                                    {user.status === 'blocked' ? 'Offline/Blocked' : 'Online/Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {user.teamIds && user.teamIds.length > 0 ? user.teamIds.map(id => (
                                                    <span key={id} className="text-[8px] font-mono bg-surface-card px-2 py-0.5 border border-surface-border text-gray-500 uppercase">
                                                        {teams.find(t => t.id === id)?.name}
                                                    </span>
                                                )) : <span className="text-[8px] font-mono text-gray-700 uppercase">NONE_LINKED</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 px-6">
                                            {user.role !== Role.ADMIN && (
                                                <div className="flex justify-end gap-3 text-gray-500">
                                                    <button onClick={() => handleOpenEditModal(user)} className="hover:text-brand transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => onUpdateUser({ ...user, status: user.status === 'blocked' ? 'active' : 'blocked' })} className="hover:text-white transition-colors">
                                                        {user.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => onDeleteUser(user.id)} className="hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isEditModalOpen && editingUser && (
                <EditUserModal user={editingUser} teams={teams} onSave={handleSaveUser} onClose={handleCloseEditModal} />
            )}
        </div>
    );
};

export default UserManagement;

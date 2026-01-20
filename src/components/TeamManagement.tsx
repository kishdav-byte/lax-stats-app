import React, { useState } from 'react';
import { Team, Player, AccessRequest, User, RequestStatus, DrillAssignment, DrillType, DrillStatus, Role } from '../types';
import { generateRosterFromText } from '../services/geminiService';
import { Users, UserPlus, Upload, Shield, ChevronRight, Binary, Trash2, Search, Activity } from 'lucide-react';

interface ImportRosterModalProps {
    team: Team;
    onClose: () => void;
    onRosterImport: (roster: Player[]) => void;
}

const ImportRosterModal: React.FC<ImportRosterModalProps> = ({ team, onClose, onRosterImport }) => {
    const [pastedContent, setPastedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedRoster, setGeneratedRoster] = useState<Omit<Player, 'id'>[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedRoster(null);
        try {
            const roster = await generateRosterFromText(pastedContent);
            setGeneratedRoster(roster);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmImport = () => {
        if (generatedRoster) {
            const newRosterWithIds: Player[] = generatedRoster.map((player, index) => ({
                ...player,
                id: `player_${Date.now()}_${index}`
            }));
            onRosterImport(newRosterWithIds);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="cyber-card p-8 max-w-2xl w-full border-brand/50 bg-black">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-brand w-8"></div>
                    <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase">Data Ingestion Protocol</p>
                </div>

                <h2 className="text-2xl font-display font-black mb-2 uppercase italic">Import Roster // {team.name}</h2>
                <p className="text-gray-500 mb-8 text-[10px] font-mono uppercase tracking-widest">Target team website for automated extraction.</p>

                <textarea
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder="PASTE RAW ROSTER TEXT HERE..."
                    className="w-full h-48 cyber-input font-mono text-xs mb-6"
                    disabled={isGenerating}
                />

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} disabled={isGenerating} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort</button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !pastedContent.trim()}
                        className="cyber-button py-2 px-8 flex items-center gap-2"
                    >
                        {isGenerating ? 'ANALYZING...' : (
                            <>EXTRACT DATA <Search className="w-4 h-4" /></>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-900/10 border-l-2 border-red-500">
                        <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">Extraction Error: {error}</p>
                    </div>
                )}

                {generatedRoster && (
                    <div className="mt-8 pt-8 border-t border-surface-border animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-bold uppercase italic">{generatedRoster.length} Entities Identified</h3>
                            <Binary className="w-5 h-5 text-brand opacity-20" />
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar bg-surface-card p-4 space-y-2 border border-surface-border">
                            {generatedRoster.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] font-mono p-2 bg-black border border-surface-border">
                                    <span className="font-bold text-brand">IDENT: #{p.jerseyNumber}</span>
                                    <span className="text-white">{p.name}</span>
                                    <span className="text-gray-500 uppercase">{p.position}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <button onClick={handleConfirmImport} className="cyber-button w-full">
                                COMMIT {generatedRoster.length} ENTITIES TO DATABASE
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface AssignDrillModalProps {
    player: Player;
    onClose: () => void;
    onAssign: (drillType: DrillType, notes: string) => void;
}

const AssignDrillModal: React.FC<AssignDrillModalProps> = ({ player, onClose, onAssign }) => {
    const [drillType, setDrillType] = useState<DrillType>(DrillType.FACE_OFF);
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (notes.trim()) {
            onAssign(drillType, notes);
        } else {
            alert("Protocol requires notes/goals for assignment.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="cyber-card p-8 max-w-md w-full space-y-8 bg-black">
                <div className="flex items-center gap-4">
                    <div className="h-px bg-brand w-8"></div>
                    <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase">Tactical Assignment</p>
                </div>

                <h2 className="text-2xl font-display font-black uppercase italic">Target // {player.name}</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-2">Protocol Type</label>
                        <select
                            value={drillType}
                            onChange={e => setDrillType(e.target.value as DrillType)}
                            className="w-full cyber-input appearance-none"
                        >
                            {Object.values(DrillType).map(type => <option key={type} value={type} className="bg-black">{type.toUpperCase().replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-2">Operation Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="SET TARGET METRICS OR DRILL GOALS..."
                            rows={3}
                            className="w-full cyber-input font-mono text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-6 pt-4">
                    <button onClick={onClose} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort</button>
                    <button onClick={handleSubmit} className="cyber-button px-8 flex items-center gap-2">
                        INITIALIZE <Activity className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


interface TeamManagementProps {
    teams: Team[];
    onAddTeam: (teamName: string) => void;
    onUpdateTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
    onReturnToDashboard: (view: 'dashboard') => void;
    accessRequests: AccessRequest[];
    users: User[];
    onUpdateRequestStatus: (requestId: string, newStatus: RequestStatus) => void;
    drillAssignments: DrillAssignment[];
    onAddDrillAssignment: (playerId: string, drillType: DrillType, notes: string) => void;
    currentUser: User;
    onViewPlayerProfile: (player: Player, team: Team) => void;
}

const lacrossePositions = ['Attack', 'Midfield', 'Defense', 'Goalie', 'LSM', 'Face Off Specialist'];

const TeamManagement: React.FC<TeamManagementProps> = ({ teams, onAddTeam, onUpdateTeam, onDeleteTeam, onReturnToDashboard, accessRequests, users, onUpdateRequestStatus, drillAssignments, onAddDrillAssignment, currentUser, onViewPlayerProfile }) => {
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerNumber, setNewPlayerNumber] = useState('');
    const [newPlayerPosition, setNewPlayerPosition] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAssignDrillModalOpen, setIsAssignDrillModalOpen] = useState(false);
    const [playerToAssign, setPlayerToAssign] = useState<Player | null>(null);

    const pendingRequestsForTeam = selectedTeam
        ? accessRequests.filter(
            (req) => req.teamId === selectedTeam.id && req.status === RequestStatus.PENDING
        )
        : [];

    const handleAddTeam = () => {
        if (newTeamName.trim()) {
            onAddTeam(newTeamName.trim());
            setNewTeamName('');
        }
    };

    const handleAddPlayer = () => {
        if (selectedTeam && newPlayerName.trim() && newPlayerNumber.trim() && newPlayerPosition) {
            const newPlayer: Player = {
                id: `player_${Date.now()}`,
                name: newPlayerName.trim(),
                jerseyNumber: newPlayerNumber.trim(),
                position: newPlayerPosition.trim()
            };
            const updatedTeam = {
                ...selectedTeam,
                roster: [...selectedTeam.roster, newPlayer]
            };
            onUpdateTeam(updatedTeam);
            setSelectedTeam(updatedTeam);
            setNewPlayerName('');
            setNewPlayerNumber('');
            setNewPlayerPosition('');
        }
    };

    const handleDeletePlayer = (playerId: string) => {
        if (selectedTeam) {
            const updatedRoster = selectedTeam.roster.filter(p => p.id !== playerId);
            const updatedTeam = { ...selectedTeam, roster: updatedRoster };
            onUpdateTeam(updatedTeam);
            setSelectedTeam(updatedTeam);
        }
    };

    const handleRosterImport = (newRoster: Player[]) => {
        if (selectedTeam) {
            const updatedTeam = {
                ...selectedTeam,
                roster: newRoster,
            };
            onUpdateTeam(updatedTeam);
            setSelectedTeam(updatedTeam);
            setIsImportModalOpen(false);
        }
    };

    const handleOpenAssignDrillModal = (player: Player) => {
        setPlayerToAssign(player);
        setIsAssignDrillModalOpen(true);
    };

    const handleAssignDrill = (drillType: DrillType, notes: string) => {
        if (playerToAssign && playerToAssign.userId) {
            onAddDrillAssignment(playerToAssign.userId, drillType, notes);
        }
        setIsAssignDrillModalOpen(false);
        setPlayerToAssign(null);
    };


    return (
        <>
            {isImportModalOpen && selectedTeam && (
                <ImportRosterModal
                    team={selectedTeam}
                    onClose={() => setIsImportModalOpen(false)}
                    onRosterImport={handleRosterImport}
                />
            )}
            {isAssignDrillModalOpen && playerToAssign && (
                <AssignDrillModal
                    player={playerToAssign}
                    onClose={() => setIsAssignDrillModalOpen(false)}
                    onAssign={handleAssignDrill}
                />
            )}
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-brand w-12"></div>
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Personnel Management</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            TEAM <span className="text-brand">ROSTERS</span>
                        </h1>
                    </div>
                    <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                        RETURN TO COMMAND
                    </button>
                </div>

                <div className="cyber-card p-8">
                    <h2 className="text-lg font-display font-bold mb-4 uppercase italic">Initialize New Team String</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="ENTER TEAM DESIGNATION..."
                            className="flex-grow cyber-input"
                        />
                        <button onClick={handleAddTeam} className="cyber-button flex items-center justify-center gap-2">
                            ADD TEAM <UserPlus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Sidebar: Team List */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Binary className="w-4 h-4 text-brand" />
                            <h2 className="text-sm font-display font-bold uppercase tracking-widest">Active Units</h2>
                        </div>
                        <div className="space-y-2">
                            {teams.map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => setSelectedTeam(team)}
                                    className={`w-full text-left p-4 rounded-none border border-surface-border transition-all flex items-center justify-between group ${selectedTeam?.id === team.id
                                            ? 'bg-brand/10 border-brand text-brand'
                                            : 'bg-surface-card text-gray-400 hover:text-white hover:border-brand/50'
                                        }`}
                                >
                                    <span className="font-display font-black uppercase tracking-tight italic">{team.name}</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedTeam?.id === team.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content: Roster Details */}
                    <div className="md:col-span-2">
                        {selectedTeam ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="border-b border-surface-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">
                                        {selectedTeam.name} <span className="text-brand text-xl font-mono align-middle ml-2 opacity-20">// RSTR_01</span>
                                    </h2>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsImportModalOpen(true)} className="cyber-button-outline py-1 px-4 text-[10px] flex items-center gap-2">
                                            WEB_IMPORT <Upload className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => { onDeleteTeam(selectedTeam.id); setSelectedTeam(null); }} className="text-red-500 hover:text-red-400 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                                            PURGE <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {pendingRequestsForTeam.length > 0 && (
                                    <div className="cyber-card p-6 border-brand border-2">
                                        <h3 className="text-sm font-display font-bold text-brand mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Shield className="w-4 h-4 animate-pulse" /> Access Authorization Pending
                                        </h3>
                                        <ul className="space-y-3">
                                            {pendingRequestsForTeam.map(req => {
                                                const requestingUser = users.find(u => u.id === req.requestingUserId);
                                                if (!requestingUser) return null;
                                                return (
                                                    <li key={req.id} className="bg-surface-card p-4 border border-surface-border flex justify-between items-center group">
                                                        <div>
                                                            <p className="font-display font-bold text-white uppercase italic">{requestingUser.username}</p>
                                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                                                                Position Match: #{req.playerJersey} {req.playerPosition && `(${req.playerPosition})`}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <button onClick={() => onUpdateRequestStatus(req.id, RequestStatus.APPROVED)} className="text-green-500 hover:text-green-400 text-[10px] font-mono uppercase tracking-widest transition-colors font-bold">Approve</button>
                                                            <div className="w-[1px] bg-surface-border"></div>
                                                            <button onClick={() => onUpdateRequestStatus(req.id, RequestStatus.DENIED)} className="text-red-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest transition-colors font-bold">Deny</button>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-4">
                                        Manual Entry
                                        <div className="h-px bg-surface-border flex-grow"></div>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-surface-card p-6 border border-surface-border">
                                        <div className="sm:col-span-1">
                                            <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="DESIGNATION" className="w-full cyber-input text-xs" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <input type="text" value={newPlayerNumber} onChange={(e) => setNewPlayerNumber(e.target.value)} placeholder="00" className="w-full cyber-input text-xs" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <select
                                                value={newPlayerPosition}
                                                onChange={(e) => setNewPlayerPosition(e.target.value)}
                                                className="w-full cyber-input text-xs appearance-none"
                                            >
                                                <option value="" className="bg-black">SELECT ROLE</option>
                                                {lacrossePositions.map(pos => <option key={pos} value={pos} className="bg-black">{pos.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={handleAddPlayer} className="cyber-button text-xs py-2 px-4 shadow-[0_0_15px_rgba(255,87,34,0.3)]">
                                            COMMIT_ADD
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-4">
                                        Confirmed Roster
                                        <div className="h-px bg-surface-border flex-grow"></div>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedTeam.roster.map(player => {
                                            const playerAssignments = player.userId ? drillAssignments.filter(d => d.playerId === player.userId && d.status === DrillStatus.ASSIGNED) : [];
                                            const isCoachOfTeam = currentUser.role === Role.COACH && currentUser.teamIds?.includes(selectedTeam.id);
                                            const canAssign = currentUser.role === Role.ADMIN || isCoachOfTeam;
                                            return (
                                                <div key={player.id} className="cyber-card p-1 bg-surface-card/50">
                                                    <div className="bg-black p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div
                                                            className="flex items-center gap-6 cursor-pointer group"
                                                            onClick={() => onViewPlayerProfile(player, selectedTeam)}
                                                        >
                                                            <div className="w-10 h-10 border border-brand flex items-center justify-center font-display font-black text-brand italic">
                                                                {player.jerseyNumber}
                                                            </div>
                                                            <div>
                                                                <p className="font-display font-bold text-white uppercase italic group-hover:text-brand transition-colors tracking-tight">{player.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{player.position}</span>
                                                                    {!player.userId && (
                                                                        <>
                                                                            <div className="w-1 h-1 bg-surface-border rounded-full"></div>
                                                                            <span className="text-[8px] font-mono text-yellow-500/50 uppercase tracking-widest italic">Manual Record</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 self-end md:self-auto">
                                                            {player.userId && canAssign && (
                                                                <button
                                                                    onClick={() => handleOpenAssignDrillModal(player)}
                                                                    className="text-brand hover:text-brand-light text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2"
                                                                >
                                                                    INITIALIZE_DRILL <Activity className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <div className="w-[1px] h-4 bg-surface-border hidden md:block"></div>
                                                            <button
                                                                onClick={() => handleDeletePlayer(player.id)}
                                                                className="text-gray-600 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {playerAssignments.length > 0 && (
                                                        <div className="bg-brand/5 border-t border-brand/20 p-4 space-y-2">
                                                            <p className="text-[8px] font-mono text-brand uppercase tracking-[0.3em] font-bold">Active Directives:</p>
                                                            {playerAssignments.map(drill => (
                                                                <div key={drill.id} className="flex items-center gap-3">
                                                                    <div className="w-1 h-1 bg-brand rounded-full animate-pulse"></div>
                                                                    <div className="text-[10px] font-mono text-white/80 uppercase">
                                                                        {drill.drillType}: <span className="italic text-gray-500">"{drill.notes}"</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {selectedTeam.roster.length === 0 && (
                                            <div className="p-12 text-center border border-dashed border-surface-border animate-pulse">
                                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">No Entities Found in Unit Database</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="cyber-card p-12 text-center h-full flex flex-col items-center justify-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                                <Users className="w-16 h-16 mb-6 opacity-20 text-brand" />
                                <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter mb-2">Select Unit Cluster</h3>
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 max-w-xs">Awaiting team designation selection from units list.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeamManagement;

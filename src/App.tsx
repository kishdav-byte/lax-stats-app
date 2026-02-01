import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { Team, Game, Player, User, Role, AccessRequest, DrillAssignment, SoundEffects, Feedback, FeedbackStatus, TrainingSession } from './types';
import TeamManagement from './components/TeamManagement';
import Schedule from './components/Schedule';
import GameTracker from './components/GameTracker';
import Dashboard from './components/Dashboard';
import FaceOffTrainer from './components/FaceOffTrainer';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ParentDashboard from './components/ParentDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import Notifications from './components/Notifications';
import DevSupport from './components/DevSupport';
import TrainingMenu from './components/TrainingMenu';
import ShootingDrill from './components/ShootingDrill';
import SoundEffectsManager from './components/SoundEffectsManager';
import FeedbackComponent from './components/Feedback';
import GlobalSettings from './components/GlobalSettings';
import GameReport from './components/GameReport';
import Analytics from './components/Analytics';
import PlayerProfile from './components/PlayerProfile';
import * as storageService from './services/storageService';
import * as apiKeyService from './services/apiKeyService';
import * as authService from './services/authService';

const App: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [currentView, setCurrentView] = useState<storageService.View>('dashboard');
    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [drillAssignments, setDrillAssignments] = useState<DrillAssignment[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [soundEffects, setSoundEffects] = useState<SoundEffects>({});
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [activeDrillAssignment, setActiveDrillAssignment] = useState<DrillAssignment | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isApiKeyInitialized, setIsApiKeyInitialized] = useState(false);
    const [gameForReport, setGameForReport] = useState<Game | null>(null);
    const [viewingPlayer, setViewingPlayer] = useState<{ player: Player; team: Team } | null>(null);
    const [loginError, setLoginError] = useState('');
    const [simulatedRole, setSimulatedRole] = useState<Role | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const isSet = await apiKeyService.initializeApiKey();
            setIsApiKeyInitialized(isSet);

            const initialData = await storageService.fetchInitialData();
            if (initialData.teams) setTeams(initialData.teams);
            if (initialData.games) setGames(initialData.games);
            if (initialData.users) setUsers(initialData.users);
            if (initialData.accessRequests) setAccessRequests(initialData.accessRequests);
            if (initialData.drillAssignments) setDrillAssignments(initialData.drillAssignments);
            if (initialData.feedback) setFeedback(initialData.feedback);

            const effects = await storageService.fetchSoundEffects();
            setSoundEffects(effects);
        };
        loadData();

        const unsubscribeTeams = storageService.subscribeToTeams(setTeams);
        const unsubscribeGames = storageService.subscribeToGames(setGames);

        return () => {
            unsubscribeTeams();
            unsubscribeGames();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = authService.subscribeToAuthChanges(async (sbUser) => {
            if (sbUser) {
                let userData = await storageService.fetchUserById(sbUser.id);
                if (userData) {
                    const appUser: User = {
                        ...userData,
                        id: sbUser.id,
                        email: sbUser.email || userData.email || '',
                        lastLogin: sbUser.last_sign_in_at,
                    } as User;
                    setCurrentUser(appUser);
                    storageService.saveUser(appUser);

                    const unsubscribeSessions = storageService.subscribeToTrainingSessions(appUser.id, setTrainingSessions);
                    return () => unsubscribeSessions();
                }
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        setLoginError('');
        try {
            const { data, error } = await authService.login(email, pass);
            if (error) throw error;
        } catch (error: any) {
            setLoginError(error.message);
        }
    };

    const handleRegister = async (email: string, pass: string, profile: Omit<User, 'id' | 'email' | 'status'>) => {
        try {
            const { data, error } = await authService.register(email, pass);
            if (error) throw error;
            if (!data.user) throw new Error("Registration failed - no user returned");

            const newUser: User = { ...profile, id: data.user.id, email, status: 'pending' };
            await storageService.saveUser(newUser);
            setUsers([...users, newUser]);
            setCurrentUser(newUser);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        setCurrentUser(null);
        setCurrentView('dashboard');
        setSimulatedRole(null);
    };

    const handleRoleSimulation = (role: Role | null) => {
        if (currentUser?.role !== Role.ADMIN) return;
        setSimulatedRole(role);
        if (role === Role.PLAYER) setCurrentView('playerDashboard');
        else if (role === Role.PARENT) setCurrentView('parentDashboard');
        else setCurrentView('dashboard');
    };

    const handleUpdateFeedbackStatus = (feedbackId: string, status: FeedbackStatus) => {
        setFeedback(feedback.map(f => f.id === feedbackId ? { ...f, status } : f));
        const fb = feedback.find(f => f.id === feedbackId);
        if (fb) storageService.saveFeedback({ ...fb, status });
    };

    const handleViewReport = (game: Game) => {
        setGameForReport(game);
        setCurrentView('gameReport');
    };

    const handleViewPlayerProfile = (player: Player, team: Team) => {
        setViewingPlayer({ player, team });
        setCurrentView('playerProfile');
    };

    const effectiveRole = currentUser?.role === Role.ADMIN && simulatedRole ? simulatedRole : currentUser?.role;

    if (!currentUser) {
        return <Login onLogin={handleLogin} onRegister={handleRegister} onPasswordResetRequest={authService.resetPassword} error={loginError} />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'teams':
                return <TeamManagement teams={teams} onAddTeam={async (name) => {
                    const newTeam = { id: `team_${Date.now()}`, name, roster: [] };
                    await storageService.saveTeam(newTeam);
                }} onUpdateTeam={storageService.saveTeam} onDeleteTeam={storageService.deleteTeam} onReturnToDashboard={() => setCurrentView('dashboard')} accessRequests={accessRequests} users={users} onUpdateRequestStatus={async (id, status) => {
                    const req = accessRequests.find(r => r.id === id);
                    if (req) await storageService.saveAccessRequest({ ...req, status });
                }} drillAssignments={drillAssignments} onAddDrillAssignment={storageService.saveDrillAssignment} currentUser={currentUser} onViewPlayerProfile={handleViewPlayerProfile} onUpdateUser={storageService.saveUser} />;
            case 'schedule':
                return <Schedule teams={teams} games={games} onAddGame={async (h, a, d) => {
                    const newGame: Game = {
                        id: `game_${Date.now()}`,
                        homeTeam: teams.find(t => t.id === h)!,
                        awayTeam: typeof a === 'string' ? { name: a } : teams.find(t => t.id === a.id)!,
                        scheduledTime: d,
                        status: 'scheduled',
                        score: { home: 0, away: 0 },
                        stats: [],
                        periods: []
                    } as Game;
                    await storageService.saveGame(newGame);
                }} onStartGame={async (id) => {
                    const g = games.find(game => game.id === id);
                    if (g) {
                        await storageService.saveGame({ ...g, status: 'active' });
                        setActiveGameId(id);
                        setCurrentView('game');
                    }
                }} onDeleteGame={storageService.deleteGame} onReturnToDashboard={() => setCurrentView('dashboard')} onViewReport={handleViewReport} />;
            case 'game':
                const activeGame = games.find(g => g.id === activeGameId);
                if (activeGame) return <GameTracker game={activeGame} onUpdateGame={storageService.saveGame} onReturnToDashboard={() => setCurrentView('schedule')} onViewReport={handleViewReport} />;
                return null;
            case 'gameReport':
                return gameForReport ? <GameReport game={gameForReport} currentUser={currentUser} onUpdateGame={storageService.saveGame} onClose={() => { setGameForReport(null); setCurrentView(currentUser.role === Role.PLAYER ? 'playerDashboard' : 'dashboard'); }} /> : null;
            case 'analytics':
                return <Analytics teams={teams} games={games} trainingSessions={trainingSessions} onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'playerProfile':
                return viewingPlayer ? <PlayerProfile player={viewingPlayer.player} team={viewingPlayer.team} games={games} onClose={() => { setViewingPlayer(null); setCurrentView('teams'); }} /> : null;
            case 'trainingMenu':
                return <TrainingMenu onViewChange={setCurrentView} sessions={trainingSessions} onDeleteSession={storageService.deleteTrainingSession} />;
            case 'faceOffTrainer':
                return <FaceOffTrainer onReturnToDashboard={() => setCurrentView(activeDrillAssignment ? 'playerDashboard' : 'trainingMenu')} activeAssignment={activeDrillAssignment} onCompleteAssignment={storageService.saveDrillAssignment} onSaveSession={storageService.saveTrainingSession} soundEffects={soundEffects} />;
            case 'shootingDrill':
                return <ShootingDrill onReturnToDashboard={() => setCurrentView(activeDrillAssignment ? 'playerDashboard' : 'trainingMenu')} activeAssignment={activeDrillAssignment} onCompleteAssignment={storageService.saveDrillAssignment} onSaveSession={storageService.saveTrainingSession} soundEffects={soundEffects} />;
            case 'users':
                return <UserManagement users={users} teams={teams} onInviteUser={async (u) => {
                    const newUser = { ...u, id: `user_${Date.now()}`, email: `${u.username.toLowerCase()}@example.com`, status: 'active' as const } as User;
                    await storageService.saveUser(newUser);
                }} onDeleteUser={storageService.deleteUser} onUpdateUser={storageService.saveUser} onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'soundEffects':
                return <SoundEffectsManager soundEffects={soundEffects} onUpdateSoundEffect={(name, url) => {
                    const newEffects = { ...soundEffects, [name]: url };
                    setSoundEffects(newEffects);
                    storageService.saveSoundEffects(newEffects);
                }} onUpdateDrillTiming={async () => { }} onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'feedback':
                return <FeedbackComponent currentUser={currentUser} feedbackList={feedback} onAddFeedback={storageService.saveFeedback} onUpdateFeedbackStatus={handleUpdateFeedbackStatus} onReturnToDashboard={() => setCurrentView(currentUser.role === Role.PLAYER ? 'playerDashboard' : (currentUser.role === Role.PARENT ? 'parentDashboard' : 'dashboard'))} />;
            case 'devSupport':
                return <DevSupport onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'globalSettings':
                return <GlobalSettings onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'parentDashboard':
                return <ParentDashboard currentUser={currentUser} teams={teams} games={games} onUpdateUser={storageService.saveUser} />;
            case 'playerDashboard':
                return <PlayerDashboard currentUser={currentUser} teams={teams} games={games} onJoinRequest={storageService.saveAccessRequest} drillAssignments={drillAssignments} onStartDrill={(d) => { setActiveDrillAssignment(d); setCurrentView(d.type === 'Face-Off' ? 'faceOffTrainer' : 'shootingDrill'); }} />;
            case 'dashboard':
            default:
                return <Dashboard games={games} onStartGame={async (id) => {
                    const g = games.find(game => game.id === id);
                    if (g) {
                        await storageService.saveGame({ ...g, status: 'active' });
                        setActiveGameId(id);
                        setCurrentView('game');
                    }
                }} onViewChange={setCurrentView} activeGameId={activeGameId} onViewReport={handleViewReport} userRole={currentUser.role} />;
        }
    };

    const allNavItems = [
        { view: 'dashboard', label: 'Dashboard', roles: [Role.ADMIN, Role.COACH, Role.FAN] },
        { view: 'teams', label: 'Teams', roles: [Role.ADMIN, Role.COACH] },
        { view: 'schedule', label: 'Schedule', roles: [Role.ADMIN, Role.COACH] },
        { view: 'analytics', label: 'Analytics', roles: [Role.ADMIN, Role.COACH] },
        { view: 'trainingMenu', label: 'Training', roles: [Role.ADMIN, Role.COACH, Role.PLAYER] },
        { view: 'users', label: 'Users', roles: [Role.ADMIN, Role.COACH] },
        { view: 'feedback', label: 'Feedback', roles: [Role.ADMIN, Role.COACH, Role.PLAYER, Role.PARENT] },
        { view: 'soundEffects', label: 'Sound FX', roles: [Role.ADMIN] },
        { view: 'globalSettings', label: 'Settings', roles: [Role.ADMIN] },
        { view: 'devSupport', label: 'Dev Support', roles: [Role.ADMIN, Role.COACH] },
    ].filter(item => item.roles.includes(effectiveRole || Role.FAN));

    return (
        <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">
            <aside className="hidden md:flex w-64 bg-black border-r border-surface-border flex-col relative z-30">
                <div className="p-8 pb-4">
                    <div className="mb-8">
                        <h1 className="text-2xl font-display font-black text-white italic tracking-tighter">LAX<span className="text-brand">KEEPER</span></h1>
                        <div className="h-[1px] bg-brand w-8 mt-1"></div>
                    </div>
                    <div className="space-y-1 mt-12">
                        {allNavItems.map(item => (
                            <button key={item.view} onClick={() => setCurrentView(item.view as storageService.View)} className={`w-full text-left px-3 py-3 rounded-none text-xs font-display font-bold uppercase tracking-widest transition-all ${currentView === item.view ? 'bg-brand/10 text-brand border-l-2 border-brand' : 'text-gray-400 hover:text-white hover:bg-surface-card'}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                {currentUser.role === Role.ADMIN && (
                    <div className="p-8 pt-0 border-t border-surface-border bg-surface-card/20">
                        <button onClick={() => handleRoleSimulation(null)} className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider ${!simulatedRole ? 'text-brand' : 'text-gray-500'}`}>Admin View</button>
                        <button onClick={() => handleRoleSimulation(Role.COACH)} className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider ${simulatedRole === Role.COACH ? 'text-brand' : 'text-gray-500'}`}>Coach View</button>
                        <button onClick={() => handleRoleSimulation(Role.PLAYER)} className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider ${simulatedRole === Role.PLAYER ? 'text-brand' : 'text-gray-500'}`}>Player View</button>
                        <button onClick={() => handleRoleSimulation(Role.PARENT)} className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider ${simulatedRole === Role.PARENT ? 'text-brand' : 'text-gray-500'}`}>Parent View</button>
                    </div>
                )}
            </aside>
            <div className="flex-grow flex flex-col relative">
                <header className="h-20 border-b border-surface-border bg-black/80 backdrop-blur-md flex items-center justify-between px-8 relative z-20">
                    <div className="md:hidden">
                        <h1 className="text-xl font-display font-black text-white italic tracking-tighter">LAX<span className="text-brand">KEEPER</span></h1>
                    </div>
                    <div className="flex items-center gap-6 ml-auto">
                        <div className="text-sm font-display font-black text-white uppercase italic tracking-wider">{currentUser.username}</div>
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto custom-scrollbar bg-black">
                    <div className="max-w-7xl mx-auto p-6 md:p-12 relative">
                        <div className="absolute right-0 top-1/4 opacity-[0.02] pointer-events-none select-none -z-10"><p className="text-[200px] font-display font-black leading-none uppercase tracking-tighter">AI DATA</p></div>
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{renderContent()}</div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;

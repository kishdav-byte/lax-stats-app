import React, { useState, useCallback, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { Team, Game, Player, User, Role, AccessRequest, RequestStatus, DrillAssignment, DrillType, DrillStatus, SoundEffects, SoundEffectName, Feedback, FeedbackType, FeedbackStatus, TrainingSession } from './types';
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
import ApiKeyManager from './components/ApiKeyManager';
import GameReport from './components/GameReport';
import Analytics from './components/Analytics';
import PlayerProfile from './components/PlayerProfile';
import * as storageService from './services/storageService';
import * as apiKeyService from './services/apiKeyService';
import * as authService from './services/authService';

const App: React.FC = () => {
    // Initial state is empty, we load from Firestore
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [currentView, setCurrentView] = useState<storageService.View>('dashboard');
    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]); // Admin view of users
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [drillAssignments, setDrillAssignments] = useState<DrillAssignment[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [soundEffects, setSoundEffects] = useState<SoundEffects>({});
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [activeDrillAssignment, setActiveDrillAssignment] = useState<DrillAssignment | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isApiKeySet, setIsApiKeySet] = useState(apiKeyService.initializeApiKey());
    // const [isLoadingApiKey, setIsLoadingApiKey] = useState(true); // No longer needed
    const [gameForReport, setGameForReport] = useState<Game | null>(null);
    const [viewingPlayer, setViewingPlayer] = useState<{ player: Player; team: Team } | null>(null);
    const [loginError, setLoginError] = useState('');
    const [simulatedRole, setSimulatedRole] = useState<Role | null>(null);

    // Load initial data from Firestore
    useEffect(() => {
        const loadData = async () => {
            // Fetch static data (users, requests, etc.)
            // We keep these as one-time fetches for now, or could upgrade them too.
            // For now, let's just fix the critical sync items: Teams and Games.
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

        // Real-time subscriptions for critical data
        const unsubscribeTeams = storageService.subscribeToTeams((updatedTeams) => {
            setTeams(updatedTeams);
        });

        const unsubscribeGames = storageService.subscribeToGames((updatedGames) => {
            setGames(updatedGames);
        });

        return () => {
            unsubscribeTeams();
            unsubscribeGames();
        };
    }, []);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = authService.subscribeToAuthChanges(async (sbUser) => {
            console.log("Auth state changed. User:", sbUser?.id);
            if (sbUser) {
                // User is signed in. Find their profile in our 'profiles' table.
                let userData = await storageService.fetchUserById(sbUser.id);

                if (userData) {
                    // Merge auth data with profile data
                    const appUser: User = {
                        ...userData,
                        id: sbUser.id,
                        email: sbUser.email || userData.email || '',
                        lastLogin: sbUser.last_sign_in_at,
                    } as User;

                    // Update profile with last login info
                    storageService.saveUser(appUser);

                    // Auto-upgrade to Admin for specific email (case-insensitive)
                    // Auto-upgrade to Admin for specific email removed to respect selected registration roles.
                    // Admins can use the "Role Simulation" feature to test different views.

                    setCurrentUser(appUser);

                    // Set view based on role
                    if (appUser.role === Role.PLAYER) {
                        setCurrentView('playerDashboard');
                    } else if (appUser.role === Role.PARENT) {
                        setCurrentView('parentDashboard');
                    } else {
                        setCurrentView('dashboard');
                    }
                } else {
                    // User exists in Auth but not in our profiles table. Create a default profile.
                    console.warn("User profile not found in Supabase profiles. Creating default profile...");
                    const defaultUser: User = {
                        id: sbUser.id,
                        email: sbUser.email || '',
                        username: sbUser.user_metadata?.full_name || 'User',
                        role: Role.FAN, // Default to Fan instead of Coach if profile is missing
                        status: 'active',
                        password: '', // Not stored in DB, but required by type
                        lastLogin: sbUser.last_sign_in_at,
                    };

                    try {
                        await storageService.saveUser(defaultUser);
                        setCurrentUser(defaultUser);
                        setCurrentView('dashboard');
                        console.log("Default profile created and logged in.");
                    } catch (err) {
                        console.error("Failed to create default profile:", err);
                    }
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setCurrentView('dashboard');
                setTrainingSessions([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Separate effect for user-specific subscriptions
    useEffect(() => {
        if (currentUser) {
            const unsubscribeTraining = storageService.subscribeToTrainingSessions(currentUser.id, (sessions) => {
                setTrainingSessions(sessions);
            });
            return () => unsubscribeTraining();
        }
    }, [currentUser?.id]);

    // Seed default admin if empty (Logic moved to registration or manual setup for Firebase)
    // We can remove the auto-seeding useEffect for now as we rely on real registration.


    // Legacy save effect removed. We now save individually.

    useEffect(() => {
        if (currentUser?.role === Role.PLAYER && currentView === 'dashboard') {
            setCurrentView('playerDashboard');
        } else if (currentUser?.role !== Role.PLAYER && currentView === 'playerDashboard') {
            setCurrentView('dashboard');
        }
    }, [currentUser, currentView]);


    useEffect(() => {
        if (currentView === 'game' && !activeGameId) {
            const defaultView = currentUser?.role === Role.PLAYER ? 'playerDashboard' : 'dashboard';
            setCurrentView(defaultView);
        }
    }, [currentView, activeGameId, currentUser]);

    useEffect(() => {
        // Redirect if we are on the report page without a game selected (e.g., on refresh)
        if (currentView === 'gameReport' && !gameForReport) {
            const defaultView = currentUser?.role === Role.PLAYER ? 'playerDashboard' : 'dashboard';
            setCurrentView(defaultView);
        }
    }, [currentView, gameForReport, currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const role = currentUser.role;
        let isViewValidForRole = true;

        switch (currentView) {
            case 'users':
            case 'soundEffects':
            case 'devSupport':
            case 'analytics':
                if (role !== Role.ADMIN && role !== Role.COACH) isViewValidForRole = false;
                break;
            case 'parentDashboard':
                if (role !== Role.PARENT) isViewValidForRole = false;
                break;
            case 'playerDashboard':
                if (role !== Role.PLAYER) isViewValidForRole = false;
                break;
        }

        if (!isViewValidForRole) {
            // This user is on a view they shouldn't be on. Redirect them to their default dashboard.
            let defaultView: storageService.View = 'dashboard';
            if (role === Role.PLAYER) defaultView = 'playerDashboard';
            if (role === Role.PARENT) defaultView = 'parentDashboard';
            setCurrentView(defaultView);
        }
    }, [currentView, currentUser]);

    const handleLogin = async (username: string, password: string): Promise<void> => {
        setLoginError(''); // Clear previous error
        try {
            await authService.login(username, password);
        } catch (error: any) {
            console.error("Login failed", error);
            setLoginError(error.message || "Invalid email or password.");
        }
    };

    const handleRegister = async (username: string, email: string, password: string, role: Role): Promise<{ success: boolean, error?: string }> => {
        console.log("handleRegister called");
        try {
            const data = await authService.register(email, password);
            const sbUser = data.user;
            if (!sbUser) throw new Error("Registration failed – user object null.");

            console.log("Auth user created:", sbUser.id);

            const newUser: User = {
                id: sbUser.id,
                username,
                email,
                password: '', // Don't store password
                role: role,
                status: 'active',
            };

            // Save profile to Supabase
            console.log("Saving user profile to Supabase...");
            await storageService.saveUser(newUser);
            console.log("User profile saved. Proceeding...");

            // Update local state
            setUsers([...users, newUser]);
            setCurrentUser(newUser);

            return { success: true };
        } catch (error: any) {
            console.error("Registration failed", error);
            return { success: false, error: error.message };
        }
    };

    const handlePasswordResetRequest = async (email: string): Promise<void> => {
        try {
            await authService.resetPassword(email);
            // Success is handled by the UI showing the message
        } catch (error: any) {
            console.error("Password reset failed", error);
            // We generally don't want to reveal if an email exists or not for security,
            // but for this app, we can log it. The UI shows a generic success message.
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

        // Update view based on simulated role
        if (role === Role.PLAYER) {
            setCurrentView('playerDashboard');
        } else if (role === Role.PARENT) {
            setCurrentView('parentDashboard');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleInviteUser = (newUser: Omit<User, 'id' | 'email'>) => {
        const userWithId = { ...newUser, id: `user_${Date.now()}`, email: `${newUser.username.toLowerCase()}@example.com`, status: 'active' as const };
        const fullUser = userWithId as User;
        setUsers([...users, fullUser]);
        storageService.saveUser(fullUser);
    };

    const handleDeleteUser = (userId: string) => {
        if (currentUser && currentUser.id === userId) {
            alert("You cannot delete your own account.");
            return;
        }
        setUsers(users.filter(u => u.id !== userId));
        storageService.deleteUser(userId);
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        storageService.saveUser(updatedUser);
    };

    const checkAndStoreBestClampSpeed = (results: any) => {
        if (!currentUser || !results?.reactionTimes || results.reactionTimes.length === 0) return;

        const bestInSession = Math.min(...results.reactionTimes);
        if (!currentUser.bestClampSpeed || bestInSession < currentUser.bestClampSpeed) {
            console.log("New Personal Record! Storing best clamp speed:", bestInSession);
            handleUpdateUser({ ...currentUser, bestClampSpeed: bestInSession });
        }
    };

    const handleAddTeam = async (teamName: string) => {
        const newTeam: Team = { id: `team_${Date.now()}`, name: teamName, roster: [] };

        let currentTeams = [...teams];
        const sampleTeam = currentTeams.find(t => t.id === 'sample_team_id');
        const isFirstRealTeam = sampleTeam && currentTeams.length === 1;

        // If this is the first "real" team being added, we need to clean up all sample team associations.
        if (isFirstRealTeam && sampleTeam) {
            const sampleTeamPlayerIds = sampleTeam.roster.map(p => p.id);

            // Find users associated with the sample team and remove all associations
            const updatedUsers = users.map(user => {
                const newUser = { ...user };
                let hasChanged = false;

                if (newUser.teamIds?.includes('sample_team_id')) {
                    newUser.teamIds = newUser.teamIds.filter(id => id !== 'sample_team_id');
                    hasChanged = true;
                }
                if (newUser.followedTeamIds?.includes('sample_team_id')) {
                    newUser.followedTeamIds = newUser.followedTeamIds.filter(id => id !== 'sample_team_id');
                    hasChanged = true;
                }
                if (newUser.followedPlayerIds) {
                    const originalLength = newUser.followedPlayerIds.length;
                    newUser.followedPlayerIds = newUser.followedPlayerIds.filter(id => !sampleTeamPlayerIds.includes(id));
                    if (originalLength !== newUser.followedPlayerIds.length) {
                        hasChanged = true;
                    }
                }

                return hasChanged ? newUser : user;
            });
            setUsers(updatedUsers);

            // Clear the sample team's roster
            // We need to update this in storage too if we want it to persist
            // For now, we rely on the subscription to update the local 'teams' state
        }

        setTeams(prev => [...prev, newTeam]);
        await storageService.saveTeam(newTeam);
    };


    const handleUpdateTeam = async (updatedTeam: Team) => {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
        await storageService.saveTeam(updatedTeam);
    };

    const handleDeleteTeam = async (teamId: string) => {
        // Also need to delete associated games from storage
        const gamesToDelete = games.filter(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId);
        gamesToDelete.forEach(g => storageService.deleteGame(g.id));
        await storageService.deleteTeam(teamId);
    };

    const handleAddGame = async (homeTeamId: string, awayTeamInfo: { id?: string; name?: string }, scheduledTime: string) => {
        const homeTeam = teams.find(t => t.id === homeTeamId);
        let awayTeam: Team | undefined;

        if (awayTeamInfo.id) {
            awayTeam = teams.find(t => t.id === awayTeamInfo.id);
        } else if (awayTeamInfo.name) {
            const newOpponentTeam: Team = { id: `team_${Date.now()}`, name: awayTeamInfo.name, roster: [] };
            await storageService.saveTeam(newOpponentTeam);
            awayTeam = newOpponentTeam;
        }

        if (homeTeam && awayTeam) {
            const newGame: Game = {
                id: `game_${Date.now()}`,
                homeTeam,
                awayTeam,
                scheduledTime,
                status: 'scheduled',
                score: { home: 0, away: 0 },
                stats: [],
                penalties: [],
                currentPeriod: 1,
                gameClock: 720, // Default to 12 min quarters
                // Add new defaults
                periodType: 'quarters',
                clockType: 'stop',
                periodLength: 720,
                totalPeriods: 4,
            };
            setGames(prev => [...prev, newGame]);
            try {
                await storageService.saveGame(newGame);
                alert("Game saved successfully!");
            } catch (error) {
                console.error("Error saving game:", error);
                alert(`Failed to save game: ${error} `);
            }
        }
    };

    const handleUpdateGame = useCallback(async (updatedGame: Game) => {
        await storageService.saveGame(updatedGame);
        if (gameForReport?.id === updatedGame.id) {
            setGameForReport(updatedGame);
        }

        // If the game being updated is the active one and it's now finished,
        // clear the activeGameId. This will trigger the useEffect to navigate away.
        if (updatedGame.id === activeGameId && updatedGame.status === 'finished') {
            // We set a brief timeout to allow the user to see the "Game Over" screen
            // and its options before being navigated away.
            // This is a UX improvement over instant navigation.
            setTimeout(() => {
                // Check if the user hasn't already navigated to the report screen
                if (currentView === 'game') {
                    setActiveGameId(null);
                }
            }, 4000); // 4-second delay
        }
    }, [activeGameId, currentView, gameForReport]);

    /*
    const handleUpdateGame = useCallback((updatedGame: Game) => {
        setGames(prevGames => {
             // ...
        });
        storageService.saveGame(updatedGame); // ADDED
        // ...
    }, ...);
    */

    const handleReturnToDashboardFromGame = () => {
        setActiveGameId(null);
        const defaultView = currentUser?.role === Role.PLAYER ? 'playerDashboard' : 'dashboard';
        setCurrentView(defaultView);
    };

    const handleDeleteGame = (gameId: string) => {
        setGames(games.filter(g => g.id !== gameId));
        storageService.deleteGame(gameId);
    };

    const startGame = (gameId: string) => {
        const game = games.find(g => g.id === gameId);
        if (game) {
            // We no longer set status to 'live' here. The GameTracker component will handle it.
            setActiveGameId(gameId);
            setCurrentView('game');
        }
    };

    const handlePlayerJoinRequest = (teamId: string, playerJersey: string, playerPosition: string) => {
        if (!currentUser || currentUser.role !== Role.PLAYER) return;
        const newRequest: AccessRequest = {
            id: `req_${Date.now()}`,
            requestingUserId: currentUser.id,
            teamId,
            playerName: currentUser.username,
            playerJersey,
            playerPosition,
            status: RequestStatus.PENDING,
        };
        setAccessRequests([...accessRequests, newRequest]);
        storageService.saveAccessRequest(newRequest);
    };

    const handleUpdateRequestStatus = (requestId: string, newStatus: RequestStatus) => {
        const request = accessRequests.find(r => r.id === requestId);
        if (!request) return;

        if (newStatus === RequestStatus.APPROVED) {
            const requestingUser = users.find(u => u.id === request.requestingUserId);
            if (requestingUser) {
                // Add team to user's associations
                const updatedTeamIds = [...(requestingUser.teamIds || [])];
                if (!updatedTeamIds.includes(request.teamId)) {
                    updatedTeamIds.push(request.teamId);
                }
                handleUpdateUser({ ...requestingUser, teamIds: updatedTeamIds });

                // If it was a player join request, add them to the roster
                if (requestingUser.role === Role.PLAYER) {
                    const teamToUpdate = teams.find(t => t.id === request.teamId);
                    if (teamToUpdate) {
                        const newPlayer: Player = {
                            id: `player_${Date.now()}_${requestingUser.id}`,
                            name: requestingUser.username,
                            jerseyNumber: request.playerJersey,
                            position: request.playerPosition || 'N/A',
                            userId: requestingUser.id, // Link the roster player to the user account
                        };
                        const updatedRoster = [...teamToUpdate.roster, newPlayer];
                        handleUpdateTeam({ ...teamToUpdate, roster: updatedRoster });
                    }
                }
            }
        }

        setAccessRequests(accessRequests.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        const updatedRequest = accessRequests.find(r => r.id === requestId);
        if (updatedRequest) {
            storageService.saveAccessRequest({ ...updatedRequest, status: newStatus });
        }
    };

    const handleAddDrillAssignment = (playerId: string, drillType: DrillType, notes: string) => {
        if (!currentUser) return;
        const newAssignment: DrillAssignment = {
            id: `drill_${Date.now()}`,
            assigningCoachId: currentUser.id,
            playerId,
            drillType,
            notes,
            status: DrillStatus.ASSIGNED,
            assignedDate: new Date().toISOString(),
        };
        setDrillAssignments([...drillAssignments, newAssignment]);
        storageService.saveDrillAssignment(newAssignment);
    };

    const handleUpdateDrillAssignment = (assignmentId: string, status: DrillStatus, results?: any) => {
        let updatedAssignment: DrillAssignment | undefined;
        setDrillAssignments(prev => prev.map(assignment => {
            if (assignment.id === assignmentId) {
                updatedAssignment = {
                    ...assignment,
                    status,
                    results,
                    completedDate: new Date().toISOString()
                };
                return updatedAssignment;
            }
            return assignment;
        }));

        if (updatedAssignment) {
            storageService.saveDrillAssignment(updatedAssignment);
            if (results?.reactionTimes) {
                checkAndStoreBestClampSpeed(results);
            }
        }

        setActiveDrillAssignment(null); // Clear the active assignment
        // Return to the player's dashboard after completion
        setCurrentView(currentUser?.role === Role.PLAYER ? 'playerDashboard' : 'dashboard');
    };

    const handleStartAssignedDrill = (assignment: DrillAssignment) => {
        setActiveDrillAssignment(assignment);
        if (assignment.drillType === DrillType.FACE_OFF) {
            setCurrentView('faceOffTrainer');
        } else if (assignment.drillType === DrillType.SHOOTING) {
            setCurrentView('shootingDrill');
        }
    };

    const handleUpdateSoundEffect = (name: SoundEffectName, data: string | undefined) => {
        const updatedEffects = { ...soundEffects, [name]: data };
        setSoundEffects(updatedEffects);
        storageService.saveSoundEffects(updatedEffects);
    };

    const handleUpdateDrillTiming = (timing: SoundEffects['drillTiming']) => {
        const updatedEffects = { ...soundEffects, drillTiming: timing };
        setSoundEffects(updatedEffects);
        storageService.saveSoundEffects(updatedEffects);
    };

    const handleAddFeedback = (type: FeedbackType, message: string) => {
        if (!currentUser) return;
        const newFeedback: Feedback = {
            id: `feedback_${Date.now()}`,
            userId: currentUser.id,
            username: currentUser.username,
            userRole: currentUser.role,
            type,
            message,
            timestamp: new Date().toISOString(),
            status: FeedbackStatus.NEW,
        };
        setFeedback([...feedback, newFeedback]);
        storageService.saveFeedback(newFeedback);
        alert("Thank you! Your feedback has been submitted.");

        let returnView: storageService.View = 'dashboard';
        if (currentUser.role === Role.PLAYER) returnView = 'playerDashboard';
        if (currentUser.role === Role.PARENT) returnView = 'parentDashboard';
        if (currentUser.role === Role.PARENT) returnView = 'parentDashboard';
        setCurrentView(returnView);
    };

    const handleSaveTrainingSession = async (results: any) => {
        if (!currentUser) return;

        // Determine drill type based on results
        let drillType = DrillType.FACE_OFF;
        if (results.shotHistory) {
            drillType = DrillType.SHOOTING;
        }

        const newSession: TrainingSession = {
            id: `session_${Date.now()}`,
            userId: currentUser.id,
            drillType,
            date: new Date().toISOString(),
            results: results
        };

        console.log("Saving new training session:", newSession);

        // Optimistic update
        setTrainingSessions(prev => [...prev, newSession]);

        if (results.reactionTimes) {
            checkAndStoreBestClampSpeed(results);
        }

        try {
            await storageService.saveTrainingSession(newSession);
        } catch (error) {
            console.error("Failed to save training session:", error);
            alert("Failed to save training session. Please check your connection.");
            // Revert optimistic update
            setTrainingSessions(prev => prev.filter(s => s.id !== newSession.id));
        }
    };

    const handleDeleteTrainingSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;

        // Optimistic update
        setTrainingSessions(prev => prev.filter(s => s.id !== sessionId));

        try {
            await storageService.deleteTrainingSession(sessionId);
        } catch (error) {
            console.error("Failed to delete training session:", error);
            alert("Failed to delete training session.");
            // Revert (fetch again or just warn)
        }
    };

    const handleUpdateFeedbackStatus = (feedbackId: string, status: FeedbackStatus) => {
        setFeedback(feedback.map(f => f.id === feedbackId ? { ...f, status } : f));
        const fb = feedback.find(f => f.id === feedbackId);
        if (fb) storageService.saveFeedback({ ...fb, status });
    };

    const handleResetApiKey = async () => {
        await apiKeyService.clearApiKey();
        setIsApiKeySet(false);
    };

    const handleViewReport = (game: Game) => {
        setGameForReport(game);
        setCurrentView('gameReport');
    };

    const handleViewPlayerProfile = (player: Player, team: Team) => {
        setViewingPlayer({ player, team });
        setCurrentView('playerProfile');
    };


    const activeGame = games.find(g => g.id === activeGameId);



    console.log("App render. currentUser:", currentUser?.email, "currentView:", currentView, "isApiKeySet:", isApiKeySet);

    if (!isApiKeySet) {
        return <ApiKeyManager onApiKeySet={() => {
            setIsApiKeySet(true);
            // Re-initialize the API key in the service after it's set
            apiKeyService.initializeApiKey();
        }} />;
    }

    if (!currentUser) {
        return <Login
            onLogin={handleLogin}
            onRegister={handleRegister}
            onPasswordResetRequest={handlePasswordResetRequest}
            error={loginError}
            onResetApiKey={handleResetApiKey}
        />;
    }

    // Determine the effective role (simulated role for Admin testing, or actual role)
    const effectiveRole = currentUser.role === Role.ADMIN && simulatedRole ? simulatedRole : currentUser.role;

    const renderContent = () => {
        switch (currentView) {
            case 'teams':
                return <TeamManagement
                    teams={teams}
                    onAddTeam={handleAddTeam}
                    onUpdateTeam={handleUpdateTeam}
                    onDeleteTeam={handleDeleteTeam}
                    onReturnToDashboard={() => setCurrentView('dashboard')}
                    accessRequests={accessRequests}
                    users={users}
                    onUpdateRequestStatus={handleUpdateRequestStatus}
                    drillAssignments={drillAssignments}
                    onAddDrillAssignment={handleAddDrillAssignment}
                    currentUser={currentUser}
                    onViewPlayerProfile={handleViewPlayerProfile}
                />;
            case 'schedule':
                return <Schedule teams={teams} games={games} onAddGame={handleAddGame} onStartGame={startGame} onDeleteGame={handleDeleteGame} onReturnToDashboard={() => setCurrentView('dashboard')} onViewReport={handleViewReport} />;
            case 'game':
                if (activeGame) return <GameTracker game={activeGame} onUpdateGame={handleUpdateGame} onReturnToDashboard={handleReturnToDashboardFromGame} onViewReport={handleViewReport} />;
                return null;
            case 'gameReport':
                return gameForReport ? (
                    <GameReport
                        game={gameForReport}
                        currentUser={currentUser}
                        onUpdateGame={handleUpdateGame}
                        onClose={() => {
                            setGameForReport(null);
                            const defaultView = currentUser?.role === Role.PLAYER ? 'playerDashboard' : 'dashboard';
                            setCurrentView(defaultView);
                        }} />
                ) : null;
            case 'analytics':
                return <Analytics teams={teams} games={games} trainingSessions={trainingSessions} onReturnToDashboard={() => setCurrentView('dashboard')} />;
            case 'playerProfile':
                return viewingPlayer ? (
                    <PlayerProfile
                        player={viewingPlayer.player}
                        team={viewingPlayer.team}
                        games={games}
                        onClose={() => {
                            setViewingPlayer(null);
                            setCurrentView('teams'); // Go back to the teams view
                        }}
                    />
                ) : null;
            case 'trainingMenu':
                return <TrainingMenu onViewChange={setCurrentView} sessions={trainingSessions} onDeleteSession={handleDeleteTrainingSession} />;
            case 'faceOffTrainer':
                return <FaceOffTrainer
                    onReturnToDashboard={() => {
                        setActiveDrillAssignment(null); // Clear assignment if they leave early
                        setCurrentView(activeDrillAssignment ? 'playerDashboard' : 'trainingMenu');
                    }}
                    activeAssignment={activeDrillAssignment}
                    onCompleteAssignment={handleUpdateDrillAssignment}
                    onSaveSession={handleSaveTrainingSession}
                    soundEffects={soundEffects}
                />;
            case 'shootingDrill':
                return <ShootingDrill
                    onReturnToDashboard={() => {
                        setActiveDrillAssignment(null); // Clear assignment if they leave early
                        setCurrentView(activeDrillAssignment ? 'playerDashboard' : 'trainingMenu');
                    }}
                    activeAssignment={activeDrillAssignment}
                    onCompleteAssignment={handleUpdateDrillAssignment}
                    onSaveSession={handleSaveTrainingSession}
                    soundEffects={soundEffects}
                />;
            case 'users':
                if (currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) {
                    return <UserManagement users={users} teams={teams} onInviteUser={handleInviteUser} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onReturnToDashboard={() => setCurrentView('dashboard')} />;
                }
                return null; // Fallback for non-admins, handled by useEffect
            case 'soundEffects':
                if (currentUser.role === Role.ADMIN) {
                    return <SoundEffectsManager
                        soundEffects={soundEffects}
                        onUpdateSoundEffect={handleUpdateSoundEffect}
                        onUpdateDrillTiming={handleUpdateDrillTiming}
                        onReturnToDashboard={() => setCurrentView('dashboard')}
                    />;
                }
                return null; // Fallback for non-admins, handled by useEffect
            case 'feedback':
                return <FeedbackComponent
                    currentUser={currentUser}
                    feedbackList={feedback}
                    onAddFeedback={handleAddFeedback}
                    onUpdateFeedbackStatus={handleUpdateFeedbackStatus}
                    onReturnToDashboard={() => {
                        const defaultView = currentUser?.role === Role.PLAYER ? 'playerDashboard' : (currentUser?.role === Role.PARENT ? 'parentDashboard' : 'dashboard');
                        setCurrentView(defaultView);
                    }}
                />;
            case 'devSupport':
                if (currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) {
                    return <DevSupport onReturnToDashboard={() => setCurrentView('dashboard')} />;
                }
                return null; // Fallback for non-admins, handled by useEffect
            case 'parentDashboard':
                if (effectiveRole === Role.PARENT || currentUser.role === Role.ADMIN) {
                    return <ParentDashboard
                        currentUser={currentUser}
                        teams={teams}
                        games={games}
                        onUpdateUser={handleUpdateUser}
                    />
                }
                return null;
            case 'playerDashboard':
                if (effectiveRole === Role.PLAYER || currentUser.role === Role.ADMIN) {
                    return <PlayerDashboard
                        currentUser={currentUser}
                        teams={teams}
                        games={games}
                        onJoinRequest={handlePlayerJoinRequest}
                        drillAssignments={drillAssignments}
                        onStartDrill={handleStartAssignedDrill}
                    />
                }
                return null;
            case 'dashboard':
            default:
                return <Dashboard games={games} onStartGame={startGame} onViewChange={setCurrentView} activeGameId={activeGameId} onViewReport={handleViewReport} userRole={currentUser?.role} />;
        }
    };

    const isTrainingView = ['trainingMenu', 'faceOffTrainer', 'shootingDrill'].includes(currentView);

    if (currentUser) {
        console.log("Rendering Nav. User:", currentUser.email, "Role:", currentUser.role, "Simulated:", simulatedRole);
    }

    let allNavItems: { view: storageService.View; label: string }[] = [];

    if (effectiveRole === Role.ADMIN) {
        allNavItems = [
            { view: 'dashboard', label: 'Dashboard' },
            { view: 'teams', label: 'Teams' },
            { view: 'schedule', label: 'Schedule' },
            { view: 'analytics', label: 'Analytics' },
            { view: 'trainingMenu', label: 'Training' },
            { view: 'users', label: 'Users' },
            { view: 'feedback', label: 'Feedback' },
            { view: 'soundEffects', label: 'Sound FX' },
            { view: 'devSupport', label: 'Dev Support' },
        ];
    } else if (effectiveRole === Role.COACH) {
        allNavItems = [
            { view: 'dashboard', label: 'Dashboard' },
            { view: 'teams', label: 'Teams' },
            { view: 'schedule', label: 'Schedule' },
            { view: 'analytics', label: 'Analytics' },
            { view: 'trainingMenu', label: 'Training' },
            { view: 'feedback', label: 'Feedback' },
        ];
    } else if (effectiveRole === Role.PLAYER) {
        allNavItems = [
            { view: 'playerDashboard', label: 'Dashboard' },
            { view: 'trainingMenu', label: 'Training' },
            { view: 'feedback', label: 'Feedback' },
        ];
    } else if (effectiveRole === Role.PARENT) {
        allNavItems = [
            { view: 'parentDashboard', label: 'Dashboard' },
            { view: 'feedback', label: 'Feedback' },
        ];
    } else { // FAN, etc.
        allNavItems = [
            { view: 'dashboard', label: 'Dashboard' },
        ];
    }


    return (
        <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-black border-r border-surface-border flex-col relative z-30">
                <div className="p-8 pb-4">
                    <div className="mb-8">
                        <h1 className="text-2xl font-display font-black text-white italic tracking-tighter">
                            LAX<span className="text-brand">KEEPER</span>
                        </h1>
                        <div className="h-[1px] bg-brand w-8 mt-1"></div>
                        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-500 mt-2 italic">Intelligent // Athletic // Systems</p>
                    </div>

                    <div className="space-y-1 mt-12">
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4 px-2">Main Menu</p>
                        {allNavItems.map(item => {
                            const isActive = item.view === 'trainingMenu' ? isTrainingView : currentView === item.view;
                            return (
                                <button
                                    key={item.view}
                                    onClick={() => setCurrentView(item.view)}
                                    className={`w-full text-left px-3 py-3 rounded-none text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-between group ${isActive
                                        ? 'bg-brand/10 text-brand border-l-2 border-brand'
                                        : 'text-gray-400 hover:text-white hover:bg-surface-card'
                                        }`}
                                >
                                    {item.label}
                                    {isActive && <div className="w-1 h-1 bg-brand rounded-full animate-pulse"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Innovation Lab Marker Decoration */}
                <div className="mt-auto p-8 opacity-20 pointer-events-none">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-[100px] bg-gradient-to-b from-brand to-transparent"></div>
                        <div className="vertical-text font-mono text-[8px] uppercase tracking-[0.3em]">INNOVATION // LAB // 001</div>
                    </div>
                </div>

                {/* Role Simulation Controls (Admin Only) */}
                {currentUser.role === Role.ADMIN && (
                    <div className="p-8 pt-0 border-t border-surface-border bg-surface-card/20">
                        <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-3">Test Mode</p>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleRoleSimulation(null)}
                                className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${!simulatedRole ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                Admin View
                            </button>
                            <button
                                onClick={() => handleRoleSimulation(Role.PLAYER)}
                                className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${simulatedRole === Role.PLAYER ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                → Player View
                            </button>
                            <button
                                onClick={() => handleRoleSimulation(Role.COACH)}
                                className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${simulatedRole === Role.COACH ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                → Coach View
                            </button>
                            <button
                                onClick={() => handleRoleSimulation(Role.PARENT)}
                                className={`w-full text-left px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${simulatedRole === Role.PARENT ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                → Parent View
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-8 pt-0 mt-auto border-t border-surface-border bg-surface-card/30">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-brand transition-colors flex items-center gap-2"
                    >
                        EXTRACT // LOGOUT
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-20 bg-black/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-6 md:px-12 sticky top-0 z-20">
                    <div className="md:hidden">
                        <h1 className="text-xl font-display font-black text-white italic tracking-tighter">
                            LAX<span className="text-brand">KEEPER</span>
                        </h1>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <div className="h-4 w-px bg-surface-border"></div>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-mono text-gray-500 uppercase">Status:</p>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">System Online</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-5 py-3 px-6 bg-brand/5 border-r-2 border-brand/30 rounded-l-sm backdrop-blur-sm group hover:bg-brand/10 transition-all duration-300">
                            <div className="text-right hidden sm:block border-r border-brand/20 pr-5">
                                <p className="text-[9px] font-mono text-brand/60 uppercase tracking-[0.3em] font-bold leading-none mb-2">Node Operator</p>
                                <div className="flex flex-col items-end gap-0.5">
                                    <p className="text-sm font-display font-black text-white uppercase italic tracking-wider leading-none">{currentUser.username}</p>
                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">{currentUser.role.toUpperCase()}_ACCESS</p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-10 h-10 rounded-full bg-surface-card border border-brand/30 flex items-center justify-center relative z-10 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent"></div>
                                    <UserIcon className="w-5 h-5 text-brand drop-shadow-[0_0_8px_rgba(255,87,34,0.5)]" />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-white"
                        >
                            {!isMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </header>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-black border-b border-surface-border z-40 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        {allNavItems.map(item => {
                            const isActive = item.view === 'trainingMenu' ? isTrainingView : currentView === item.view;
                            return (
                                <button
                                    key={item.view}
                                    onClick={() => { setCurrentView(item.view); setIsMenuOpen(false); }}
                                    className={`w-full text-left p-3 text-xs font-display font-bold uppercase tracking-widest ${isActive ? 'text-brand' : 'text-gray-400'}`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                        <div className="pt-4 border-t border-surface-border">
                            <button onClick={handleLogout} className="w-full text-left p-3 text-xs font-mono text-brand uppercase tracking-widest">
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {/* Scrollable Body */}
                <main className="flex-grow overflow-y-auto custom-scrollbar bg-black">
                    <div className="max-w-7xl mx-auto p-6 md:p-12">
                        {/* Innovation Lab Background Text */}
                        <div className="absolute right-0 top-1/4 opacity-[0.02] pointer-events-none select-none -z-10">
                            <p className="text-[200px] font-display font-black leading-none uppercase tracking-tighter">AI DATA</p>
                        </div>

                        {currentView !== 'game' && currentView !== 'playerProfile' && (
                            <div className="mb-12">
                                <Notifications
                                    currentUser={currentUser}
                                    requests={accessRequests}
                                    teams={teams}
                                    users={users}
                                    onUpdateRequestStatus={handleUpdateRequestStatus}
                                />
                            </div>
                        )}

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;

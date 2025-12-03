import React, { useState, useCallback, useEffect } from 'react';
import { Team, Game, Player, User, Role, AccessRequest, RequestStatus, DrillAssignment, DrillType, DrillStatus, SoundEffects, SoundEffectName, Feedback, FeedbackType, FeedbackStatus } from './types';
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
    const [soundEffects, setSoundEffects] = useState<SoundEffects>({});
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [activeDrillAssignment, setActiveDrillAssignment] = useState<DrillAssignment | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isApiKeySet, setIsApiKeySet] = useState(apiKeyService.initializeApiKey());
    // const [isLoadingApiKey, setIsLoadingApiKey] = useState(true); // No longer needed
    const [gameForReport, setGameForReport] = useState<Game | null>(null);
    const [viewingPlayer, setViewingPlayer] = useState<{ player: Player; team: Team } | null>(null);
    const [loginError, setLoginError] = useState('');

    // Load initial data from Firestore
    useEffect(() => {
        const loadData = async () => {
            // Fetch static data (users, requests, etc.)
            // We keep these as one-time fetches for now, or could upgrade them too.
            // For now, let's just fix the critical sync items: Teams and Games.
            const initialData = await storageService.fetchInitialData();
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
        const unsubscribe = authService.subscribeToAuthChanges(async (firebaseUser) => {
            console.log("Auth state changed. User:", firebaseUser?.uid);
            if (firebaseUser) {
                // User is signed in. Find their profile in our 'users' collection.
                // Note: In a real app, we would fetch the specific user doc here.
                // Since we loaded all users above, we can find them in state, 
                // BUT 'users' state might not be ready yet if this fires first.
                // So we fetch the user doc directly to be safe.
                const userDocRef = doc(db, 'users', firebaseUser.uid);

                // Race getDoc against a timeout
                let userSnap: any;
                try {
                    const getPromise = getDoc(userDocRef);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
                    userSnap = await Promise.race([getPromise, timeoutPromise]);
                } catch (e) {
                    console.warn("Firestore getDoc timed out or failed. Proceeding as if new user.");
                    userSnap = { exists: () => false }; // Fake a missing doc to trigger fallback
                }

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    // Merge auth data with profile data
                    const appUser: User = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        username: userData.username || 'User',
                        role: userData.role || Role.FAN,
                        status: userData.status || 'active',
                        ...userData
                    } as User;
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
                    // User exists in Auth but not in Firestore. Create a default profile.
                    console.warn("User profile not found in Firestore. Creating default profile...");
                    const defaultUser: User = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        username: firebaseUser.displayName || 'User',
                        role: Role.COACH, // Default to Coach for now so they can see things
                        status: 'active',
                        password: '', // Not stored in Firestore, but required by type
                    };

                    try {
                        const savePromise = storageService.saveUser(defaultUser);
                        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));
                        await Promise.race([savePromise, timeoutPromise]);

                        setCurrentUser(defaultUser);
                        setCurrentView('dashboard');
                        console.log("Default profile created (or timed out) and logged in.");
                    } catch (err) {
                        console.error("Failed to create default profile:", err);
                        // If this fails, we might want to log them out or show an error
                    }
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setCurrentView('dashboard');
            }
        });
        return () => unsubscribe();
    }, []);

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
            const userCred = await authService.register(email, password);
            const firebaseUser = userCred.user;
            console.log("Auth user created:", firebaseUser.uid);

            const newUser: User = {
                id: firebaseUser.uid,
                username,
                email,
                password: '', // Don't store password
                role: role,
                status: 'active',
            };

            // Save profile to Firestore with timeout
            console.log("Saving user profile to Firestore...");
            // We race the save against a 2-second timeout so we don't hang the UI if Firestore is slow/offline
            const savePromise = storageService.saveUser(newUser);
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));

            await Promise.race([savePromise, timeoutPromise]);
            console.log("User profile save attempted. Proceeding...");

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

        await storageService.saveTeam(newTeam);
    };


    const handleUpdateTeam = async (updatedTeam: Team) => {
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
            await storageService.saveGame(newGame);
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
        setDrillAssignments(prev => prev.map(assignment => {
            if (assignment.id === assignmentId) {
                return {
                    ...assignment,
                    status,
                    results,
                    completedDate: new Date().toISOString()
                };
            }
            return assignment;
        }));
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
        setSoundEffects(prev => ({
            ...prev,
            [name]: data,
        }));
        storageService.saveSoundEffects({ ...soundEffects, [name]: data });
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
        setCurrentView(returnView);
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
                if (activeGame) return <GameTracker game={activeGame} onUpdateGame={handleUpdateGame} onReturnToDashboard={handleReturnToDashboardFromGame} currentUser={currentUser} onViewReport={handleViewReport} />;
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
                return <Analytics teams={teams} games={games} onReturnToDashboard={() => setCurrentView('dashboard')} />;
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
                return <TrainingMenu onViewChange={setCurrentView} />;
            case 'faceOffTrainer':
                return <FaceOffTrainer
                    onReturnToDashboard={() => {
                        setActiveDrillAssignment(null); // Clear assignment if they leave early
                        setCurrentView(activeDrillAssignment ? 'playerDashboard' : 'trainingMenu');
                    }}
                    activeAssignment={activeDrillAssignment}
                    onCompleteAssignment={handleUpdateDrillAssignment}
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
                    soundEffects={soundEffects}
                />;
            case 'users':
                if (currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) {
                    return <UserManagement users={users} teams={teams} onInviteUser={handleInviteUser} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onReturnToDashboard={() => setCurrentView('dashboard')} />;
                }
                return null; // Fallback for non-admins, handled by useEffect
            case 'soundEffects':
                if (currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) {
                    return <SoundEffectsManager
                        soundEffects={soundEffects}
                        onUpdateSoundEffect={handleUpdateSoundEffect}
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
                if (currentUser.role === Role.PARENT) {
                    return <ParentDashboard
                        currentUser={currentUser}
                        teams={teams}
                        games={games}
                        onUpdateUser={handleUpdateUser}
                    />
                }
                return null;
            case 'playerDashboard':
                if (currentUser.role === Role.PLAYER) {
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
                return <Dashboard games={games} onStartGame={startGame} onViewChange={setCurrentView} activeGameId={activeGameId} onViewReport={handleViewReport} />;
        }
    };

    const isTrainingView = ['trainingMenu', 'faceOffTrainer', 'shootingDrill'].includes(currentView);

    let allNavItems: { view: storageService.View; label: string }[] = [];

    if (currentUser.role === Role.ADMIN) {
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
    } else if (currentUser.role === Role.COACH) {
        allNavItems = [
            { view: 'dashboard', label: 'Dashboard' },
            { view: 'teams', label: 'Teams' },
            { view: 'schedule', label: 'Schedule' },
            { view: 'analytics', label: 'Analytics' },
            { view: 'trainingMenu', label: 'Training' },
            { view: 'feedback', label: 'Feedback' },
        ];
    } else if (currentUser.role === Role.PLAYER) {
        allNavItems = [
            { view: 'playerDashboard', label: 'Dashboard' },
            { view: 'trainingMenu', label: 'Training' },
            { view: 'feedback', label: 'Feedback' },
        ];
    } else if (currentUser.role === Role.PARENT) {
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
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <nav className="bg-gray-800 shadow-lg sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="font-bold text-xl text-cyan-400">LAX Keeper AI</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            {allNavItems.map(item => {
                                const isActive = item.view === 'trainingMenu' ? isTrainingView : currentView === item.view;
                                let className = `px-3 py-2 rounded-md text-sm font-medium `;
                                if (item.view === 'devSupport') {
                                    className += isActive ? 'bg-yellow-600 text-white' : 'text-yellow-400 hover:bg-gray-700 hover:text-white';
                                } else {
                                    className += isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
                                }
                                return (
                                    <button key={item.view} onClick={() => setCurrentView(item.view)} className={className}>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="hidden md:flex items-center">
                            <span className="text-gray-300 text-sm mr-4">Welcome, {currentUser.username} ({currentUser.role})</span>
                            <button onClick={handleLogout} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">Logout</button>
                        </div>
                        {/* Mobile Menu Button */}
                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                type="button"
                                className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded={isMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {/* Hamburger icon */}
                                <svg className={!isMenuOpen ? 'block h-6 w-6' : 'hidden h-6 w-6'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                {/* Close icon */}
                                <svg className={isMenuOpen ? 'block h-6 w-6' : 'hidden h-6 w-6'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden" id="mobile-menu">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {allNavItems.map(item => {
                                const isActive = item.view === 'trainingMenu' ? isTrainingView : currentView === item.view;
                                let className = `block w-full text-left px-3 py-2 rounded-md text-base font-medium `;
                                if (item.view === 'devSupport') {
                                    className += isActive ? 'bg-yellow-600 text-white' : 'text-yellow-400 hover:bg-gray-700 hover:text-white';
                                } else {
                                    className += isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
                                }
                                return (
                                    <button key={item.view} onClick={() => { setCurrentView(item.view); setIsMenuOpen(false); }} className={className}>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Mobile User Info & Logout */}
                        <div className="pt-4 pb-3 border-t border-gray-700">
                            <div className="flex items-center px-5">
                                <div>
                                    <div className="text-base font-medium leading-none text-white">{currentUser.username}</div>
                                    <div className="text-sm font-medium leading-none text-gray-400">{currentUser.role}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {currentView !== 'game' && currentView !== 'playerProfile' && <Notifications
                        currentUser={currentUser}
                        requests={accessRequests}
                        teams={teams}
                        users={users}
                        onUpdateRequestStatus={handleUpdateRequestStatus}
                    />}
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;

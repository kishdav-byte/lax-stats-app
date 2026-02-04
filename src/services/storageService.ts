import { supabase } from '../supabaseClient';
import { Team, Game, User, AccessRequest, DrillAssignment, Feedback, SoundEffects, TrainingSession } from '../types';

export type View = 'dashboard' | 'game' | 'teams' | 'schedule' | 'analytics' | 'playerProfile' | 'trainingMenu' | 'faceOffTrainer' | 'shootingDrill' | 'users' | 'soundEffects' | 'feedback' | 'devSupport' | 'globalSettings' | 'parentDashboard' | 'playerDashboard' | 'gameReport';

export interface AppDatabase {
    teams: Team[];
    games: Game[];
    users: User[];
    accessRequests: AccessRequest[];
    drillAssignments: DrillAssignment[];
    feedback: Feedback[];
    currentView: View;
    activeGameId: string | null;
}

export const INITIAL_STATE: Partial<AppDatabase> = {
    teams: [],
    games: [],
    users: [],
    accessRequests: [],
    drillAssignments: [],
    feedback: [],
    currentView: 'dashboard',
    activeGameId: null,
};

// --- Fetch Functions ---

export const fetchInitialData = async (): Promise<Partial<AppDatabase>> => {
    try {
        const [
            { data: teams },
            { data: games },
            { data: stats },
            { data: penalties },
            { data: users },
            { data: requests },
            { data: drills },
            { data: feedback }
        ] = await Promise.all([
            supabase.from('teams').select('*'),
            supabase.from('games').select('*'),
            supabase.from('game_stats').select('*'),
            supabase.from('game_penalties').select('*'),
            supabase.from('profiles').select('*'),
            supabase.from('access_requests').select('*'),
            supabase.from('drill_assignments').select('*'),
            supabase.from('feedback').select('*'),
        ]);

        // Stitch games together with their stats and penalties
        const stitchedGames: Game[] = (games || []).map(g => {
            // Handle both cases: homeTeam/awayTeam as JSONB objects OR as string IDs
            let homeTeam: Team;
            let awayTeam: Team;

            if (typeof g.homeTeam === 'object' && g.homeTeam !== null) {
                // homeTeam is already a full object from JSONB
                homeTeam = g.homeTeam as Team;
            } else {
                // homeTeam is a string ID (legacy format)
                const homeId = (g.homeTeam as string)?.trim();
                homeTeam = (teams || []).find(t => t.id?.trim() === homeId) || { id: homeId, name: homeId || 'Unknown', roster: [] };
            }

            if (typeof g.awayTeam === 'object' && g.awayTeam !== null) {
                // awayTeam is already a full object from JSONB
                awayTeam = g.awayTeam as Team;
            } else {
                // awayTeam is a string ID (legacy format)
                const awayId = (g.awayTeam as string)?.trim();
                awayTeam = (teams || []).find(t => t.id?.trim() === awayId) || { id: awayId, name: awayId || 'Unknown', roster: [] };
            }

            return {
                id: g.id,
                homeTeam,
                awayTeam,
                scheduledTime: g.scheduledTime,
                status: g.status,
                score: g.score || { home: 0, away: 0 },
                currentPeriod: g.currentPeriod || 1,
                gameClock: g.gameClock || 0,
                aiSummary: g.aiSummary,
                periodType: g.periodType,
                clockType: g.clockType,
                periodLength: g.periodLength,
                totalPeriods: g.totalPeriods,
                correctionNotes: g.correctionNotes,
                clockRunning: g.clockRunning || false,
                clockLastStarted: g.clockLastStarted,
                // timekeeperId removed - doesn't exist in Supabase schema
                // Ensure stats is always an array (merge from separate table + any JSONB data)
                stats: [
                    ...(stats || [])
                        .filter(s => s.game_id === g.id)
                        .map(s => ({
                            id: s.id,
                            gameId: s.game_id,
                            playerId: s.player_id,
                            teamId: s.team_id,
                            type: s.stat_type,
                            timestamp: s.game_clock_time,
                            period: s.period,
                            assistingPlayerId: s.assisting_player_id,
                            recordedBy: s.recorded_by
                        })),
                    ...(Array.isArray(g.stats) ? g.stats : [])
                ],
                // Ensure penalties is always an array (merge from separate table + any JSONB data)
                penalties: [
                    ...(penalties || [])
                        .filter(p => p.game_id === g.id)
                        .map(p => ({
                            id: p.id,
                            gameId: p.game_id,
                            playerId: p.player_id,
                            teamId: p.team_id,
                            type: p.penalty_type,
                            duration: p.duration,
                            startTime: p.start_time,
                            releaseTime: p.release_time,
                            period: p.period,
                            recordedBy: p.recorded_by
                        })),
                    ...(Array.isArray(g.penalties) ? g.penalties : [])
                ]
            };
        });

        return {
            teams: teams || [],
            games: stitchedGames,
            users: (users || []).map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                password: u.password || '',
                role: u.role,
                teamIds: u.teamIds,
                followedTeamIds: u.followedTeamIds,
                followedPlayerIds: u.followedPlayerIds,
                status: u.status,
                bestClampSpeed: u.bestClampSpeed
                // lastLogin removed - doesn't exist in schema
            })),
            accessRequests: (requests || []).map(r => ({
                id: r.id,
                requestingUserId: r.requesting_user_id,
                teamId: r.team_id,
                playerName: r.player_name || '',
                playerJersey: r.player_jersey,
                playerPosition: r.player_position,
                status: r.status,
                timestamp: r.timestamp || Date.now()
            })),
            drillAssignments: (drills || []).map(d => ({
                id: d.id,
                assigningCoachId: d.assigning_coach_id || '',
                playerId: d.player_id,
                drillType: d.drill_type,
                notes: d.notes,
                status: d.status,
                assignedDate: d.assigned_date || new Date().toISOString(),
                completedDate: d.completed_date,
                results: d.results
            })),
            feedback: feedback || [],
            currentView: 'dashboard',
            activeGameId: null
        };
    } catch (error) {
        console.error("Error fetching initial data from Supabase:", error);
        return {};
    }
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password || '',
        role: data.role,
        teamIds: data.teamIds,
        followedTeamIds: data.followedTeamIds,
        followedPlayerIds: data.followedPlayerIds,
        status: data.status,
        bestClampSpeed: data.bestClampSpeed
        // lastLogin removed - doesn't exist in schema
    };
};

export const subscribeToTeams = (callback: (teams: Team[]) => void) => {
    const subscription = supabase
        .channel('public:teams')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, async () => {
            const { data } = await supabase.from('teams').select('*');
            callback(data || []);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

export const subscribeToGames = (callback: (games: Game[]) => void) => {
    const fetchAndCallback = async () => {
        const res = await fetchInitialData();
        if (res.games) callback(res.games);
    };

    fetchAndCallback();

    const channel = supabase
        .channel('game-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, fetchAndCallback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_stats' }, fetchAndCallback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_penalties' }, fetchAndCallback)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// --- Save Functions ---

export const saveTeam = async (team: Team) => {
    const { error } = await supabase.from('teams').upsert(team);
    if (error) throw error;
};

export const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) throw error;
};

export const saveGame = async (game: Game) => {
    const dbGame = {
        id: game.id,
        homeTeam: game.homeTeam,  // Save full team object
        awayTeam: game.awayTeam,  // Save full team object
        scheduledTime: game.scheduledTime,
        status: game.status,
        score: game.score,
        currentPeriod: game.currentPeriod,
        gameClock: game.gameClock,
        aiSummary: game.aiSummary,
        periodType: game.periodType,
        clockType: game.clockType,
        periodLength: game.periodLength,
        totalPeriods: game.totalPeriods,
        correctionNotes: game.correctionNotes,
        clockRunning: game.clockRunning || false,
        clockLastStarted: game.clockLastStarted
        // timekeeperId removed - doesn't exist in Supabase schema
    };
    const { error } = await supabase.from('games').upsert(dbGame);
    if (error) throw error;
};

export const deleteGame = async (gameId: string) => {
    await supabase.from('games').delete().eq('id', gameId);
};

export const saveStat = async (stat: any) => {
    const dbStat = {
        id: stat.id,
        game_id: stat.gameId,
        player_id: stat.playerId,
        team_id: stat.teamId,
        stat_type: stat.type,
        game_clock_time: stat.timestamp,
        period: stat.period,
        recorded_by: stat.recordedBy,
        assisting_player_id: stat.assistingPlayerId
    };
    const { error } = await supabase.from('game_stats').upsert(dbStat);
    if (error) throw error;
};

export const deleteStat = async (statId: string) => {
    const { error } = await supabase.from('game_stats').delete().eq('id', statId);
    if (error) throw error;
};

export const savePenalty = async (penalty: any) => {
    const dbPenalty = {
        id: penalty.id,
        game_id: penalty.gameId,
        player_id: penalty.playerId,
        team_id: penalty.teamId,
        penalty_type: penalty.type,
        duration: penalty.duration,
        start_time: penalty.startTime,
        release_time: penalty.releaseTime,
        period: penalty.period,
        recorded_by: penalty.recordedBy
    };
    const { error } = await supabase.from('game_penalties').upsert(dbPenalty);
    if (error) throw error;
};

export const deletePenalty = async (penaltyId: string) => {
    const { error } = await supabase.from('game_penalties').delete().eq('id', penaltyId);
    if (error) throw error;
};

export const saveUser = async (user: User) => {
    const dbProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        teamIds: user.teamIds,
        followedTeamIds: user.followedTeamIds,
        followedPlayerIds: user.followedPlayerIds,
        status: user.status,
        bestClampSpeed: user.bestClampSpeed
        // last_login removed - doesn't exist in schema
    };

    const { error } = await supabase.from('profiles').upsert(dbProfile);
    if (error) throw error;
};

export const deleteUser = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
};

export const saveAccessRequest = async (request: AccessRequest) => {
    const dbRequest = {
        id: request.id,
        requesting_user_id: request.requestingUserId,
        team_id: request.teamId,
        player_name: request.playerName,
        player_jersey: request.playerJersey,
        player_position: request.playerPosition,
        status: request.status
    };
    await supabase.from('access_requests').upsert(dbRequest);
};

export const saveDrillAssignment = async (assignment: DrillAssignment) => {
    const dbAssignment = {
        id: assignment.id,
        assigning_coach_id: assignment.assigningCoachId,
        player_id: assignment.playerId,
        drill_type: assignment.drillType,
        notes: assignment.notes,
        status: assignment.status,
        assigned_date: assignment.assignedDate,
        completed_date: assignment.completedDate,
        results: assignment.results
    };
    await supabase.from('drill_assignments').upsert(dbAssignment);
};

export const saveFeedback = async (feedback: Feedback) => {
    await supabase.from('feedback').upsert(feedback);
};

export const saveSoundEffects = async (effects: SoundEffects) => {
    await supabase.from('settings').upsert({ id: 'sound_effects', data: { effects } });
};

export const fetchSoundEffects = async (): Promise<SoundEffects> => {
    const { data } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'sound_effects')
        .single();
    return data?.data?.effects || {};
};

export const saveAppSetting = async (id: string, data: any) => {
    const { error } = await supabase.from('settings').upsert({ id, data });
    if (error) throw error;
};

export const fetchAppSetting = async (id: string): Promise<any> => {
    const { data } = await supabase
        .from('settings')
        .select('data')
        .eq('id', id)
        .single();
    return data?.data || null;
};

export const saveManagedTeamId = (teamId: string) => {
    localStorage.setItem('lax_keeper_managed_team_id', teamId);
};

export const fetchManagedTeamId = (): string | null => {
    return localStorage.getItem('lax_keeper_managed_team_id');
};

export const saveTrainingSession = async (session: TrainingSession) => {
    const { error } = await supabase.from('training_sessions').upsert(session);
    if (error) throw error;
};

export const deleteTrainingSession = async (sessionId: string) => {
    const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId);
    if (error) throw error;
};

export const subscribeToTrainingSessions = (userId: string, callback: (sessions: TrainingSession[]) => void) => {
    const fetch = async () => {
        const { data } = await supabase.from('training_sessions').select('*').eq('userId', userId);
        callback(data || []);
    };
    fetch();
    const channel = supabase
        .channel(`training-sessions-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sessions', filter: `userId=eq.${userId}` }, fetch)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

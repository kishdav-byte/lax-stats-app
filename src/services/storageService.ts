import { Team, Game, User, AccessRequest, DrillAssignment, SoundEffects, Feedback, TrainingSession } from '../types';
import { supabase } from '../supabaseClient';

export type View = 'dashboard' | 'teams' | 'schedule' | 'game' | 'trainingMenu' | 'faceOffTrainer' | 'shootingDrill' | 'users' | 'devSupport' | 'playerDashboard' | 'parentDashboard' | 'soundEffects' | 'feedback' | 'gameReport' | 'analytics' | 'playerProfile' | 'globalSettings';

export interface AppDatabase {
    teams: Team[];
    games: Game[];
    users: User[];
    currentUser: User | null;
    accessRequests: AccessRequest[];
    drillAssignments: DrillAssignment[];
    soundEffects: SoundEffects;
    feedback: Feedback[];
    trainingSessions: TrainingSession[];
    currentView: View;
    activeGameId: string | null;
}

export const defaultState: AppDatabase = {
    teams: [],
    games: [],
    users: [],
    currentUser: null,
    accessRequests: [],
    drillAssignments: [],
    soundEffects: {},
    feedback: [],
    trainingSessions: [],
    currentView: 'dashboard',
    activeGameId: null,
};

// --- Fetch Functions ---

export const fetchInitialData = async (): Promise<Partial<AppDatabase>> => {
    try {
        const [
            { data: teams },
            { data: games },
            { data: users },
            { data: requests },
            { data: drills },
            { data: feedback }
        ] = await Promise.all([
            supabase.from('teams').select('*'),
            supabase.from('games').select('*'),
            supabase.from('profiles').select('*'),
            supabase.from('access_requests').select('*'),
            supabase.from('drill_assignments').select('*'),
            supabase.from('feedback').select('*'),
        ]);

        return {
            teams: teams || [],
            games: games || [],
            users: users || [],
            accessRequests: requests || [],
            drillAssignments: drills || [],
            feedback: feedback || [],
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

    if (error) {
        console.warn("fetchUserById error:", error);
        return null;
    }
    return data;
};

export const subscribeToTeams = (callback: (teams: Team[]) => void) => {
    // Fetch initial data immediately
    const fetchTeams = async () => {
        const { data } = await supabase.from('teams').select('*');
        callback(data || []);
    };
    fetchTeams();

    // Subscribe to changes
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
    // Fetch initial data immediately
    const fetchGames = async () => {
        const { data } = await supabase.from('games').select('*');
        callback(data || []);
    };
    fetchGames();

    // Subscribe to changes
    const subscription = supabase
        .channel('public:games')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, async () => {
            const { data } = await supabase.from('games').select('*');
            callback(data || []);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
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
    const { error } = await supabase.from('games').upsert(game);
    if (error) throw error;
};

export const deleteGame = async (gameId: string) => {
    await supabase.from('games').delete().eq('id', gameId);
};

export const saveUser = async (user: User) => {
    const { password, lastLogin, ...userProfile } = user;

    // Attempt save with lastLogin first
    const { error: firstError } = await supabase
        .from('profiles')
        .upsert({ ...userProfile, lastLogin });

    // If it fails because the column is missing, retry without it
    if (firstError && (firstError.message?.includes('lastLogin') || firstError.code === 'PGRST204')) {
        console.warn("Retrying saveUser without lastLogin column...");
        const { error: secondError } = await supabase
            .from('profiles')
            .upsert(userProfile);
        if (secondError) throw secondError;
    } else if (firstError) {
        throw firstError;
    }
};

export const deleteUser = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
};

export const saveAccessRequest = async (request: AccessRequest) => {
    await supabase.from('access_requests').upsert(request);
};

export const saveDrillAssignment = async (assignment: DrillAssignment) => {
    await supabase.from('drill_assignments').upsert(assignment);
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
    await supabase.from('training_sessions').upsert(session);
};

export const deleteTrainingSession = async (sessionId: string) => {
    await supabase.from('training_sessions').delete().eq('id', sessionId);
};

export const subscribeToTrainingSessions = (userId: string, callback: (sessions: TrainingSession[]) => void) => {
    const subscription = supabase
        .channel(`public:training_sessions:user:${userId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'training_sessions', filter: `userId=eq.${userId}` },
            async () => {
                const { data } = await supabase
                    .from('training_sessions')
                    .select('*')
                    .eq('userId', userId);
                callback(data || []);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

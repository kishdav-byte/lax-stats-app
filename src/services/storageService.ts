import { Team, Game, User, AccessRequest, DrillAssignment, SoundEffects, Feedback } from '../types';
import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
} from "firebase/firestore";

export type View = 'dashboard' | 'teams' | 'schedule' | 'game' | 'trainingMenu' | 'faceOffTrainer' | 'shootingDrill' | 'users' | 'devSupport' | 'playerDashboard' | 'parentDashboard' | 'soundEffects' | 'feedback' | 'gameReport' | 'analytics' | 'playerProfile';

export interface AppDatabase {
    teams: Team[];
    games: Game[];
    users: User[];
    currentUser: User | null;
    accessRequests: AccessRequest[];
    drillAssignments: DrillAssignment[];
    soundEffects: SoundEffects;
    feedback: Feedback[];
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
    currentView: 'dashboard',
    activeGameId: null,
};

// --- Firestore Helpers ---

const convertDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

// --- Fetch Functions ---

export const fetchInitialData = async (): Promise<Partial<AppDatabase>> => {
    try {
        const [teamsSnap, gamesSnap, usersSnap, requestsSnap, drillsSnap, feedbackSnap] = await Promise.all([
            getDocs(collection(db, 'teams')),
            getDocs(collection(db, 'games')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'accessRequests')),
            getDocs(collection(db, 'drillAssignments')),
            getDocs(collection(db, 'feedback')),
        ]);

        return {
            teams: teamsSnap.docs.map(d => convertDoc<Team>(d)),
            games: gamesSnap.docs.map(d => convertDoc<Game>(d)),
            users: usersSnap.docs.map(d => convertDoc<User>(d)),
            accessRequests: requestsSnap.docs.map(d => convertDoc<AccessRequest>(d)),
            drillAssignments: drillsSnap.docs.map(d => convertDoc<DrillAssignment>(d)),
            feedback: feedbackSnap.docs.map(d => convertDoc<Feedback>(d)),
        };
    } catch (error) {
        console.error("Error fetching initial data:", error);
        return {};
    }
};

// --- Save Functions ---

export const saveTeam = async (team: Team) => {
    await setDoc(doc(db, 'teams', team.id), team);
};

export const deleteTeam = async (teamId: string) => {
    await deleteDoc(doc(db, 'teams', teamId));
};

export const saveGame = async (game: Game) => {
    await setDoc(doc(db, 'games', game.id), game);
};

export const deleteGame = async (gameId: string) => {
    await deleteDoc(doc(db, 'games', gameId));
};

export const saveUser = async (user: User) => {
    // We don't save the password in Firestore for security (handled by Auth), 
    // but we might keep the user document for role/profile info.
    // Ensure we don't overwrite critical auth fields if we were syncing back from Auth.
    // For this app's logic, we'll store the user profile.
    const { password, ...userProfile } = user;
    await setDoc(doc(db, 'users', user.id), userProfile);
};

export const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
};

export const saveAccessRequest = async (request: AccessRequest) => {
    await setDoc(doc(db, 'accessRequests', request.id), request);
};

export const saveDrillAssignment = async (assignment: DrillAssignment) => {
    await setDoc(doc(db, 'drillAssignments', assignment.id), assignment);
};

export const saveFeedback = async (feedback: Feedback) => {
    await setDoc(doc(db, 'feedback', feedback.id), feedback);
};

// Sound effects are a bit different, usually a single document configuration
export const saveSoundEffects = async (effects: SoundEffects) => {
    // We'll store this in a 'settings' collection
    await setDoc(doc(db, 'settings', 'soundEffects'), { effects });
};

export const fetchSoundEffects = async (): Promise<SoundEffects> => {
    const snap = await getDocs(collection(db, 'settings'));
    const doc = snap.docs.find(d => d.id === 'soundEffects');
    return doc ? doc.data().effects : {};
};


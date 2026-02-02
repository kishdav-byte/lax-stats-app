export interface Player {
    id: string;
    name: string;
    jerseyNumber: string;
    position: string;
    userId?: string; // Link to the User ID, if the player has an account
}

export interface Team {
    id: string;
    name: string;
    roster: Player[];
}

export enum StatType {
    GOAL = 'Goal',
    ASSIST = 'Assist',
    SHOT = 'Shot',
    SAVE = 'Save',
    GROUND_BALL = 'Ground Ball',
    TURNOVER = 'Turnover',
    CAUSED_TURNOVER = 'Caused Turnover',
    FACEOFF_WIN = 'Faceoff Win',
    FACEOFF_LOSS = 'Faceoff Loss',
}

export interface Stat {
    id: string;
    gameId: string;
    playerId: string;
    teamId: string;
    type: StatType;
    timestamp: number; // in-game clock time in seconds
    period: number;
    assistingPlayerId?: string;
    recordedBy?: string; // User UUID who created this stat
}

export enum PenaltyType {
    SLASHING = 'Slashing',
    TRIPPING = 'Tripping',
    CROSS_CHECK = 'Cross Check',
    UNSPORTSMANLIKE_CONDUCT = 'Unsportsmanlike Conduct',
    ILLEGAL_BODY_CHECK = 'Illegal Body Check',
    HOLDING = 'Holding',
    INTERFERENCE = 'Interference',
    ILLEGAL_PROCEDURE = 'Illegal Procedure',
    PUSHING = 'Pushing',
    OFFSIDES = 'Offsides',
    WARDING = 'Warding',
    ILLEGAL_STICK = 'Illegal Stick'
}

export interface Penalty {
    id: string;
    gameId: string;
    playerId: string;
    teamId: string;
    type: PenaltyType;
    duration: number; // seconds
    startTime: number; // game clock time when penalty occurred
    releaseTime: number; // game clock time when player is released
    period: number;
    recordedBy?: string; // User UUID who created this penalty
}

export interface Game {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    scheduledTime: string;
    status: 'scheduled' | 'live' | 'finished';
    score: {
        home: number;
        away: number;
    };
    stats: Stat[];
    penalties: Penalty[];
    currentPeriod: number;
    gameClock: number; // seconds remaining in the period
    aiSummary?: string;
    // New fields for game setup
    periodType?: 'quarters' | 'halves';
    clockType?: 'running' | 'stop';
    periodLength?: number; // in seconds
    totalPeriods?: number;
    correctionNotes?: string;
    timekeeperId?: string; // User ID of the person currently managing the clock/score
}

export enum Role {
    ADMIN = 'Admin',
    COACH = 'Coach',
    PARENT = 'Parent',
    PLAYER = 'Player',
    FAN = 'Fan',
}

export interface User {
    id: string;
    username: string;
    email: string;
    password: string; // In a real app, this should be a hash.
    role: Role;
    teamIds?: string[]; // For coaches/players, teams they are a member of
    followedTeamIds?: string[]; // For parents, teams they are watching
    followedPlayerIds?: string[]; // For parents, players they are watching
    status?: 'active' | 'blocked';
    bestClampSpeed?: number; // Best reaction time in ms
    lastLogin?: string; // ISO string from Supabase
}

export enum RequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DENIED = 'denied',
}

export interface AccessRequest {
    id: string;
    requestingUserId: string; // User ID of the player requesting access
    teamId: string;
    playerName: string; // The user's name at the time of request
    playerJersey: string;
    playerPosition?: string;
    status: RequestStatus;
}

export enum DrillType {
    FACE_OFF = 'Face-Off',
    SHOOTING = 'Shooting',
}

export enum DrillStatus {
    ASSIGNED = 'Assigned',
    COMPLETED = 'Completed',
}

export interface DrillAssignment {
    id: string;
    assigningCoachId: string; // User ID of the coach
    playerId: string; // User ID of the player
    drillType: DrillType;
    notes: string;
    status: DrillStatus;
    assignedDate: string; // ISO string
    completedDate?: string; // ISO string
    results?: {
        reactionTimes?: number[]; // For face-off
        shotHistory?: number[];   // For shooting
    };
}

export type SoundEffectName = 'down' | 'set' | 'whistle' |
    'target_top_left' | 'target_top_center' | 'target_top_right' |
    'target_mid_left' | 'target_mid_center' | 'target_mid_right' |
    'target_bottom_left' | 'target_bottom_center' | 'target_bottom_right';

export interface SoundEffects {
    down?: string; // Base64 encoded
    set?: string;
    whistle?: string;
    // Shooting target commands
    target_top_left?: string;
    target_top_center?: string;
    target_top_right?: string;
    target_mid_left?: string;
    target_mid_center?: string;
    target_mid_right?: string;
    target_bottom_left?: string;
    target_bottom_center?: string;
    target_bottom_right?: string;

    drillTiming?: {
        faceOff: {
            startDelay: number;    // 1. Post-Start Delay
            commandDelay: number;  // 2. Command Transition (Down -> Set)
            whistleDelayType: 'fixed' | 'random';
            whistleFixedDelay: number; // 3. Whistle Reaction (Set -> Whistle)
            interRepDelay: number;
        };
        shooting: {
            startDelay: number;    // 1. Post-Start Delay
            commandDelay: number;  // 2. Command Transition (Countdown/Set -> Target)
            whistleDelayType: 'fixed' | 'random';
            whistleFixedDelay: number; // 3. Whistle Reaction (Target -> Whistle)
            interRepDelay: number;
        };
    };
}

export enum FeedbackType {
    BUG_REPORT = 'Bug Report',
    FEATURE_REQUEST = 'Feature Request',
    GENERAL_COMMENT = 'General Comment',
}

export enum FeedbackStatus {
    NEW = 'New',
    VIEWED = 'Viewed',
    RESOLVED = 'Resolved',
}

export interface Feedback {
    id: string;
    userId: string;
    username: string;
    userRole: Role;
    type: FeedbackType;
    message: string;
    timestamp: string; // ISO string
    status: FeedbackStatus;
}

export interface TrainingSession {
    id: string;
    userId: string;
    drillType: DrillType;
    date: string; // ISO string
    results: {
        reactionTimes?: number[]; // For face-off
        shotHistory?: number[];   // For shooting
        totalShots?: number;      // For shooting
        drillMode?: 'release' | 'placement'; // For shooting
        sessionType?: 'count' | 'timed'; // For face-off
        sessionValue?: number; // For face-off
    };
}

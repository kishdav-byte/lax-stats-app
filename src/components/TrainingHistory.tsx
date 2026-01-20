import React from 'react';
import { TrainingSession, DrillType } from '../types';
import { Trash2, Binary, Clock, BarChart3 } from 'lucide-react';

interface TrainingHistoryProps {
    sessions: TrainingSession[];
    onDeleteSession: (sessionId: string) => void;
}

const TrainingHistory: React.FC<TrainingHistoryProps> = ({ sessions, onDeleteSession }) => {
    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSummary = (session: TrainingSession) => {
        if (session.drillType === DrillType.FACE_OFF) {
            const times = session.results.reactionTimes || [];
            if (times.length === 0) return "DATA_UNAVAILABLE";
            const best = Math.min(...times);
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            return `${times.length} REPS // BEST: ${best}ms // AVG: ${avg}ms`;
        } else if (session.drillType === DrillType.SHOOTING) {
            const shots = session.results.shotHistory || [];
            if (session.results.drillMode === 'release') {
                const avg = Math.round(shots.reduce((a, b) => a + b, 0) / shots.length);
                return `${shots.length} SHOTS // AVG_REL: ${avg}ms`;
            } else {
                return `${shots.length} SHOTS // PLACEMENT_DRILL`;
            }
        }
        return "UNKNOWN_PROTOCOL";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <BarChart3 className="w-5 h-5 text-brand" />
                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">
                    TRAINING <span className="text-brand">HISTORY</span>
                </h2>
                <div className="h-px bg-surface-border flex-grow"></div>
            </div>

            {sortedSessions.length === 0 ? (
                <div className="cyber-card p-12 text-center opacity-50 border-dashed">
                    <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">No Historical Performance Data Detected</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {sortedSessions.map(session => (
                        <div key={session.id} className="cyber-card p-1 bg-surface-card/30">
                            <div className="bg-black p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-surface-border/50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-brand"></div>
                                        <span className="font-display font-bold text-white uppercase italic tracking-tight text-lg">
                                            {session.drillType.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-surface-card border border-surface-border">
                                            <Clock className="w-3 h-3 text-gray-500" />
                                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{formatDate(session.date)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest ml-4 font-bold">
                                        {getSummary(session)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm("CONFIRM DATA PURGE?")) {
                                            onDeleteSession(session.id);
                                        }
                                    }}
                                    className="text-gray-600 hover:text-red-500 transition-colors self-end sm:self-auto p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainingHistory;

import React from 'react';
import { TrainingSession, DrillType } from '../types';

interface TrainingHistoryProps {
    sessions: TrainingSession[];
    onDeleteSession: (sessionId: string) => void;
}

const TrainingHistory: React.FC<TrainingHistoryProps> = ({ sessions, onDeleteSession }) => {
    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const getSummary = (session: TrainingSession) => {
        if (session.drillType === DrillType.FACE_OFF) {
            const times = session.results.reactionTimes || [];
            if (times.length === 0) return "No data";
            const best = Math.min(...times);
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            return `${times.length} Reps | Best: ${best}ms | Avg: ${avg}ms`;
        } else if (session.drillType === DrillType.SHOOTING) {
            const shots = session.results.shotHistory || [];
            if (session.results.drillMode === 'release') {
                const avg = Math.round(shots.reduce((a, b) => a + b, 0) / shots.length);
                return `${shots.length} Shots | Avg Release: ${avg}ms`;
            } else {
                return `${shots.length} Shots | Placement Drill`;
            }
        }
        return "Unknown Drill";
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Training History</h2>
            {sortedSessions.length === 0 ? (
                <p className="text-gray-400">No training history yet. Start a drill to save your stats!</p>
            ) : (
                <div className="space-y-4">
                    {sortedSessions.map(session => (
                        <div key={session.id} className="bg-gray-700 p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-white">{session.drillType}</span>
                                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">{formatDate(session.date)}</span>
                                </div>
                                <p className="text-gray-300 mt-1">{getSummary(session)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this session?")) {
                                        onDeleteSession(session.id);
                                    }
                                }}
                                className="mt-2 sm:mt-0 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainingHistory;

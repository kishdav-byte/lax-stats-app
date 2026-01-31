import React, { useState, useMemo } from 'react';
import { Feedback, User, Role, FeedbackType, FeedbackStatus } from '../types';
import { View } from '../services/storageService';
import { Activity, MessageSquare, Send, ChevronRight, Activity as Binary } from 'lucide-react';

interface FeedbackComponentProps {
    currentUser: User;
    feedbackList: Feedback[];
    onAddFeedback: (type: FeedbackType, message: string) => void;
    onUpdateFeedbackStatus: (feedbackId: string, status: FeedbackStatus) => void;
    onReturnToDashboard: (view: View) => void;
}

const FeedbackForm: React.FC<{
    onAddFeedback: (type: FeedbackType, message: string) => void;
}> = ({ onAddFeedback }) => {
    const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.GENERAL_COMMENT);
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            alert('Problem: Please enter a message.');
            return;
        }
        onAddFeedback(feedbackType, message.trim());
        setMessage('');
    };

    return (
        <div className="cyber-card p-1">
            <div className="bg-black p-8 border border-surface-border">
                <div className="flex items-center gap-4 mb-6">
                    <MessageSquare className="w-5 h-5 text-brand" />
                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">SUBMIT <span className="text-brand">FEEDBACK</span></h2>
                </div>

                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
                    Have a suggestion, found a bug, or want to share a comment? Your input helps us improve the app.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="feedbackType" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">FEEDBACK TYPE</label>
                        <select
                            id="feedbackType"
                            value={feedbackType}
                            onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                            className="w-full cyber-input appearance-none"
                        >
                            {Object.values(FeedbackType).map(type => (
                                <option key={type} value={type} className="bg-black">{type.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">YOUR MESSAGE</label>
                        <textarea
                            id="message"
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your feedback here..."
                            className="w-full cyber-input min-h-[150px]"
                        />
                    </div>

                    <button type="submit" className="cyber-button w-full py-4 flex items-center justify-center gap-3 group">
                        SEND FEEDBACK <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const FeedbackViewer: React.FC<{
    feedbackList: Feedback[];
    onUpdateFeedbackStatus: (feedbackId: string, status: FeedbackStatus) => void;
}> = ({ feedbackList, onUpdateFeedbackStatus }) => {
    const sortedFeedback = useMemo(() => {
        const statusOrder = { [FeedbackStatus.NEW]: 1, [FeedbackStatus.VIEWED]: 2, [FeedbackStatus.RESOLVED]: 3 };
        return [...feedbackList].sort((a, b) => {
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [feedbackList]);

    const getStatusStyle = (status: FeedbackStatus) => {
        switch (status) {
            case FeedbackStatus.NEW: return 'text-yellow-500 border-yellow-500/30';
            case FeedbackStatus.VIEWED: return 'text-brand border-brand/30';
            case FeedbackStatus.RESOLVED: return 'text-green-500 border-green-500/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Activity className="w-5 h-5 text-brand" />
                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">FEEDBACK <span className="text-brand">LIST</span></h2>
                <div className="h-px bg-surface-border flex-grow"></div>
            </div>

            {sortedFeedback.length > 0 ? (
                <div className="grid gap-4">
                    {sortedFeedback.map(item => (
                        <div key={item.id} className="cyber-card p-0.5 opacity-90 hover:opacity-100 transition-opacity">
                            <div className="bg-black p-6 border border-surface-border relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rotate-45 translate-x-16 -translate-y-16 pointer-events-none"></div>

                                <div className="flex justify-between items-start flex-wrap gap-4 mb-6 relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-display font-bold text-white uppercase italic tracking-tight">{item.username}</p>
                                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5">{item.userRole}</span>
                                        </div>
                                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">{new Date(item.timestamp).toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`text-[10px] font-mono font-black border px-3 py-1 uppercase tracking-tighter ${getStatusStyle(item.status)}`}>
                                            {item.status}
                                        </div>
                                        <select
                                            value={item.status}
                                            onChange={(e) => onUpdateFeedbackStatus(item.id, e.target.value as FeedbackStatus)}
                                            className="bg-black text-[10px] font-mono text-gray-400 border border-surface-border p-1 focus:border-brand outline-none transition-colors"
                                        >
                                            {Object.values(FeedbackStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <p className="text-[10px] font-mono font-black text-brand uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <ChevronRight className="w-3 h-3" /> {item.type}
                                    </p>
                                    <div className="bg-surface-card/30 p-4 border-l-2 border-brand/50">
                                        <p className="text-sm font-light text-gray-300 whitespace-pre-wrap leading-relaxed italic">{item.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="cyber-card p-12 text-center opacity-20">
                    <Binary className="w-12 h-12 mx-auto mb-4 text-brand" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em]">No feedback received yet.</p>
                </div>
            )}
        </div>
    );
};

const FeedbackComponent: React.FC<FeedbackComponentProps> = ({
    currentUser,
    feedbackList,
    onAddFeedback,
    onUpdateFeedbackStatus,
    onReturnToDashboard,
}) => {
    const isAdmin = currentUser.role === Role.ADMIN;

    const getReturnView = (): View => {
        switch (currentUser.role) {
            case Role.PLAYER: return 'playerDashboard';
            case Role.PARENT: return 'parentDashboard';
            default: return 'dashboard';
        }
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Feedback Support</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        FEEDBACK <span className="text-brand">{isAdmin ? 'MANAGEMENT' : 'SUBMISSION'}</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard(getReturnView())} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {isAdmin ? (
                    <FeedbackViewer
                        feedbackList={feedbackList}
                        onUpdateFeedbackStatus={onUpdateFeedbackStatus}
                    />
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <FeedbackForm onAddFeedback={onAddFeedback} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackComponent;


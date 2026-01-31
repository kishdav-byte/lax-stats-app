import React from 'react';
import { View } from '../services/storageService';
import { TrainingSession } from '../types';
import TrainingHistory from './TrainingHistory';
import { Target, Zap } from 'lucide-react';

interface TrainingMenuProps {
    onViewChange: (view: View) => void;
    sessions: TrainingSession[];
    onDeleteSession: (sessionId: string) => void;
}

const TrainingMenu: React.FC<TrainingMenuProps> = ({ onViewChange, sessions, onDeleteSession }) => {
    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Training Hub</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        TRAINING <span className="text-brand">CENTER</span>
                    </h1>
                </div>
                <button onClick={() => onViewChange('dashboard')} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div
                    className="cyber-card p-1 group cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
                    onClick={() => onViewChange('faceOffTrainer')}
                >
                    <div className="bg-black p-10 flex flex-col items-center justify-center text-center h-full border border-surface-border group-hover:border-brand/40 transition-colors">
                        <div className="w-16 h-16 mb-6 rounded-full border border-brand/20 flex items-center justify-center group-hover:border-brand transition-colors">
                            <Zap className="w-8 h-8 text-brand group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4 group-hover:text-brand transition-colors">Face-Off Drills</h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-relaxed max-w-[200px]">
                            Practice reaction time against automated whistle sounds. AI feedback included.
                        </p>
                        <div className="mt-8 h-[1px] bg-brand/30 w-12 group-hover:w-24 transition-all duration-500"></div>
                    </div>
                </div>

                <div
                    className="cyber-card p-1 group cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
                    onClick={() => onViewChange('shootingDrill')}
                >
                    <div className="bg-black p-10 flex flex-col items-center justify-center text-center h-full border border-surface-border group-hover:border-brand/40 transition-colors">
                        <div className="w-16 h-16 mb-6 rounded-full border border-brand/20 flex items-center justify-center group-hover:border-brand transition-colors">
                            <Target className="w-8 h-8 text-brand group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4 group-hover:text-brand transition-colors">Shooting Drills</h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-relaxed max-w-[200px]">
                            Track shot speed and accuracy with heatmaps using motion detection.
                        </p>
                        <div className="mt-8 h-[1px] bg-brand/30 w-12 group-hover:w-24 transition-all duration-500"></div>
                    </div>
                </div>
            </div>

            <div className="pt-8">
                <TrainingHistory sessions={sessions} onDeleteSession={onDeleteSession} />
            </div>
        </div>
    );
};

export default TrainingMenu;

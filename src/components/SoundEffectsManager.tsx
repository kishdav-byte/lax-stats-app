import React from 'react';
import { Music, Activity } from 'lucide-react';
import { SoundEffects, SoundEffectName } from '../types';

interface SoundEffectsManagerProps {
    soundEffects: SoundEffects;
    onUpdateSoundEffect: (name: SoundEffectName, data: string | undefined) => void;
    onUpdateDrillTiming: (timing: SoundEffects['drillTiming']) => void;
    onReturnToDashboard: (view: any) => void;
}

const SoundEffectRow: React.FC<{
    name: SoundEffectName;
    label: string;
    soundData?: string;
    onUpdate: (name: SoundEffectName, data: string | undefined) => void;
}> = ({ name, label, soundData, onUpdate }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            onUpdate(name, result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex items-center justify-between p-4 bg-surface-card border border-surface-border hover:border-brand/30 transition-all group">
            <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</span>
                <span className="text-xs font-display font-bold text-white uppercase italic tracking-tight">
                    {soundData ? 'CUSTOM_LOADED.WAV' : 'SYSTEM_DEFAULT.EXE'}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {soundData && (
                    <button
                        onClick={() => onUpdate(name, undefined)}
                        className="text-[8px] font-mono text-gray-700 hover:text-red-500 uppercase tracking-tighter"
                    >
                        RESET
                    </button>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="cyber-button-outline px-4 py-1 text-[8px] font-mono"
                >
                    {soundData ? 'REPLACE' : 'UPLOAD'}
                </button>
            </div>
        </div>
    );
};

const SoundEffectsManager: React.FC<SoundEffectsManagerProps> = ({ soundEffects, onUpdateSoundEffect, onUpdateDrillTiming, onReturnToDashboard }) => {
    const [activeDrillTab, setActiveDrillTab] = React.useState<'faceOff' | 'shooting'>('faceOff');
    const [soundCategory, setSoundCategory] = React.useState<'base' | 'targets'>('base');

    const defaultTiming = {
        faceOff: { startDelay: 1, commandDelay: 0.75, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 },
        shooting: { startDelay: 1, commandDelay: 1, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 }
    };

    const timing = soundEffects.drillTiming || defaultTiming;
    const currentDrillTiming = (timing as any)[activeDrillTab] || (defaultTiming as any)[activeDrillTab];

    const updateCurrentDrill = (updates: Partial<typeof currentDrillTiming>) => {
        onUpdateDrillTiming({
            ...timing,
            [activeDrillTab]: { ...currentDrillTiming, ...updates }
        });
    };

    const targetSounds: { name: SoundEffectName; label: string }[] = [
        { name: 'target_top_left', label: 'Top Left' },
        { name: 'target_top_right', label: 'Top Right' },
        { name: 'target_bottom_left', label: 'Bottom Left' },
        { name: 'target_bottom_right', label: 'Bottom Right' },
    ];

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Audio Control Center</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        SOUNDS <span className="text-brand">& TIMING</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Audio Upload Card */}
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Music className="w-5 h-5 text-brand" />
                                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">AUDIO <span className="text-brand">REGISTRY</span></h2>
                            </div>
                            <div className="flex gap-2 p-1 bg-surface-card border border-surface-border">
                                <button onClick={() => setSoundCategory('base')} className={`px-4 py-1 text-[8px] font-mono uppercase tracking-widest transition-all ${soundCategory === 'base' ? 'bg-brand text-black' : 'text-gray-500 hover:text-white'}`}>Base</button>
                                <button onClick={() => setSoundCategory('targets')} className={`px-4 py-1 text-[8px] font-mono uppercase tracking-widest transition-all ${soundCategory === 'targets' ? 'bg-brand text-black' : 'text-gray-500 hover:text-white'}`}>Targets</button>
                            </div>
                        </div>

                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-10 leading-relaxed">
                            {soundCategory === 'base'
                                ? "Core drill signals and verbal commands. Required for standard module flow."
                                : "Zone-specific commands for adaptive shooting drills. If missing, system uses visual cues."}
                        </p>

                        <div className="grid gap-4 flex-grow overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {soundCategory === 'base' ? (
                                <>
                                    <SoundEffectRow name="down" label="Down" soundData={soundEffects.down} onUpdate={onUpdateSoundEffect} />
                                    <SoundEffectRow name="set" label="Set" soundData={soundEffects.set} onUpdate={onUpdateSoundEffect} />
                                    <SoundEffectRow name="whistle" label="Whistle" soundData={soundEffects.whistle} onUpdate={onUpdateSoundEffect} />
                                </>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {targetSounds.map(sound => (
                                        <SoundEffectRow
                                            key={sound.name}
                                            name={sound.name}
                                            label={sound.label}
                                            soundData={(soundEffects as any)[sound.name]}
                                            onUpdate={onUpdateSoundEffect}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Granular Timing Settings Card */}
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <Activity className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">3-STAGE <span className="text-brand">TIMING</span></h2>
                        </div>

                        {/* Drill Selector Tabs */}
                        <div className="flex gap-2 mb-12 p-1 bg-surface-card border border-surface-border">
                            <button
                                onClick={() => setActiveDrillTab('faceOff')}
                                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${activeDrillTab === 'faceOff' ? 'bg-brand text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                FACE-OFF MODULE
                            </button>
                            <button
                                onClick={() => setActiveDrillTab('shooting')}
                                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${activeDrillTab === 'shooting' ? 'bg-brand text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                SHOOTING MODULE
                            </button>
                        </div>

                        <div className="space-y-12 flex-grow">
                            {/* 1. Start Delay */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">Stage 01: Post-Start Delay</p>
                                    <p className="text-2xl font-display font-black text-white italic">{currentDrillTiming.startDelay}s</p>
                                </div>
                                <input
                                    type="range" min="0" max="10" step="0.5"
                                    value={currentDrillTiming.startDelay}
                                    onChange={(e) => updateCurrentDrill({ startDelay: parseFloat(e.target.value) })}
                                    className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[8px] font-mono text-gray-600 uppercase">Wait time from pressing START to first command.</p>
                            </div>

                            {/* 2. Transition Delay */}
                            <div className="space-y-3 pt-4 border-t border-surface-border/30">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">Stage 02: Command Transition</p>
                                    <p className="text-2xl font-display font-black text-white italic">{currentDrillTiming.commandDelay}s</p>
                                </div>
                                <input
                                    type="range" min="0.5" max="5" step="0.25"
                                    value={currentDrillTiming.commandDelay}
                                    onChange={(e) => updateCurrentDrill({ commandDelay: parseFloat(e.target.value) })}
                                    className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[8px] font-mono text-gray-600 uppercase">
                                    {activeDrillTab === 'faceOff' ? "Interval between 'Down' and 'Set' commands." : "Interval between 'Set' and 'Target Command'."}
                                </p>
                            </div>

                            {/* 3. Whistle Timing */}
                            <div className="space-y-4 pt-4 border-t border-surface-border/30">
                                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">Stage 03: Whistle Reaction Interval</p>
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => updateCurrentDrill({ whistleDelayType: 'fixed' })}
                                        className={`flex-1 py-2 text-[9px] font-mono border transition-all ${currentDrillTiming.whistleDelayType === 'fixed' ? 'bg-brand/20 text-brand border-brand' : 'bg-transparent text-gray-600 border-surface-border hover:border-gray-700'}`}
                                    >
                                        FIXED
                                    </button>
                                    <button
                                        onClick={() => updateCurrentDrill({ whistleDelayType: 'random' })}
                                        className={`flex-1 py-2 text-[9px] font-mono border transition-all ${currentDrillTiming.whistleDelayType === 'random' ? 'bg-brand/20 text-brand border-brand' : 'bg-transparent text-gray-600 border-surface-border hover:border-gray-700'}`}
                                    >
                                        RANDOM (1.0s - 3.5s)
                                    </button>
                                </div>

                                {currentDrillTiming.whistleDelayType === 'fixed' && (
                                    <div className="space-y-3 px-4 py-3 bg-surface-card/50 border border-surface-border/30">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Fixed Duration</p>
                                            <p className="text-xl font-display font-black text-brand italic">{currentDrillTiming.whistleFixedDelay}s</p>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="5" step="0.1"
                                            value={currentDrillTiming.whistleFixedDelay}
                                            onChange={(e) => updateCurrentDrill({ whistleFixedDelay: parseFloat(e.target.value) })}
                                            className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 4. Inter-Rep Delay */}
                            <div className="space-y-3 pt-4 border-t border-brand/10">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-mono text-brand/50 uppercase tracking-[0.2em]">Inter-Rep Recovery</p>
                                    <p className="text-2xl font-display font-black text-white italic">{currentDrillTiming.interRepDelay}s</p>
                                </div>
                                <input
                                    type="range" min="1" max="30" step="1"
                                    value={currentDrillTiming.interRepDelay}
                                    onChange={(e) => updateCurrentDrill({ interRepDelay: parseFloat(e.target.value) })}
                                    className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoundEffectsManager;

import React, { useRef } from 'react';
import { SoundEffects, SoundEffectName } from '../types';
import { View } from '../services/storageService';
import { Upload, Play, RefreshCcw, Volume2, Music, Activity } from 'lucide-react';

interface SoundEffectsManagerProps {
    soundEffects: SoundEffects;
    onUpdateSoundEffect: (name: SoundEffectName, data: string | undefined) => void;
    onUpdateDrillTiming: (timing: SoundEffects['drillTiming']) => void;
    onReturnToDashboard: (view: View) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const playBase64Audio = (base64Audio: string) => {
    if (!base64Audio) return;
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const base64Data = base64Audio.split(',')[1];
        if (!base64Data) {
            throw new Error("Invalid Base64 audio format.");
        }
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        audioContext.decodeAudioData(bytes.buffer)
            .then(buffer => {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
            })
            .catch(e => {
                console.error("Error with decoding audio data", e)
                alert("Problem: Failed to decode audio file.");
            });
    } catch (e) {
        console.error("Error playing audio", e);
        alert("Problem: Failed to play audio.");
    }
};


const SoundEffectRow: React.FC<{
    name: SoundEffectName;
    label: string;
    soundData: string | undefined;
    onUpdate: (name: SoundEffectName, data: string | undefined) => void;
}> = ({ name, label, soundData, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                onUpdate(name, base64);
            } catch (error) {
                console.error("Error converting file to Base64:", error);
                alert("Problem: Failed to read file.");
            }
        }
    };

    return (
        <div className="bg-surface-card border border-surface-border p-4 hover:border-brand/40 transition-colors group">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full sm:w-48">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center border border-brand/20 group-hover:border-brand/50 transition-colors">
                        <Volume2 className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="font-display font-black text-white italic uppercase tracking-tighter text-xl">{label}</h3>
                </div>

                <div className="flex-grow text-center sm:text-left">
                    {soundData ? (
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Custom sound loaded</p>
                        </div>
                    ) : (
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest italic">Using default sound</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        accept="audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="cyber-button-outline py-2 px-4 group/btn"
                        title="Upload sound"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => playBase64Audio(soundData!)}
                        disabled={!soundData}
                        className="cyber-button py-2 px-4 disabled:opacity-20 flex items-center gap-2 text-xs"
                    >
                        <Play className="w-3 h-3" /> TEST
                    </button>
                    <button
                        onClick={() => onUpdate(name, undefined)}
                        disabled={!soundData}
                        className="p-2 text-gray-700 hover:text-red-500 transition-colors disabled:opacity-0"
                        title="Reset to default"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const SoundEffectsManager: React.FC<SoundEffectsManagerProps> = ({ soundEffects, onUpdateSoundEffect, onUpdateDrillTiming, onReturnToDashboard }) => {
    const [activeDrillTab, setActiveDrillTab] = React.useState<'faceOff' | 'shooting'>('faceOff');

    const defaultTiming = {
        faceOff: { preStartDelay: 1, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 },
        shooting: { preStartDelay: 1, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 }
    };

    const timing = soundEffects.drillTiming || defaultTiming;
    const currentDrillTiming = timing[activeDrillTab] || defaultTiming[activeDrillTab];

    const updateCurrentDrill = (updates: Partial<typeof currentDrillTiming>) => {
        onUpdateDrillTiming({
            ...timing,
            [activeDrillTab]: { ...currentDrillTiming, ...updates }
        });
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Audio Settings</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        SOUND <span className="text-brand">EFFECTS</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Audio Upload Card */}
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <Music className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">UPLOAD <span className="text-brand">SOUNDS</span></h2>
                        </div>

                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-10 leading-relaxed">
                            Upload custom sounds for training drills. Supported formats: MP3, WAV, OGG.
                            If no custom sounds are uploaded, the system will use defaults.
                        </p>

                        <div className="grid gap-4">
                            <SoundEffectRow
                                name="down"
                                label="Down"
                                soundData={soundEffects.down}
                                onUpdate={onUpdateSoundEffect}
                            />
                            <SoundEffectRow
                                name="set"
                                label="Set"
                                soundData={soundEffects.set}
                                onUpdate={onUpdateSoundEffect}
                            />
                            <SoundEffectRow
                                name="whistle"
                                label="Whistle"
                                soundData={soundEffects.whistle}
                                onUpdate={onUpdateSoundEffect}
                            />
                        </div>
                    </div>
                </div>

                {/* Granular Timing Settings Card */}
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <Activity className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">DRILL <span className="text-brand">TIMING</span></h2>
                        </div>

                        {/* Drill Selector Tabs */}
                        <div className="flex gap-2 mb-8 p-1 bg-surface-card border border-surface-border">
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

                        <div className="space-y-8 flex-grow">
                            {/* 1. Pre-Start Delay */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">1. Pre-Sequence Delay (Post-Start)</p>
                                    <p className="text-2xl font-display font-black text-white italic">{currentDrillTiming.preStartDelay}s</p>
                                </div>
                                <input
                                    type="range" min="0" max="10" step="0.5"
                                    value={currentDrillTiming.preStartDelay}
                                    onChange={(e) => updateCurrentDrill({ preStartDelay: parseFloat(e.target.value) })}
                                    className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[8px] font-mono text-gray-600 uppercase">Wait time after pressing START before first audio signal.</p>
                            </div>

                            {/* 2. Whistle Timing */}
                            <div className="space-y-4 pt-4 border-t border-surface-border/30">
                                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">2. Whistle / Trigger Interval (Post-"Set")</p>
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

                            {/* 3. Inter-Rep Delay */}
                            <div className="space-y-3 pt-4 border-t border-surface-border/30">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em]">3. Inter-Rep Recovery (Multi-Reps)</p>
                                    <p className="text-2xl font-display font-black text-white italic">{currentDrillTiming.interRepDelay}s</p>
                                </div>
                                <input
                                    type="range" min="1" max="15" step="1"
                                    value={currentDrillTiming.interRepDelay}
                                    onChange={(e) => updateCurrentDrill({ interRepDelay: parseFloat(e.target.value) })}
                                    className="w-full accent-brand h-1 bg-surface-border rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[8px] font-mono text-gray-600 uppercase">Buffer time between consecutive reps for set-up.</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-surface-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Live Sync Active</span>
                            </div>
                            <span className="text-[8px] font-mono text-gray-700 uppercase italic">Applied to: {activeDrillTab.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-surface-border/30 flex items-center justify-center gap-8 opacity-20 group hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand animate-pulse" />
                    <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Proprietary Training Logic // v2.0</span>
                </div>
            </div>
        </div>
    );
};


export default SoundEffectsManager;

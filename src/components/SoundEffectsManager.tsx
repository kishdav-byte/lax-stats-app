import React, { useRef } from 'react';
import { SoundEffects, SoundEffectName } from '../types';
import { View } from '../services/storageService';
import { Upload, Play, RefreshCcw, Volume2, Music, Activity } from 'lucide-react';

interface SoundEffectsManagerProps {
    soundEffects: SoundEffects;
    onUpdateSoundEffect: (name: SoundEffectName, data: string | undefined) => void;
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
                alert("PROTOCOL ERROR: AUDIO DECODE FAILURE. VERIFY DATA INTEGRITY.");
            });
    } catch (e) {
        console.error("Error playing audio", e);
        alert("PROTOCOL ERROR: PLAYBACK FAILURE.");
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
                alert("PROTOCOL ERROR: FILE CONVERSION FAILURE.");
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
                            <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Custom signature loaded</p>
                        </div>
                    ) : (
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest italic">Using synthesized default tone</p>
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
                        title="Upload New Signature"
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
                        title="Purge Custom Data"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const SoundEffectsManager: React.FC<SoundEffectsManagerProps> = ({ soundEffects, onUpdateSoundEffect, onReturnToDashboard }) => {
    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Acoustic Signal Array</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        SOUND <span className="text-brand">EFFECTS</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    RETURN TO COMMAND
                </button>
            </div>

            <div className="cyber-card p-1">
                <div className="bg-black p-8 border border-surface-border">
                    <div className="flex items-center gap-4 mb-8">
                        <Music className="w-5 h-5 text-brand" />
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">DATA // <span className="text-brand">UPLOAD_PORT</span></h2>
                    </div>

                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-10 leading-relaxed max-w-3xl">
                        Inject custom acoustic signatures for operative training modules. Supported data formats: MP3, WAV, OGG.
                        In the absence of custom signatures, the system reverts to algorithmic default tones.
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

                    <div className="mt-12 pt-8 border-t border-surface-border/30 flex items-center justify-center gap-8 opacity-20 group hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand animate-pulse" />
                            <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Signal_Monitoring_Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoundEffectsManager;


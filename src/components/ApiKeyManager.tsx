import React, { useState } from 'react';
import { setApiKey } from '../services/apiKeyService';
import { Shield, Key, ExternalLink, Activity, Info } from 'lucide-react';

interface ApiKeyManagerProps {
    onApiKeySet: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeySet }) => {
    const [apiKey, setApiKeyInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setError('Problem: API Key is required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await setApiKey(apiKey);
            onApiKeySet();
        } catch (e: any) {
            console.error("Failed to save API key:", e);
            setError(e.message || 'A problem occurred.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 font-inter">
            <div className="max-w-2xl w-full cyber-card p-1 animate-in zoom-in duration-700">
                <div className="bg-black p-10 border border-surface-border relative overflow-hidden">
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rotate-45 translate-x-32 -translate-y-32 pointer-events-none"></div>

                    <div className="relative z-10 text-center mb-12">
                        <div className="inline-flex items-center gap-4 mb-4">
                            <div className="h-px bg-brand w-8"></div>
                            <p className="text-[10px] font-mono tracking-[0.4em] text-brand uppercase">AI Setup</p>
                            <div className="h-px bg-brand w-8"></div>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            AI <span className="text-brand">SETUP</span>
                        </h1>
                        <p className="mt-6 text-[11px] font-mono text-gray-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                            Welcome! To get your AI features working, please provide your Google Gemini API Key.
                        </p>
                    </div>

                    <div className="bg-surface-card border border-surface-border p-8 mb-10 relative group">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-4 h-4 text-brand" />
                            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em]">HOW TO GET A KEY:</h2>
                        </div>
                        <ol className="list-none text-[10px] font-mono text-gray-400 space-y-4 uppercase tracking-widest">
                            <li className="flex gap-4">
                                <span className="text-brand font-black">01 //</span> Visit Google AI Studio.
                            </li>
                            <li className="flex gap-4">
                                <span className="text-brand font-black">02 //</span> Click on "Get API key".
                            </li>
                            <li className="flex gap-4">
                                <span className="text-brand font-black">03 //</span> Create a new API key.
                            </li>
                            <li className="flex gap-4">
                                <span className="text-brand font-black">04 //</span> Copy the key and paste it below.
                            </li>
                        </ol>
                        <a
                            href="https://aistudio.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 cyber-button-outline w-full sm:w-auto py-3 px-8 flex items-center justify-center gap-3 group/link"
                        >
                            ACCESS STUDIO <ExternalLink className="w-4 h-4 group-hover/link:text-brand transition-colors" />
                        </a>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label htmlFor="api-key" className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">
                                <Key className="w-3 h-3" /> GEMINI API KEY
                            </label>
                            <input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="PASTE API KEY HERE..."
                                className="w-full cyber-input text-lg tracking-widest"
                            />
                        </div>

                        {error && (
                            <div className="p-4 border border-red-500/30 bg-red-500/5 flex items-center gap-4">
                                <Shield className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest leading-relaxed">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSaveKey}
                            disabled={isLoading}
                            className="cyber-button w-full py-5 text-xl flex items-center justify-center gap-4 group"
                        >
                            {isLoading ? (
                                <>SAVING... <Activity className="w-6 h-6 animate-spin" /></>
                            ) : (
                                <>SAVE & CONTINUE <Activity className="w-6 h-6 group-hover:scale-110 transition-transform" /></>
                            )}
                        </button>
                    </div>

                    <p className="text-[8px] font-mono text-gray-700 mt-10 text-center uppercase tracking-[0.5em] opacity-50">
                        Secure Connection // Saved Locally Only
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyManager;


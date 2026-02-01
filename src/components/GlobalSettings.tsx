import React, { useState, useEffect } from 'react';
import { setGlobalApiKey, getApiKey, initializeApiKey } from '../services/apiKeyService';
import { Key, ShieldCheck, AlertTriangle, Sparkles, Server, Save } from 'lucide-react';

interface GlobalSettingsProps {
    onReturnToDashboard: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ onReturnToDashboard }) => {
    const [apiKey, setApiKeyInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Load the currently active key (from local cache/memory)
        setApiKeyInput(getApiKey());
    }, []);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: 'error', text: 'Problem: API Key cannot be empty.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await setGlobalApiKey(apiKey);
            // Re-sync local state
            await initializeApiKey();
            setMessage({ type: 'success', text: 'Global AI Configuration updated and synchronized successfully.' });
        } catch (e: any) {
            console.error("Failed to save global API key:", e);
            setMessage({ type: 'error', text: e.message || 'A problem occurred while updating the global config.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase font-bold">System Architecture</p>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-white uppercase italic">
                        GLOBAL <span className="text-brand">CONFIG</span>
                    </h1>
                </div>
                <button
                    onClick={onReturnToDashboard}
                    className="cyber-button-outline py-2 px-8 font-display font-black italic text-xs tracking-widest uppercase"
                >
                    RETURN TO COMMAND
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="cyber-card p-1">
                        <div className="bg-black p-10 border border-surface-border relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Server className="w-32 h-32" />
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <Key className="w-5 h-5 text-brand" />
                                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">AI ENGINE <span className="text-brand">AUTHORIZATION</span></h2>
                            </div>

                            <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-10 leading-relaxed max-w-2xl">
                                Configure the primary AI gateway for the entire LaxKeeper ecosystem. This key will be used by all Coaches and Admins for schedule extraction, roster syncing, and analytics. Supports both <span className="text-white">OpenAI (sk-...)</span> and <span className="text-brand">Google Gemini (AIza...)</span>.
                            </p>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label htmlFor="global-api-key" className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">
                                        <ShieldCheck className="w-3 h-3 text-brand" /> MASTER API KEY
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="global-api-key"
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            placeholder="PASTE MASTER KEY HERE..."
                                            className="w-full cyber-input text-lg tracking-[0.2em] pr-12"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/20 group-focus-within:text-brand transition-colors">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-2 ml-1">
                                        Note: Key is encrypted and synced across all specialized nodes.
                                    </p>
                                </div>

                                {message && (
                                    <div className={`p-5 border flex items-center gap-4 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                                        }`}>
                                        <AlertTriangle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                                        <p className={`text-[10px] font-mono uppercase tracking-widest leading-relaxed ${message.type === 'success' ? 'text-green-500' : 'text-red-500'
                                            }`}>{message.text}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSaveKey}
                                    disabled={isLoading}
                                    className="cyber-button w-full py-5 text-xl flex items-center justify-center gap-4 group"
                                >
                                    {isLoading ? (
                                        <>DEPLOING CONFIG... <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></>
                                    ) : (
                                        <>UPDATE MASTER CONFIG <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="cyber-card p-1">
                        <div className="bg-surface-card p-8 border border-surface-border">
                            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <div className="w-2 h-2 bg-brand animate-pulse"></div>
                                System Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] font-mono text-gray-400 uppercase">AI Protocol</span>
                                    <span className="text-[10px] font-mono text-brand uppercase">{apiKey.startsWith('sk-') ? 'OpenAI GPT-4' : 'Gemini 2.0'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] font-mono text-gray-400 uppercase">Gateway</span>
                                    <span className="text-[10px] font-mono text-green-500 uppercase">Operational</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-mono text-gray-400 uppercase">Encryption</span>
                                    <span className="text-[10px] font-mono text-white/40 uppercase">AES-256-GCM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border border-dashed border-surface-border rounded-sm opacity-40">
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-relaxed">
                            Warning: Changing the Master API Key affects all automated workflows instantly. Ensure the new key has sufficient credits and regional permissions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSettings;

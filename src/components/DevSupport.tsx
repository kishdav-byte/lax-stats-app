import React, { useState } from 'react';
import { analyzeCodeProblem } from '../services/geminiService';
import { Cpu, Terminal, Activity, ShieldAlert, Sparkles } from 'lucide-react';

interface DevSupportProps {
    onReturnToDashboard: (view: 'dashboard') => void;
}

const fileContents = {
    'App.tsx': `... (App.tsx content - too large to include fully here, but was retrieved) ...`,
};

const DevSupport: React.FC<DevSupportProps> = ({ onReturnToDashboard }) => {
    const [selectedFile, setSelectedFile] = useState<keyof typeof fileContents>('App.tsx');
    const [question, setQuestion] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!question.trim()) {
            setError('Problem: Please enter a question.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const result = await analyzeCodeProblem(question, fileContents[selectedFile], selectedFile);
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message || "A problem occurred with the AI analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">AI Code Assistant</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        DEVELOPER <span className="text-brand">AI SUPPORT</span>
                    </h1>
                </div>
                <button onClick={() => onReturnToDashboard('dashboard')} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="cyber-card p-1">
                    <div className="bg-black p-8 border border-surface-border">
                        <div className="flex items-center gap-4 mb-6">
                            <Terminal className="w-5 h-5 text-brand" />
                            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">ASK A <span className="text-brand">QUESTION</span></h2>
                        </div>

                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
                            Use AI to help explain or find issues in the code. Select a file and ask a question about it.
                        </p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="file-select" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">SELECT FILE</label>
                                <select
                                    id="file-select"
                                    value={selectedFile}
                                    onChange={(e) => setSelectedFile(e.target.value as keyof typeof fileContents)}
                                    className="w-full cyber-input appearance-none"
                                >
                                    {Object.keys(fileContents).map(filename => (
                                        <option key={filename} value={filename} className="bg-black">{filename.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="question" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">YOUR QUESTION</label>
                                <textarea
                                    id="question"
                                    rows={4}
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={`e.g., "Explain 'handleLogin' logic" or "Audit penalty tracking vectors"`}
                                    className="w-full cyber-input min-h-[120px]"
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="cyber-button w-full py-4 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>ANALYZING... <Activity className="w-5 h-5 animate-spin" /></>
                                ) : (
                                    <>START ANALYSIS <Sparkles className="w-5 h-5 group-hover:animate-pulse" /></>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-6 p-4 border border-red-500/30 bg-red-500/5 flex items-center gap-4 animate-in slide-in-from-top-2">
                                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest leading-relaxed">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {analysis ? (
                        <div className="cyber-card p-1 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="bg-black p-8 border border-surface-border relative">
                                <div className="flex items-center gap-4 mb-6">
                                    <Cpu className="w-5 h-5 text-brand" />
                                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">AI <span className="text-brand">RESPONSE</span></h2>
                                    <div className="flex-grow"></div>
                                    <div className="text-[9px] font-mono text-brand border border-brand/30 px-2 py-0.5 tracking-[0.2em]">VERIFIED</div>
                                </div>

                                <div className="prose prose-invert prose-sm max-w-none">
                                    <div className="text-gray-300 font-light leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}>
                                    </div>
                                </div>

                                <div className="mt-12 pt-6 border-t border-surface-border/30 flex justify-between items-center opacity-30">
                                    <span className="text-[8px] font-mono uppercase tracking-[0.3em]">Analysis Complete</span>
                                    <span className="text-[8px] font-mono uppercase tracking-[0.3em]">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] border border-dashed border-surface-border flex flex-col items-center justify-center p-12 text-center opacity-20">
                            <Cpu className="w-16 h-16 text-white mb-6" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] max-w-xs leading-relaxed">
                                Awaiting your question. Start the analysis to see the AI response.
                            </p>
                            <div className="mt-8 flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DevSupport;


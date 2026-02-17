import React, { useState, useRef, useEffect } from 'react';
import { queryAIAssistant } from '../services/geminiService';
import { Team, Game } from '../types';
import { Sparkles, Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';

interface AIAssistantProps {
    teams: Team[];
    games: Game[];
    onReturnToDashboard: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ teams, games, onReturnToDashboard }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "LaxKeeper AI online. I have analyzed your system data. How can I assist your mission today, Coach?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await queryAIAssistant(userMessage.content, { teams, games });
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Error: System synchronization failed. Please check your AI API key in Global Settings.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Neural Interface</p>
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                        LAX<span className="text-brand">BOT</span> AI
                    </h1>
                </div>
                <button onClick={onReturnToDashboard} className="cyber-button-outline py-2 px-6">
                    BACK TO DASHBOARD
                </button>
            </div>

            <div className="flex-grow cyber-card flex flex-col overflow-hidden bg-black/40 backdrop-blur-md border-surface-border/50">
                {/* Chat Container */}
                <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${message.role === 'user'
                                    ? 'border-white/20 bg-white/5'
                                    : 'border-brand/40 bg-brand/10'
                                    } shadow-lg`}>
                                    {message.role === 'user' ? <User className="w-5 h-5 text-gray-400" /> : <Bot className="w-5 h-5 text-brand" />}
                                </div>

                                <div className="space-y-2">
                                    <div className={`p-5 text-[11px] font-mono leading-relaxed tracking-wider uppercase ${message.role === 'user'
                                        ? 'bg-white/5 border border-white/10 text-white'
                                        : 'bg-brand/5 border border-brand/20 text-brand'
                                        }`}>
                                        {message.content}
                                    </div>
                                    <div className={`text-[8px] font-mono text-gray-600 uppercase tracking-widest ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-brand/20 bg-brand/5">
                                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                                </div>
                                <div className="p-5 bg-brand/5 border border-brand/20">
                                    <div className="flex gap-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-surface-border/50 bg-black/60 relative">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <div className="flex-grow relative group">
                            <div className="absolute inset-0 bg-brand/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="ASK ABOUT STATS, GAMES, OR ROSTERS..."
                                className="w-full cyber-input py-4 px-6 relative z-10"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="cyber-button px-8 flex items-center gap-3 disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            <span className="hidden md:inline">TRANSMIT</span>
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-4 flex justify-center gap-8 text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-2 select-none"><Sparkles className="w-2 h-2 text-brand" /> DATA-AWARE</span>
                        <span className="flex items-center gap-2 select-none"><MessageSquare className="w-2 h-2 text-brand" /> NEURAL PROCESSING</span>
                        <span className="flex items-center gap-2 select-none"><Bot className="w-2 h-2 text-brand" /> LAX KEEPER v4.0</span>
                    </div>
                </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-3 shrink-0">
                {[
                    "Who are the top scorers?",
                    "Analyze our last game",
                    "List the defensive roster",
                    "Any upcoming home games?"
                ].map((prompt, i) => (
                    <button
                        key={i}
                        onClick={() => setInput(prompt)}
                        className="px-4 py-2 bg-brand/5 border border-brand/20 text-[9px] font-mono text-brand/60 uppercase tracking-widest hover:bg-brand/10 hover:text-brand hover:border-brand/40 transition-all"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AIAssistant;

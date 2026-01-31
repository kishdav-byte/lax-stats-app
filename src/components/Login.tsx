import React, { useState } from 'react';
import { Role } from '../types';
import { Shield, Lock, UserPlus, Fingerprint } from 'lucide-react';

interface LoginProps {
    onLogin: (username: string, password: string) => Promise<void>;
    onRegister: (username: string, email: string, password: string, role: Role) => Promise<{ success: boolean, error?: string }>;
    onPasswordResetRequest: (email: string) => Promise<void>;
    error: string;
    onResetApiKey: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onPasswordResetRequest, error, onResetApiKey }) => {
    const [view, setView] = useState<'login' | 'register' | 'reset'>('login');

    // Login state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regRole, setRegRole] = useState<Role | ''>('');
    const [registerError, setRegisterError] = useState('');

    // Reset state
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onLogin(loginUsername, loginPassword);
        } catch (err: any) {
            console.error("onLogin failed in Login.tsx", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError('');
        if (regPassword !== regConfirmPassword) {
            setRegisterError("Passwords do not match.");
            return;
        }
        if (!regRole) {
            setRegisterError("Please select a role.");
            return;
        }

        try {
            const result = await onRegister(regUsername, regEmail, regPassword, regRole);
            if (!result.success && result.error) {
                setRegisterError(result.error);
            }
        } catch (err: any) {
            setRegisterError(err.message || "Registration failed.");
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onPasswordResetRequest(resetEmail);
        setResetMessage("If an account with that email exists, reset instructions have been sent.");
    };

    const renderLogin = () => (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
                <label htmlFor="login-email" className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand opacity-50" />
                    <input
                        id="login-email"
                        type="email"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                        className="cyber-input w-full pl-10"
                        placeholder="your@email.com"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="password" className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand opacity-50" />
                    <input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="cyber-input w-full pl-10"
                        placeholder="••••••••"
                    />
                </div>
            </div>
            {(error || loginUsername.toLowerCase().includes('undefined')) && (
                <div className="bg-red-900/10 border-l-2 border-red-500 p-2">
                    <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">{error || "SYSTEM ERROR // UNKNOWN REFERENCE"}</p>
                </div>
            )}
            <button
                type="submit"
                disabled={isLoading}
                className="cyber-button w-full flex items-center justify-center gap-2 group"
            >
                {isLoading ? 'SIGNING IN...' : (
                    <>
                        SIGN IN <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </>
                )}
            </button>
            <div className="flex flex-col gap-4 text-center mt-8">
                <button type="button" onClick={() => { setView('register'); setRegisterError(''); }} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
                    Create New Profile
                </button>
                <button type="button" onClick={() => { setView('reset'); setResetMessage(''); }} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
                    Forgot Password?
                </button>
                <div className="h-[1px] bg-surface-border w-1/2 mx-auto mt-4"></div>
                <button type="button" onClick={onResetApiKey} className="text-[10px] font-mono uppercase tracking-[0.2em] text-orange-500/50 hover:text-orange-500 transition-colors">
                    RESET APP SETTINGS
                </button>
            </div>
        </form>
    );

    const renderRegister = () => (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Username</label>
                <input id="reg-username" type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required className="cyber-input w-full" placeholder="LacrossePlayer" />
            </div>
            <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Email Address</label>
                <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="cyber-input w-full" placeholder="your@email.com" />
            </div>
            <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Select Role</label>
                <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    required
                    className="cyber-input w-full appearance-none"
                >
                    <option value="" disabled>SELECT ROLE</option>
                    <option value={Role.PLAYER}>PLAYER</option>
                    <option value={Role.PARENT}>PARENT</option>
                    <option value={Role.COACH}>COACH</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Set Password</label>
                    <input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="cyber-input w-full" placeholder="••••" />
                </div>
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Confirm Password</label>
                    <input id="reg-confirm-password" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className="cyber-input w-full" placeholder="••••" />
                </div>
            </div>
            {registerError && (
                <div className="bg-red-900/10 border-l-2 border-red-500 p-2">
                    <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">{registerError}</p>
                </div>
            )}
            <button type="submit" className="cyber-button w-full flex items-center justify-center gap-2 group">
                CREATE PROFILE <UserPlus className="w-4 h-4" />
            </button>
            <div className="text-center mt-6">
                <button type="button" onClick={() => setView('login')} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white">
                    Back to Login
                </button>
            </div>
        </form>
    );

    const renderReset = () => (
        <form onSubmit={handleResetSubmit} className="space-y-6">
            <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Email Address</label>
                <input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="cyber-input w-full" placeholder="your@email.com" />
            </div>
            {resetMessage && (
                <div className="bg-brand/10 border-l-2 border-brand p-2">
                    <p className="text-brand text-[10px] font-mono uppercase tracking-widest">{resetMessage}</p>
                </div>
            )}
            <button type="submit" className="cyber-button w-full">
                RESET PASSWORD
            </button>
            <div className="text-center mt-6">
                <button type="button" onClick={() => setView('login')} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white">
                    Back to Login
                </button>
            </div>
        </form>
    );

    const renderContent = () => {
        switch (view) {
            case 'register': return { title: 'CREATE PROFILE', subtitle: 'NEW PLAYER ENROLLMENT', content: renderRegister() };
            case 'reset': return { title: 'RESET PASSWORD', subtitle: 'REGAIN ACCOUNT ACCESS', content: renderReset() };
            case 'login':
            default: return { title: 'USER LOGIN', subtitle: 'LOG IN TO YOUR ACCOUNT', content: renderLogin() };
        }
    };

    const { title, subtitle, content } = renderContent();

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full relative">
                {/* Background Glitch Effects */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand/5 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand/5 blur-[100px] rounded-full"></div>

                <div className="cyber-card p-8 md:p-12 font-sans">
                    <div className="mb-12 text-center relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-20">
                            {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-brand rounded-full"></div>)}
                        </div>
                        <h1 className="text-4xl font-display font-black text-white italic tracking-tighter mb-1">
                            LAX<span className="text-brand">KEEPER</span>
                        </h1>
                        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-gray-500">Intelligent // Athletic // Systems</p>
                    </div>

                    <div className="mb-8 overflow-hidden">
                        <h2 className="text-lg font-display font-bold text-white mb-0">{title}</h2>
                        <div className="flex items-center gap-2">
                            <div className="h-[1px] bg-brand w-4"></div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand">{subtitle}</p>
                        </div>
                    </div>

                    {content}
                </div>

                {/* Footer Deco */}
                <div className="mt-8 flex justify-between items-center px-4 opacity-20 pointer-events-none">
                    <div className="flex flex-col">
                        <p className="text-[8px] font-mono uppercase tracking-[0.2em]">System // v2.0.4</p>
                        <p className="text-[8px] font-mono uppercase tracking-[0.2em]">Node // US-EAST-1</p>
                    </div>
                    <Shield className="w-6 h-6 text-brand" />
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrillAssignment, DrillStatus, SoundEffects, SoundEffectName } from '../types';
import { Timer, Binary, ShieldAlert, RefreshCcw, Home } from 'lucide-react';

// A constant to tune motion sensitivity. Higher means less sensitive.
const SENSITIVITY_THRESHOLD = 4;
const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

interface FaceOffTrainerProps {
    onReturnToDashboard: () => void;
    activeAssignment: DrillAssignment | null;
    onCompleteAssignment: (assignmentId: string, status: DrillStatus, results: any) => void;
    onSaveSession: (results: any) => void;
    soundEffects: SoundEffects;
}

const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const FaceOffTrainer: React.FC<FaceOffTrainerProps> = ({ onReturnToDashboard, activeAssignment, onCompleteAssignment, onSaveSession, soundEffects }) => {
    type DrillState = 'idle' | 'starting' | 'countdown' | 'set' | 'measuring' | 'result' | 'error';
    type SessionState = 'setup' | 'running' | 'finished';

    const [sessionState, setSessionState] = useState<SessionState>(activeAssignment ? 'running' : 'setup');
    const [sessionConfig, setSessionConfig] = useState<{ type: 'count' | 'timed'; value: number } | null>(null);
    const sessionConfigRef = useRef<{ type: 'count' | 'timed', value: number } | null>(null);

    useEffect(() => {
        sessionConfigRef.current = sessionConfig;
    }, [sessionConfig]);

    const [timedDuration, setTimedDuration] = useState(5); // Default 5 minutes

    const [drillState, setDrillState] = useState<DrillState>('idle');
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [completedDrills, setCompletedDrills] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const timeRemainingRef = useRef(timeRemaining);
    timeRemainingRef.current = timeRemaining;

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const sequenceTimeoutRef = useRef<number[]>([]);

    const stopCamera = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const clearTimeouts = () => {
        sequenceTimeoutRef.current.forEach(clearTimeout);
        sequenceTimeoutRef.current = [];
    };

    useEffect(() => {
        return () => {
            stopCamera();
            clearTimeouts();
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [stopCamera]);

    const handleFinishSession = useCallback((finalReactionTimes?: number[]) => {
        stopCamera();
        clearTimeouts();
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        const timesToSave = finalReactionTimes || reactionTimes;

        if (activeAssignment) {
            onCompleteAssignment(activeAssignment.id, DrillStatus.COMPLETED, { reactionTimes: timesToSave });
        } else {
            setDrillState('idle');
            setSessionState('finished');
            const config = sessionConfigRef.current;
            onSaveSession({
                reactionTimes: timesToSave,
                sessionType: config?.type,
                sessionValue: config?.value
            });
        }
    }, [stopCamera, activeAssignment, onCompleteAssignment, reactionTimes, onSaveSession]);

    useEffect(() => {
        if (sessionState === 'running' && sessionConfig?.type === 'timed') {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleFinishSession();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [sessionState, sessionConfig, handleFinishSession]);

    const setupCamera = async () => {
        try {
            if (mediaStreamRef.current) {
                stopCamera();
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("COULD NOT ACCESS CAMERA STREAM. VERIFY PERMISSIONS.");
            setDrillState('error');
        }
    };

    const playSound = useCallback((type: 'countdown' | 'down' | 'set' | 'whistle') => {
        if (!audioCtxRef.current) return;
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const customSoundData = type !== 'countdown' ? soundEffects?.[type as SoundEffectName] : undefined;

        if (customSoundData) {
            try {
                const base64Data = customSoundData.split(',')[1];
                const binaryString = window.atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
                    const source = audioCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioCtx.destination);
                    source.start(0);
                }, (e) => {
                    console.error("Error decoding custom sound data, falling back to tone.", e);
                });
            } catch (e) {
                console.error("Error processing custom sound, falling back to tone.", e);
            }
        } else {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

            if (type === 'countdown') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'down') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'set') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(550, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'whistle') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(3000, audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(1500, audioCtx.currentTime + 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
            }
        }
    }, [soundEffects]);

    const handleDrillComplete = useCallback((time: number) => {
        const newTimes = [...reactionTimes, time];
        setReactionTimes(newTimes);
        setCompletedDrills(prevCount => {
            const newCount = prevCount + 1;
            const config = sessionConfigRef.current;
            if ((config?.type === 'count' || activeAssignment) && newCount >= (config?.value ?? 1)) {
                handleFinishSession(newTimes);
            }
            return newCount;
        });
    }, [reactionTimes, handleFinishSession, activeAssignment]);

    const startMotionDetection = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < video.HAVE_METADATA) {
            setError("VIDEO STREAM FAILURE.");
            setDrillState('error');
            return;
        }
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const referenceFrameData = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const startTime = performance.now();

        const toGrayscale = (data: Uint8ClampedArray) => {
            const gray = new Uint8Array(data.length / 4);
            for (let i = 0; i < data.length; i += 4) {
                gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            }
            return gray;
        };
        const referenceGrayscale = toGrayscale(referenceFrameData);

        const detect = () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const currentGrayscale = toGrayscale(currentFrameData);
            let diff = 0;
            for (let i = 0; i < referenceGrayscale.length; i++) {
                diff += Math.abs(referenceGrayscale[i] - currentGrayscale[i]);
            }
            const averageDiff = diff / referenceGrayscale.length;

            if (averageDiff > SENSITIVITY_THRESHOLD) {
                const endTime = performance.now();
                const finalTime = Math.round(endTime - startTime);
                setReactionTime(finalTime);
                setDrillState('result');
                stopCamera();
                handleDrillComplete(finalTime);
            } else {
                animationFrameIdRef.current = requestAnimationFrame(detect);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(detect);
    }, [stopCamera, handleDrillComplete]);

    const runDrillSequence = useCallback(() => {
        clearTimeouts();
        setDrillState('countdown');
        let delay = 0;
        const timeouts: number[] = [];

        const timing = soundEffects.drillTiming?.faceOff || { preStartDelay: 1, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 };

        // 1. Pre-Sequence Delay (Custom Post-Start)
        delay += (timing.preStartDelay || 0) * 1000;

        // 2. Countdown Sequence (5-4-3-2-1)
        for (let i = 5; i > 0; i--) {
            const count = i;
            timeouts.push(window.setTimeout(() => { setCountdown(count); playSound('countdown'); }, delay));
            delay += 1000;
        }

        // 3. "Down" Command (Transition to Set)
        timeouts.push(window.setTimeout(() => { setCountdown(0); setDrillState('set'); playSound('down'); }, delay));
        delay += 750;

        // 4. "Set" Command
        timeouts.push(window.setTimeout(() => { playSound('set'); }, delay));

        // 5. Whistle Trigger Interval (Post-"Set")
        let whistleDelayMs = 2000;
        if (timing.whistleDelayType === 'random') {
            const randomOptions = [1000, 1500, 2000, 3000, 3500];
            whistleDelayMs = randomOptions[Math.floor(Math.random() * randomOptions.length)];
        } else {
            whistleDelayMs = (timing.whistleFixedDelay || 2) * 1000;
        }

        delay += whistleDelayMs;

        // 6. Whistle (Trigger Measurement)
        timeouts.push(window.setTimeout(() => {
            setDrillState('measuring');
            playSound('whistle');
            startMotionDetection();
        }, delay));

        sequenceTimeoutRef.current = timeouts;
    }, [playSound, startMotionDetection, soundEffects.drillTiming]);

    const handleStartDrill = useCallback(async () => {
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                setError("AUDIO ARCHITECTURE FAILURE.");
                setDrillState('error');
                return;
            }
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        setDrillState('starting');
        setReactionTime(null);
        setError(null);
        await setupCamera();
        runDrillSequence();
    }, [runDrillSequence]);

    useEffect(() => {
        if (sessionState !== 'running' || drillState !== 'result') {
            return;
        }

        const isLastDrillInCountSession = sessionConfig?.type === 'count' && completedDrills >= sessionConfig.value;
        if (isLastDrillInCountSession) return;

        const isTimeUpInTimedSession = sessionConfig?.type === 'timed' && timeRemainingRef.current <= 5;
        if (isTimeUpInTimedSession) {
            handleFinishSession();
            return;
        }

        const timeoutId = setTimeout(() => {
            handleStartDrill();
        }, (soundEffects.drillTiming?.faceOff.interRepDelay || 5) * 1000);

        return () => clearTimeout(timeoutId);

    }, [drillState, sessionState, sessionConfig, completedDrills, handleStartDrill, handleFinishSession]);


    const handleSelectSession = (type: 'count' | 'timed', value: number) => {
        setSessionConfig({ type, value });
        setSessionState('running');
        setReactionTimes([]);
        setCompletedDrills(0);
        if (type === 'timed') {
            setTimeRemaining(value * 60);
        }
        handleStartDrill();
    };

    useEffect(() => {
        if (activeAssignment) {
            handleStartDrill();
        }
    }, [activeAssignment, handleStartDrill]);

    const handleStartNewSession = () => {
        setSessionState('setup');
        setSessionConfig(null);
        setReactionTimes([]);
        setCompletedDrills(0);
    };

    const getSessionStats = () => {
        if (reactionTimes.length === 0) return { average: 0, best: 0, worst: 0 };
        const sum = reactionTimes.reduce((a, b) => a + b, 0);
        const average = Math.round(sum / reactionTimes.length);
        const best = Math.min(...reactionTimes);
        const worst = Math.max(...reactionTimes);
        return { average, best, worst };
    };

    const getStatusMessage = () => {
        switch (drillState) {
            case 'idle': return 'DRILL_ENDED';
            case 'starting': return 'STARTING_CAMERA...';
            case 'countdown': return `T-MINUS ${countdown}`;
            case 'set': return 'AWAIT WHISTLE TRIGGER';
            case 'measuring': return 'REACT!';
            case 'result': {
                const baseMessage = `${reactionTime}ms`;
                if (activeAssignment) return baseMessage;
                const isCountSessionOver = sessionConfig?.type === 'count' && completedDrills >= sessionConfig.value;
                const isTimedSessionOver = sessionConfig?.type === 'timed' && timeRemainingRef.current <= 5;
                if (!isCountSessionOver && !isTimedSessionOver) {
                    return `LATENCY: ${baseMessage}`;
                }
                return baseMessage;
            }
            case 'error': return error;
            default: return '';
        }
    };

    if (sessionState === 'setup') {
        return (
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-brand w-12"></div>
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Face-Off Training</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            FACE-OFF <span className="text-brand">TRAINER</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="cyber-button-outline py-2 px-6">
                        BACK TO DASHBOARD
                    </button>
                </div>

                <div className="cyber-card p-1">
                    <div className="bg-black p-12 text-center border border-surface-border">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-12">Select Trainer Mode</h2>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Training Reps</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 3, 5, 20].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => handleSelectSession('count', count)}
                                            className="cyber-button py-4 font-display italic font-black text-xl"
                                        >
                                            {count} REPS
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6 flex flex-col justify-end">
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Timed Mode</p>
                                <div className="bg-surface-card p-8 border border-surface-border flex flex-col items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={timedDuration}
                                            onChange={(e) => setTimedDuration(parseInt(e.target.value, 10))}
                                            className="cyber-input w-24 text-center text-xl font-display italic font-black"
                                        />
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">MINS</span>
                                    </div>
                                    <button
                                        onClick={() => handleSelectSession('timed', timedDuration)}
                                        className="cyber-button w-full flex items-center justify-center gap-3"
                                    >
                                        START DRILL <Timer className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (sessionState === 'finished') {
        const stats = getSessionStats();
        return (
            <div className="space-y-12 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-green-500 uppercase">Drill Complete</p>
                    </div>
                    <h1 className="text-6xl font-display font-black text-white italic uppercase tracking-tighter">DRILL <span className="text-brand">SUMMARY</span></h1>
                </div>

                <div className="cyber-card p-1 max-w-4xl mx-auto">
                    <div className="bg-black p-12 border border-surface-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">BEST TIME</p>
                                <p className="text-6xl font-display font-black text-green-500 italic uppercase tracking-tighter">{stats.best}<span className="text-xl ml-1">MS</span></p>
                                <div className="h-px bg-green-500/20 w-12 mx-auto"></div>
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">AVERAGE TIME</p>
                                <p className="text-6xl font-display font-black text-brand italic uppercase tracking-tighter">{stats.average}<span className="text-xl ml-1">MS</span></p>
                                <div className="h-px bg-brand/20 w-12 mx-auto"></div>
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">SLOWEST TIME</p>
                                <p className="text-6xl font-display font-black text-red-500 italic uppercase tracking-tighter">{stats.worst}<span className="text-xl ml-1">MS</span></p>
                                <div className="h-px bg-red-500/20 w-12 mx-auto"></div>
                            </div>
                        </div>

                        <div className="bg-surface-card p-8 border border-surface-border mb-12">
                            <p className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Binary className="w-3 h-3 text-brand" /> Session History ({reactionTimes.length} reps)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {reactionTimes.map((t, i) => (
                                    <span key={i} className="text-[10px] font-mono bg-black border border-surface-border px-3 py-1 text-white">
                                        {t}MS
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button onClick={handleStartNewSession} className="cyber-button-outline px-12 py-4 flex items-center gap-3 justify-center group">
                                <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> RESTART
                            </button>
                            <button onClick={onReturnToDashboard} className="cyber-button px-12 py-4 flex items-center gap-3 justify-center">
                                <Home className="w-4 h-4" /> TERMINATE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 h-full flex flex-col pb-12">
            {activeAssignment && (
                <div className="cyber-card p-6 border-brand border-2 bg-brand/5 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-2">
                        <ShieldAlert className="w-4 h-4 text-brand" />
                        <h2 className="text-xs font-mono font-bold text-brand uppercase tracking-widest">Current Drill Goal</h2>
                    </div>
                    <p className="text-white font-display italic font-bold uppercase tracking-tight">"{activeAssignment.notes}"</p>
                </div>
            )}

            <div className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">FACE-OFF <span className="text-brand">DRILL</span></h1>
                    <div className="h-4 w-px bg-surface-border"></div>
                    {sessionConfig?.type === 'count' && (
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                            REP: <span className="text-white font-bold">{Math.min(completedDrills + 1, sessionConfig.value)}</span> / {sessionConfig.value}
                        </p>
                    )}
                    {sessionConfig?.type === 'timed' && (
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                            TIME REMAINING: <span className="text-brand font-bold">{formatTime(timeRemaining)}</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => {
                        if (window.confirm("End drill? Any data not saved will be lost.")) {
                            onReturnToDashboard();
                        }
                    }}
                    className="text-red-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
                >
                    <Binary className="w-4 h-4" /> EXIT
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center space-y-8">
                <div className="relative group p-1 cyber-card max-w-2xl w-full aspect-video">
                    <div className="absolute -inset-0.5 bg-brand/20 opacity-0 group-hover:opacity-100 transition duration-500 rounded-none pointer-events-none"></div>
                    <div className="relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transform scaleX(-1) grayscale brightness-75 contrast-125 transition-all duration-1000 ${drillState === 'measuring' ? 'grayscale-0 brightness-100 contrast-150' : ''}`}
                        ></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {/* Static Overlay Decoration */}
                        <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none"></div>
                        <div className="absolute top-8 left-8 flex flex-col gap-1 opacity-20">
                            <div className="w-8 h-[1px] bg-brand"></div>
                            <div className="w-4 h-[1px] bg-brand"></div>
                        </div>
                        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1 opacity-20">
                            <div className="w-4 h-[1px] bg-brand"></div>
                            <div className="w-8 h-[1px] bg-brand"></div>
                        </div>

                        {/* Status HUD */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md px-12 py-6 border border-brand/50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <p className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-2 shadow-[0_0_20px_rgba(255,87,34,0.3)]">
                                    {getStatusMessage()}
                                </p>
                                {drillState === 'countdown' && (
                                    <div className="w-32 h-1 bg-surface-border mt-4 overflow-hidden">
                                        <div
                                            className="h-full bg-brand transition-all duration-1000 ease-linear"
                                            style={{ width: `${(countdown / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scanned Metrics */}
                        <div className="absolute bottom-12 left-12 text-left space-y-1 hidden md:block opacity-40">
                            <p className="text-[8px] font-mono text-brand uppercase tracking-widest">SENS_THRESH: {SENSITIVITY_THRESHOLD}</p>
                            <p className="text-[8px] font-mono text-brand uppercase tracking-widest">RES_ID: {VIDEO_WIDTH}x{VIDEO_HEIGHT}</p>
                            <p className="text-[8px] font-mono text-brand uppercase tracking-widest">STREAM: ACTIVE</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-12 w-full max-w-2xl px-6 opacity-30">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-brand to-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default FaceOffTrainer;

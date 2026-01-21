import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrillAssignment, DrillStatus, SoundEffects, SoundEffectName } from '../types';
import { Target, Zap, Activity, Binary, ShieldAlert, RefreshCcw, Home, Move, Maximize2, Cpu, Loader2 } from 'lucide-react';
import { analyzeShotPlacement } from '../services/geminiService';

// --- Constants ---
const SENSITIVITY_THRESHOLD = 10;
const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

// --- Helper Components ---

const DraggableResizableOverlay: React.FC<{
    overlay: { x: number, y: number, width: number, height: number };
    setOverlay: React.Dispatch<React.SetStateAction<{ x: number, y: number, width: number, height: number }>>;
}> = ({ overlay, setOverlay }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, action: 'drag' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'drag') setIsDragging(true);
        if (action === 'resize') setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOverlay(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
        if (isResizing) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOverlay(prev => ({ ...prev, width: Math.max(50, prev.width + dx), height: Math.max(50, prev.height + dy) }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    }, [isDragging, isResizing, dragStart, setOverlay]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={overlayRef}
            className="absolute border-2 border-brand cursor-move grid grid-cols-3 grid-rows-3 bg-brand/5 backdrop-blur-[1px]"
            style={{ left: overlay.x, top: overlay.y, width: overlay.width, height: overlay.height }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
            {/* HUD Corner Decorations */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-brand"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-brand"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand"></div>

            {[...Array(9)].map((_, i) => (
                <div key={i} className="w-full h-full border border-brand/20"></div>
            ))}

            <div
                className="absolute -bottom-2 -right-2 w-5 h-5 bg-brand cursor-se-resize flex items-center justify-center shadow-[0_0_10px_rgba(255,87,34,0.5)]"
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
            >
                <Maximize2 className="w-3 h-3 text-black" />
            </div>

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand text-black px-3 py-1 text-[8px] font-mono font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(255,87,34,0.3)]">
                CALIBRATE_LOCK_TARGET
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                <Move className="w-8 h-8 text-brand" />
            </div>
        </div>
    );
};

const ShotChart: React.FC<{ history: number[] }> = ({ history }) => {
    const counts = history.reduce((acc, zone) => {
        acc[zone] = (acc[zone] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const maxCount = Math.max(0, ...Object.values(counts));

    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-80 h-80 mx-auto bg-black p-4 border border-surface-border relative group">
            <div className="absolute -inset-0.5 bg-brand/10 opacity-20 pointer-events-none"></div>
            {[...Array(9)].map((_, i) => {
                const count = counts[i] || 0;
                const weight = count > 0 ? (count / maxCount) : 0;
                return (
                    <div
                        key={i}
                        className={`relative flex items-center justify-center transition-all duration-700 overflow-hidden border border-surface-border/30`}
                        style={{
                            backgroundColor: weight > 0 ? `rgba(255, 87, 34, ${0.1 + weight * 0.4})` : 'transparent'
                        }}
                    >
                        {weight > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <Activity className="w-full h-full text-brand scale-150" />
                            </div>
                        )}
                        <span className={`font-display font-black italic text-4xl transition-colors ${weight > 0 ? 'text-white' : 'text-gray-900'}`}>
                            {count > 0 ? count : '0'}
                        </span>
                        {/* Zone Marker */}
                        <span className="absolute top-1 left-1 text-[6px] font-mono text-gray-700 tracking-tighter">Z_{i + 1 < 10 ? '0' : ''}{i + 1}</span>
                    </div>
                )
            })}
        </div>
    );
};


interface ShootingDrillProps {
    onReturnToDashboard: () => void;
    activeAssignment: DrillAssignment | null;
    onCompleteAssignment: (assignmentId: string, status: DrillStatus, results: any) => void;
    onSaveSession: (results: any) => void;
    soundEffects: SoundEffects;
}

const ShootingDrill: React.FC<ShootingDrillProps> = ({ onReturnToDashboard, activeAssignment, onCompleteAssignment, onSaveSession, soundEffects }) => {
    type DrillMode = 'release' | 'placement';
    type SessionState = 'setup' | 'calibration' | 'running' | 'finished';
    type DrillState = 'idle' | 'starting' | 'countdown' | 'set' | 'measuring' | 'result' | 'error' | 'log_shot';

    const [sessionState, setSessionState] = useState<SessionState>('setup');
    const [drillMode, setDrillMode] = useState<DrillMode>('release');
    const [totalShots, setTotalShots] = useState(10);

    const [drillState, setDrillState] = useState<DrillState>('idle');
    const [shotTime, setShotTime] = useState<number | null>(null);
    const [shotHistory, setShotHistory] = useState<number[]>([]);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isAiVisionEnabled, setIsAiVisionEnabled] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [overlay, setOverlay] = useState({ x: 50, y: 50, width: 200, height: 150 });
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

    const handleSessionEnd = useCallback(() => {
        stopCamera();
        clearTimeouts();
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (activeAssignment) {
            onCompleteAssignment(activeAssignment.id, DrillStatus.COMPLETED, { shotHistory });
        } else {
            setSessionState('finished');
            onSaveSession({
                shotHistory,
                totalShots,
                drillMode
            });
        }
    }, [stopCamera, activeAssignment, onCompleteAssignment, shotHistory, totalShots, drillMode, onSaveSession]);

    async function handleMotionDetected(time: number) {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        setShotTime(time);

        if (isAiVisionEnabled && canvasRef.current) {
            setIsAnalyzing(true);
            const shotFrame = canvasRef.current.toDataURL('image/jpeg', 0.8);

            // Analyze placement in background if possible, or wait
            const zone = await analyzeShotPlacement(shotFrame);
            setIsAnalyzing(false);

            if (zone !== null && zone !== -1) {
                handleLogShotPlacement(zone);
                return; // Placement logged by AI
            }
        }

        if (drillMode === 'release') {
            const newHistory = [...shotHistory, time];
            setShotHistory(newHistory);
            setDrillState('result');

            if (newHistory.length >= totalShots) {
                handleSessionEnd();
            } else {
                sequenceTimeoutRef.current.push(window.setTimeout(startDrill, 3000));
            }
        } else {
            setDrillState('log_shot');
        }
    }

    function startMotionDetection() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < video.HAVE_METADATA) {
            setError("OPTICAL_FEED_DISCONNECTED");
            setDrillState('error');
            return;
        }
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const scaleX = video.videoWidth / video.clientWidth;
        const scaleY = video.videoHeight / video.clientHeight;

        const roiX = Math.floor(overlay.x * scaleX);
        const roiY = Math.floor(overlay.y * scaleY);
        const roiW = Math.floor(overlay.width * scaleX);
        const roiH = Math.floor(overlay.height * scaleY);

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const referenceFrameData = context.getImageData(roiX, roiY, roiW, roiH).data;
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
            if (!videoRef.current || !context) return;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const currentFrameData = context.getImageData(roiX, roiY, roiW, roiH).data;
            const currentGrayscale = toGrayscale(currentFrameData);
            let diff = 0;
            for (let i = 0; i < referenceGrayscale.length; i++) {
                diff += Math.abs(referenceGrayscale[i] - currentGrayscale[i]);
            }
            const averageDiff = diff / referenceGrayscale.length;

            if (averageDiff > SENSITIVITY_THRESHOLD) {
                const endTime = performance.now();
                handleMotionDetected(Math.round(endTime - startTime));
            } else {
                animationFrameIdRef.current = requestAnimationFrame(detect);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(detect);
    }

    function runDrillSequence() {
        clearTimeouts();
        setDrillState('countdown');
        let delay = 0;
        const timeouts: number[] = [];

        for (let i = 3; i > 0; i--) {
            const count = i;
            timeouts.push(window.setTimeout(() => {
                setCountdown(count);
                playSound('countdown');
            }, delay));
            delay += 1000;
        }

        timeouts.push(window.setTimeout(() => {
            setCountdown(0);
            setDrillState('set');
            playSound('set');
        }, delay));

        const randomDelay = Math.random() * 1500 + 500;
        delay += randomDelay;

        timeouts.push(window.setTimeout(() => {
            setDrillState('measuring');
            playSound('whistle');
            startMotionDetection();
        }, delay));

        sequenceTimeoutRef.current = timeouts;
    }

    async function startDrill() {
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                setError("AUDIO_SUBSYSTEM_FAILURE.");
                setDrillState('error');
                return;
            }
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        setDrillState('starting');
        setShotTime(null);
        setError(null);
        if (!mediaStreamRef.current) {
            await setupCamera();
        }
        runDrillSequence();
    }

    function handleLogShotPlacement(zone: number) {
        const newHistory = [...shotHistory, zone];
        setShotHistory(newHistory);
        setDrillState('result');
        if (newHistory.length >= totalShots) {
            handleSessionEnd();
        } else {
            sequenceTimeoutRef.current.push(window.setTimeout(startDrill, 3000));
        }
    }

    const setupCamera = useCallback(async () => {
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
            setError("OPTICAL_CAPTURE_UNAVAILABLE. CHECK PERMISSIONS.");
            setDrillState('error');
        }
    }, [stopCamera]);

    const playSound = useCallback((type: SoundEffectName | 'countdown') => {
        if (!audioCtxRef.current) return;
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();

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
                });
            } catch (e) {
                console.error("Error playing custom sound", e);
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

    useEffect(() => {
        if (activeAssignment) {
            setDrillMode('placement');
            const match = activeAssignment.notes.match(/(\d+)\s*(shots|reps)/i);
            if (match && match[1]) {
                setTotalShots(parseInt(match[1], 10));
            }
            setSessionState('calibration');
        }
    }, [activeAssignment]);

    useEffect(() => {
        return () => {
            stopCamera();
            clearTimeouts();
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        };
    }, [stopCamera]);

    useEffect(() => {
        if (sessionState === 'calibration') {
            setupCamera();
        }
    }, [sessionState, setupCamera]);

    useEffect(() => {
        if (sessionState === 'running' && videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
        }
    }, [sessionState]);

    const getStatusMessage = () => {
        switch (drillState) {
            case 'idle': return 'SEQUENCE_TERMINATED';
            case 'starting': return 'INITIALIZING_STREAM...';
            case 'countdown': return `T-MINUS ${countdown}`;
            case 'set': return 'AWAIT WHISTLE TRIGGER';
            case 'measuring': return 'REACT!';
            case 'log_shot': return 'MARK SHOT IMPACT ZONE';
            case 'result': {
                if (drillMode === 'release') {
                    return `LATENCY: ${shotTime}ms`;
                }
                return `IMPACT_LOGGED`;
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
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Optical Training Array</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            SHOOTING <span className="text-brand">CENTER</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="cyber-button-outline py-2 px-6">
                        RETURN TO LAB
                    </button>
                </div>

                <div className="cyber-card p-1">
                    <div className="bg-black p-12 text-center border border-surface-border">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-12">Select Ballistics Mode</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div
                                onClick={() => setDrillMode('release')}
                                className={`group p-8 border hover:border-brand/50 transition-all cursor-pointer ${drillMode === 'release' ? 'bg-brand/10 border-brand' : 'bg-surface-card border-surface-border'}`}
                            >
                                <Zap className={`w-8 h-8 mb-4 ${drillMode === 'release' ? 'text-brand' : 'text-gray-600'}`} />
                                <h3 className="text-xl font-display font-black italic uppercase italic mb-2">Quick Release</h3>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 leading-relaxed">
                                    Measure reactive latency from whistle trigger to ballistics deployment.
                                </p>
                            </div>
                            <div
                                onClick={() => setDrillMode('placement')}
                                className={`group p-8 border hover:border-brand/50 transition-all cursor-pointer ${drillMode === 'placement' ? 'bg-brand/10 border-brand' : 'bg-surface-card border-surface-border'}`}
                            >
                                <Target className={`w-8 h-8 mb-4 ${drillMode === 'placement' ? 'text-brand' : 'text-gray-600'}`} />
                                <h3 className="text-xl font-display font-black italic uppercase italic mb-2">Shot Placement</h3>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 leading-relaxed">
                                    Map spatial grouping and accuracy heatmaps across goal quadrants.
                                </p>
                            </div>
                        </div>

                        <div className="bg-surface-card p-6 border border-surface-border mb-8 max-w-2xl mx-auto">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 flex-grow w-full md:w-auto">
                                    <label htmlFor="total-shots" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Sequence Depth (# of shots)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            id="total-shots"
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={totalShots}
                                            onChange={(e) => setTotalShots(parseInt(e.target.value, 10))}
                                            className="cyber-input w-full md:w-24 text-center text-xl font-display font-black italic"
                                        />
                                    </div>
                                </div>

                                <div className="h-px md:h-12 w-full md:w-px bg-surface-border"></div>

                                <button
                                    onClick={() => setIsAiVisionEnabled(!isAiVisionEnabled)}
                                    className={`flex-grow w-full md:w-auto py-4 px-6 border flex items-center justify-between group transition-all duration-300 ${isAiVisionEnabled ? 'border-brand bg-brand/10' : 'border-surface-border bg-black'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Cpu className={`w-5 h-5 ${isAiVisionEnabled ? 'text-brand' : 'text-gray-500'}`} />
                                        <div className="text-left">
                                            <p className={`text-xs font-display font-bold uppercase italic ${isAiVisionEnabled ? 'text-white' : 'text-gray-500'}`}>AI Vision Mode</p>
                                            <p className="text-[8px] font-mono text-gray-600 uppercase">Auto-Identify Placement</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isAiVisionEnabled ? 'bg-brand' : 'bg-gray-800'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAiVisionEnabled ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <button onClick={() => setSessionState('calibration')} className="mt-12 cyber-button w-full md:w-auto px-16 py-4 flex items-center justify-center gap-4 group">
                            INITIALIZE CALIBRATION <Activity className="w-5 h-5 group-hover:animate-pulse" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (sessionState === 'calibration') {
        return (
            <div className="space-y-12 h-screen flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-brand w-12"></div>
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Optical Target Lock</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            CALIBRATE <span className="text-brand">FRAME</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="text-gray-600 hover:text-white text-[10px] font-mono uppercase tracking-widest">Abort_Protocol</button>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center space-y-8 pb-12">
                    <div className="relative group p-1 cyber-card max-w-2xl w-full aspect-video">
                        <div className="relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-50 opacity-100"></video>
                            <DraggableResizableOverlay overlay={overlay} setOverlay={setOverlay} />
                        </div>
                        <div className="absolute -bottom-8 left-0 right-0 text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Awaiting spatial frame alignment with goal perimeter.</p>
                        </div>
                    </div>

                    <button onClick={() => { setSessionState('running'); startDrill(); }} className="cyber-button px-20 py-4 text-xl">
                        START_SEQUENCE
                    </button>
                </div>
            </div>
        );
    }

    if (sessionState === 'finished') {
        const avgReleaseTime = drillMode === 'release' && shotHistory.length > 0
            ? Math.round(shotHistory.reduce((a, b) => a + b, 0) / shotHistory.length)
            : 0;

        return (
            <div className="space-y-12 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-green-500 uppercase">Ballistics Sequence Complete</p>
                    </div>
                    <h1 className="text-6xl font-display font-black text-white italic uppercase tracking-tighter">DATA <span className="text-brand">HARVEST</span></h1>
                </div>

                <div className="cyber-card p-1 max-w-4xl mx-auto">
                    <div className="bg-black p-12 border border-surface-border">
                        <div className="max-w-2xl mx-auto space-y-12">
                            {drillMode === 'placement' ? (
                                <div className="space-y-8">
                                    <h3 className="text-center text-[10px] font-mono tracking-[0.3em] text-gray-500 uppercase">Accuracy Heatmap Clusters</h3>
                                    <ShotChart history={shotHistory} />
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <p className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">MEAN RELEASE LATENCY</p>
                                    <p className="text-7xl font-display font-black text-brand italic uppercase tracking-tighter">{avgReleaseTime}<span className="text-xl ml-1">MS</span></p>
                                    <div className="h-px bg-brand/20 w-12 mx-auto"></div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 border-t border-surface-border/30">
                                <button onClick={() => setSessionState('setup')} className="cyber-button-outline px-12 py-4 flex items-center gap-3 justify-center group">
                                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> RE-INIT_ARRAY
                                </button>
                                <button onClick={onReturnToDashboard} className="cyber-button px-12 py-4 flex items-center gap-3 justify-center">
                                    <Home className="w-4 h-4" /> TERMINATE
                                </button>
                            </div>
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
                        <h2 className="text-xs font-mono font-bold text-brand uppercase tracking-widest">Active Directive Injected</h2>
                    </div>
                    <p className="text-white font-display italic font-bold uppercase tracking-tight">"{activeAssignment.notes}"</p>
                </div>
            )}

            <div className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">BALLISTICS <span className="text-brand">ACTIVE</span></h1>
                    <div className="h-4 w-px bg-surface-border"></div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        SEQ: <span className="text-white font-bold">{shotHistory.length + 1}</span> / {totalShots}
                    </p>
                </div>
                <button
                    onClick={handleSessionEnd}
                    className="text-red-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
                >
                    <Binary className="w-4 h-4" /> TERMINATE
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center space-y-8">
                <div className="relative group p-1 cyber-card max-w-2xl w-full aspect-video">
                    <div className="relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-1000 ${drillState === 'measuring' ? 'brightness-100' : 'brightness-50 grayscale'}`}></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {/* HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none border border-brand/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {isAnalyzing ? (
                                <div className="bg-black/60 backdrop-blur-md px-12 py-8 border border-brand/50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4 shadow-[0_0_15px_rgba(255,87,34,0.5)]" />
                                    <p className="text-xl font-display font-black text-white italic uppercase tracking-tighter shadow-[0_0_20px_rgba(255,87,34,0.3)]">
                                        AI_ANALYZING_FLIGHT...
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-black/60 backdrop-blur-md px-12 py-6 border border-brand/50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <p className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-2 shadow-[0_0_20px_rgba(255,87,34,0.3)]">
                                        {getStatusMessage()}
                                    </p>
                                    {drillState === 'countdown' && (
                                        <div className="w-32 h-1 bg-surface-border mt-4 overflow-hidden">
                                            <div
                                                className="h-full bg-brand transition-all duration-1000 ease-linear"
                                                style={{ width: `${(countdown / 3) * 100}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {drillState === 'log_shot' && (
                            <div
                                className="absolute grid grid-cols-3 grid-rows-3 cursor-crosshair animate-in fade-in duration-500"
                                style={{ left: overlay.x, top: overlay.y, width: overlay.width, height: overlay.height }}
                            >
                                {[...Array(9)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-full h-full border border-brand/10 hover:bg-brand/40 hover:border-brand transition-all flex items-center justify-center group/zone"
                                        onClick={() => handleLogShotPlacement(i)}
                                    >
                                        <div className="opacity-0 group-hover/zone:opacity-100 text-[8px] font-mono text-white font-black bg-brand px-1">Z_{i + 1}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShootingDrill;

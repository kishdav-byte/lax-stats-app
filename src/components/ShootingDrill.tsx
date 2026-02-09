import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrillAssignment, DrillStatus, SoundEffects, SoundEffectName } from '../types';
import { Target, Zap, Activity, Binary, ShieldAlert, RefreshCcw, Home, Cpu, Loader2 } from 'lucide-react';
import { analyzeShotPlacement } from '../services/geminiService';

// --- Constants ---
const SENSITIVITY_THRESHOLD = 10;
const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

// --- Helper Components ---

interface Point { x: number; y: number; }
interface GoalQuad {
    tl: Point; // Top Left
    tr: Point; // Top Right
    bl: Point; // Bottom Left
    br: Point; // Bottom Right
}

const QuadrilateralOverlay: React.FC<{
    quad: GoalQuad;
    setQuad: React.Dispatch<React.SetStateAction<GoalQuad>>;
}> = ({ quad, setQuad }) => {
    const [activeHandle, setActiveHandle] = useState<keyof GoalQuad | 'drag' | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent, handle: keyof GoalQuad | 'drag') => {
        e.preventDefault();
        e.stopPropagation();
        setActiveHandle(handle);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!activeHandle) return;

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        if (activeHandle === 'drag') {
            setQuad(prev => ({
                tl: { x: prev.tl.x + dx, y: prev.tl.y + dy },
                tr: { x: prev.tr.x + dx, y: prev.tr.y + dy },
                bl: { x: prev.bl.x + dx, y: prev.bl.y + dy },
                br: { x: prev.br.x + dx, y: prev.br.y + dy }
            }));
        } else {
            setQuad(prev => ({
                ...prev,
                [activeHandle]: { x: prev[activeHandle].x + dx, y: prev[activeHandle].y + dy }
            }));
        }
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [activeHandle, dragStart, setQuad]);

    const handleMouseUp = useCallback(() => {
        setActiveHandle(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Path for the polygon
    const points = `${quad.tl.x},${quad.tl.y} ${quad.tr.x},${quad.tr.y} ${quad.br.x},${quad.br.y} ${quad.bl.x},${quad.bl.y}`;

    // Midpoints for 2x2 grid lines
    const topMid = { x: (quad.tl.x + quad.tr.x) / 2, y: (quad.tl.y + quad.tr.y) / 2 };
    const bottomMid = { x: (quad.bl.x + quad.br.x) / 2, y: (quad.bl.y + quad.br.y) / 2 };
    const leftMid = { x: (quad.tl.x + quad.bl.x) / 2, y: (quad.tl.y + quad.bl.y) / 2 };
    const rightMid = { x: (quad.tr.x + quad.br.x) / 2, y: (quad.tr.y + quad.br.y) / 2 };

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full overflow-visible pointer-events-auto">
                {/* Main Quadrilateral */}
                <polygon
                    points={points}
                    fill="rgba(255, 87, 34, 0.05)"
                    stroke="rgb(255, 87, 34)"
                    strokeWidth="2"
                    className="cursor-move"
                    onMouseDown={(e) => handleMouseDown(e, 'drag')}
                />

                {/* 2x2 Grid Lines */}
                <line x1={topMid.x} y1={topMid.y} x2={bottomMid.x} y2={bottomMid.y} stroke="rgba(255, 87, 34, 0.3)" strokeWidth="1" strokeDasharray="4" />
                <line x1={leftMid.x} y1={leftMid.y} x2={rightMid.x} y2={rightMid.y} stroke="rgba(255, 87, 34, 0.3)" strokeWidth="1" strokeDasharray="4" />

                {/* Handles */}
                {Object.entries(quad).map(([key, point]) => (
                    <g key={key} transform={`translate(${point.x}, ${point.y})`} onMouseDown={(e) => handleMouseDown(e as any, key as keyof GoalQuad)}>
                        <circle r="8" fill="rgb(255, 87, 34)" className="cursor-pointer shadow-lg" />
                        <circle r="12" fill="transparent" className="cursor-pointer" />
                        <text y="-12" textAnchor="middle" fill="white" fontSize="8" className="uppercase font-mono font-bold select-none">{key}</text>
                    </g>
                ))}
            </svg>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 bg-brand text-black px-3 py-1 text-[8px] font-mono font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(255,87,34,0.3)]">
                STRETCH_GOAL_FRAME (PERSPECTIVE_LOCK)
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
    const labels = ["TOP LEFT", "TOP RIGHT", "BOTTOM LEFT", "BOTTOM RIGHT"];

    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-80 h-80 mx-auto bg-black p-4 border border-surface-border relative group">
            <div className="absolute -inset-0.5 bg-brand/10 opacity-20 pointer-events-none"></div>
            {[...Array(4)].map((_, i) => {
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
                        <span className={`font-display font-black italic text-5xl transition-colors ${weight > 0 ? 'text-white' : 'text-gray-900'}`}>
                            {count > 0 ? count : '0'}
                        </span>
                        {/* Zone Marker */}
                        <span className="absolute top-1 left-1 text-[6px] font-mono text-gray-500 tracking-tighter">{labels[i]}</span>
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
    const [activeTargetZone, setActiveTargetZone] = useState<number | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const [overlay, setOverlay] = useState<GoalQuad>({
        tl: { x: 140, y: 100 },
        tr: { x: 340, y: 100 },
        bl: { x: 140, y: 260 },
        br: { x: 340, y: 260 }
    });
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
            } else {
                console.warn("AI vision failed to detect ball in frame.");
                setError("SHOT_UNDETECTED: PLEASE MARK MANUALLY");
            }
        }

        if (drillMode === 'release') {
            const newHistory = [...shotHistory, time];
            setShotHistory(newHistory);
            setDrillState('result');

            if (newHistory.length >= totalShots) {
                handleSessionEnd();
            } else {
                const interRepDelay = soundEffects.drillTiming?.shooting?.interRepDelay ?? 3;
                sequenceTimeoutRef.current.push(window.setTimeout(() => {
                    setActiveTargetZone(null);
                    startDrill();
                }, interRepDelay * 1000));
            }
        } else {
            setDrillState('log_shot');
        }
    }

    function startMotionDetection() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < video.HAVE_METADATA) {
            setError("CAMERA_FEED_DISCONNECTED");
            setDrillState('error');
            return;
        }
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const scaleX = video.videoWidth / video.clientWidth;
        const scaleY = video.videoHeight / video.clientHeight;

        // Calculate bounding box for motion detection
        const minX = Math.min(overlay.tl.x, overlay.bl.x);
        const minY = Math.min(overlay.tl.y, overlay.tr.y);
        const maxX = Math.max(overlay.tr.x, overlay.br.x);
        const maxY = Math.max(overlay.bl.y, overlay.br.y);

        const roiX = Math.floor(minX * scaleX);
        const roiY = Math.floor(minY * scaleY);
        const roiW = Math.floor((maxX - minX) * scaleX);
        const roiH = Math.floor((maxY - minY) * scaleY);

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

        const defaultTiming = { startDelay: 1, commandDelay: 1, whistleDelayType: 'fixed' as const, whistleFixedDelay: 2, interRepDelay: 5 };
        const timing = soundEffects.drillTiming?.shooting || defaultTiming;

        const startDelay = timing.startDelay ?? defaultTiming.startDelay;
        const commandDelay = timing.commandDelay ?? defaultTiming.commandDelay;
        const whistleDelayType = timing.whistleDelayType ?? defaultTiming.whistleDelayType;
        const whistleFixedDelay = timing.whistleFixedDelay ?? defaultTiming.whistleFixedDelay;

        // 1. Post-Start Delay
        delay += startDelay * 1000;

        // 2. Countdown Sequence (3-2-1)
        for (let i = 3; i > 0; i--) {
            const count = i;
            timeouts.push(window.setTimeout(() => {
                setCountdown(count);
                playSound('countdown');
            }, delay));
            delay += 1000;
        }

        // 3. "Set" Command
        timeouts.push(window.setTimeout(() => {
            setCountdown(0);
            setDrillState('set');
            playSound('set');
        }, delay));

        // 4. Command Transition (Set -> Target)
        delay += commandDelay * 1000;

        // 5. Target Selection & Sound
        const targetZones: SoundEffectName[] = [
            'target_top_left', 'target_top_right',
            'target_bottom_left', 'target_bottom_right'
        ];
        const zoneIndex = Math.floor(Math.random() * 4);
        const randomZoneSound = targetZones[zoneIndex];

        timeouts.push(window.setTimeout(() => {
            setActiveTargetZone(zoneIndex);
            playSound(randomZoneSound);
        }, delay));

        // 6. Whistle Delay (Target -> Whistle)
        let whistleDelayMs = 2000;
        if (whistleDelayType === 'random') {
            const randomOptions = [1000, 1500, 2000, 3000, 3500];
            whistleDelayMs = randomOptions[Math.floor(Math.random() * randomOptions.length)];
        } else {
            whistleDelayMs = (whistleFixedDelay || 2) * 1000;
        }

        delay += whistleDelayMs;

        // 7. Whistle Trigger
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

    const toggleCamera = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        // Re-setup camera with the new mode
        try {
            if (mediaStreamRef.current) {
                stopCamera();
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: VIDEO_WIDTH,
                    height: VIDEO_HEIGHT,
                    facingMode: newMode
                }
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error toggling camera:", err);
            setError("CAMERA_CAPTURE_UNAVAILABLE. CHECK PERMISSIONS.");
        }
    };

    function handleLogShotPlacement(zone: number) {
        const newHistory = [...shotHistory, zone];
        setShotHistory(newHistory);
        setDrillState('result');
        if (newHistory.length >= totalShots) {
            handleSessionEnd();
        } else {
            const interRepDelay = soundEffects.drillTiming?.shooting?.interRepDelay ?? 3;
            sequenceTimeoutRef.current.push(window.setTimeout(() => {
                setActiveTargetZone(null);
                startDrill();
            }, interRepDelay * 1000));
        }
    }

    const setupCamera = useCallback(async () => {
        try {
            if (mediaStreamRef.current) {
                stopCamera();
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: VIDEO_WIDTH,
                    height: VIDEO_HEIGHT,
                    facingMode: facingMode
                }
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("CAMERA_CAPTURE_UNAVAILABLE. CHECK PERMISSIONS.");
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
            case 'starting': return 'STARTING_CAMERA...';
            case 'countdown': return `T-MINUS ${countdown}`;
            case 'set': return isAiVisionEnabled ? 'AWAIT AI_WHISTLE TRIGGER' : 'AWAIT WHISTLE TRIGGER';
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
                            <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase">Shooting Training</p>
                        </div>
                        <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">
                            SHOOTING <span className="text-brand">DRILLS</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="cyber-button-outline py-2 px-6">
                        BACK TO DASHBOARD
                    </button>
                </div>

                <div className="cyber-card p-1">
                    <div className="bg-black p-12 text-center border border-surface-border">
                        <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-12">Select Drill Mode</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div
                                onClick={() => setDrillMode('release')}
                                className={`group p-8 border hover:border-brand/50 transition-all cursor-pointer ${drillMode === 'release' ? 'bg-brand/10 border-brand' : 'bg-surface-card border-surface-border'}`}
                            >
                                <Zap className={`w-8 h-8 mb-4 ${drillMode === 'release' ? 'text-brand' : 'text-gray-600'}`} />
                                <h3 className="text-xl font-display font-black italic uppercase italic mb-2">Quick Release</h3>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 leading-relaxed">
                                    Measure reaction time from whistle to shot.
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
                            START SETUP <Activity className="w-5 h-5 group-hover:animate-pulse" />
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
                            ALIGN <span className="text-brand">CAMERA</span>
                        </h1>
                    </div>
                    <button onClick={onReturnToDashboard} className="text-gray-600 hover:text-white text-[10px] font-mono uppercase tracking-widest">Cancel</button>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center space-y-8 pb-12">
                    <div className="relative group p-1 cyber-card max-w-2xl w-full aspect-video">
                        <div className="relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scaleX(-1)' : ''} grayscale brightness-50 opacity-100`}></video>
                            <QuadrilateralOverlay quad={overlay} setQuad={setOverlay} />

                            {/* Camera Toggle Button during calibration */}
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={toggleCamera}
                                    className="bg-black/40 hover:bg-black/80 backdrop-blur-sm border border-brand/30 p-2 text-brand transition-all flex items-center gap-2"
                                >
                                    <RefreshCcw className="w-3 h-3" />
                                    <span className="text-[8px] font-mono uppercase tracking-widest">{facingMode === 'user' ? 'Front' : 'Rear'} Cam</span>
                                </button>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 left-0 right-0 text-center">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Position the camera and align the grid with the goal.</p>
                        </div>
                    </div>

                    <button onClick={() => { setSessionState('running'); startDrill(); }} className="cyber-button px-20 py-4 text-xl">
                        START DRILL
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
                        <p className="text-[10px] font-mono tracking-[0.3em] text-green-500 uppercase">Drill Complete</p>
                    </div>
                    <h1 className="text-6xl font-display font-black text-white italic uppercase tracking-tighter">SESSION <span className="text-brand">SUMMARY</span></h1>
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
                                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> RESTART DRILL
                                </button>
                                <button onClick={onReturnToDashboard} className="cyber-button px-12 py-4 flex items-center gap-3 justify-center">
                                    <Home className="w-4 h-4" /> EXIT
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
                        <h2 className="text-xs font-mono font-bold text-brand uppercase tracking-widest">Current Drill Goal</h2>
                    </div>
                    <p className="text-white font-display italic font-bold uppercase tracking-tight">"{activeAssignment.notes}"</p>
                </div>
            )}

            <div className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">DRILL <span className="text-brand">ACTIVE</span></h1>
                    <div className="h-4 w-px bg-surface-border"></div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        SHOT: <span className="text-white font-bold">{shotHistory.length + 1}</span> / {totalShots}
                    </p>
                </div>
                <button
                    onClick={handleSessionEnd}
                    className="text-red-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
                >
                    <Binary className="w-4 h-4" /> EXIT
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center space-y-8">
                <div className="relative group p-1 cyber-card max-w-2xl w-full aspect-video">
                    <div className="relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-1000 ${facingMode === 'user' ? 'scaleX(-1)' : ''} ${drillState === 'measuring' ? 'brightness-100' : 'brightness-50 grayscale'}`}></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {/* Camera Toggle Button while active */}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={toggleCamera}
                                className="bg-black/40 hover:bg-black/80 backdrop-blur-sm border border-brand/30 p-2 text-brand transition-all flex items-center gap-2"
                            >
                                <RefreshCcw className="w-3 h-3" />
                                <span className="text-[8px] font-mono uppercase tracking-widest">{facingMode === 'user' ? 'Front' : 'Rear'} Cam</span>
                            </button>
                        </div>

                        {/* HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none border border-brand/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {isAnalyzing ? (
                                <div className="bg-black/60 backdrop-blur-md px-12 py-8 border border-brand/50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4 shadow-[0_0_15px_rgba(255,87,34,0.5)]" />
                                    <p className="text-xl font-display font-black text-white italic uppercase tracking-tighter shadow-[0_0_20px_rgba(255,87,34,0.3)]">
                                        AI ANALYZING SHOT...
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

                        {/* Target HUD Marker */}
                        {activeTargetZone !== null && (
                            <div
                                className="absolute border-4 border-brand/50 bg-brand/10 animate-pulse pointer-events-none"
                                style={{
                                    left: activeTargetZone % 2 === 0 ? overlay.tl.x : (overlay.tl.x + overlay.tr.x) / 2,
                                    top: activeTargetZone < 2 ? overlay.tl.y : (overlay.tl.y + overlay.bl.y) / 2,
                                    width: (overlay.tr.x - overlay.tl.x) / 2,
                                    height: (overlay.bl.y - overlay.tl.y) / 2,
                                    // Note: This HUD marker simple positioning doesn't handle extreme perspective skew visually perfectly, 
                                    // but it indicates the quadrant correctly for the user.
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                    <Target className="w-12 h-12 text-brand" />
                                </div>
                            </div>
                        )}

                        {drillState === 'log_shot' && (
                            <div
                                className="absolute cursor-crosshair animate-in fade-in duration-500 overflow-visible"
                                style={{ top: 0, left: 0, width: '100%', height: '100%' }}
                            >
                                <svg className="w-full h-full overflow-visible">
                                    {[0, 1, 2, 3].map((i) => {
                                        let points = "";
                                        const midT = { x: (overlay.tl.x + overlay.tr.x) / 2, y: (overlay.tl.y + overlay.tr.y) / 2 };
                                        const midB = { x: (overlay.bl.x + overlay.br.x) / 2, y: (overlay.bl.y + overlay.br.y) / 2 };
                                        const midL = { x: (overlay.tl.x + overlay.bl.x) / 2, y: (overlay.tl.y + overlay.bl.y) / 2 };
                                        const midR = { x: (overlay.tr.x + overlay.br.x) / 2, y: (overlay.tr.y + overlay.br.y) / 2 };
                                        const center = { x: (midT.x + midB.x) / 2, y: (midL.y + midR.y) / 2 };

                                        if (i === 0) points = `${overlay.tl.x},${overlay.tl.y} ${midT.x},${midT.y} ${center.x},${center.y} ${midL.x},${midL.y}`;
                                        if (i === 1) points = `${midT.x},${midT.y} ${overlay.tr.x},${overlay.tr.y} ${midR.x},${midR.y} ${center.x},${center.y}`;
                                        if (i === 2) points = `${midL.x},${midL.y} ${center.x},${center.y} ${midB.x},${midB.y} ${overlay.bl.x},${overlay.bl.y}`;
                                        if (i === 3) points = `${center.x},${center.y} ${midR.x},${midR.y} ${overlay.br.x},${overlay.br.y} ${midB.x},${midB.y}`;

                                        return (
                                            <polygon
                                                key={i}
                                                points={points}
                                                className="fill-brand/0 hover:fill-brand/40 stroke-brand/10 hover:stroke-brand transition-all cursor-pointer pointer-events-auto"
                                                onClick={() => handleLogShotPlacement(i)}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShootingDrill;

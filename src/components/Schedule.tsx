import React, { useState } from 'react';
import { Game, Team } from '../types';
import { Calendar, Binary, Trash2, Play, TableProperties, Search, Upload, LayoutList } from 'lucide-react';
import { generateScheduleFromText, ExtractedGame } from '../services/geminiService';
import CalendarView from './CalendarView';

interface ImportScheduleModalProps {
    onClose: () => void;
    onScheduleImport: (extractedGames: ExtractedGame[]) => void;
}

const ImportScheduleModal: React.FC<ImportScheduleModalProps> = ({ onClose, onScheduleImport }) => {
    const [pastedContent, setPastedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedGames, setGeneratedGames] = useState<ExtractedGame[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedGames(null);
        try {
            const result = await generateScheduleFromText(pastedContent);
            setGeneratedGames(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmImport = () => {
        if (generatedGames) {
            onScheduleImport(generatedGames);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="cyber-card w-full max-w-3xl max-h-[90vh] flex flex-col border-brand/50 bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-6 sm:p-8 border-b border-surface-border shrink-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-brand w-8"></div>
                        <p className="text-[10px] font-mono tracking-[0.2em] text-brand uppercase shrink-0">Automated Intake</p>
                        <div className="h-px bg-surface-border flex-grow"></div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-display font-black uppercase italic tracking-tighter text-white">
                        IMPORT SCHEDULE <span className="text-brand">//</span> AI SYNC
                    </h2>
                    <p className="text-gray-500 mt-2 text-[10px] font-mono uppercase tracking-widest">Target schedule website for automated extraction.</p>
                </div>

                <div className="p-6 sm:p-8 flex-grow overflow-y-auto custom-scrollbar space-y-8">
                    <div className="space-y-4">
                        <textarea
                            value={pastedContent}
                            onChange={(e) => setPastedContent(e.target.value)}
                            placeholder="PASTE RAW SCHEDULE TEXT FROM MAXPREPS OR OTHER SITE HERE..."
                            className="w-full h-48 cyber-input font-mono text-xs leading-relaxed resize-none p-4"
                            disabled={isGenerating}
                        />
                        <div className="flex justify-end gap-6 items-center">
                            <button onClick={onClose} disabled={isGenerating} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">Abort</button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !pastedContent.trim()}
                                className="cyber-button py-3 px-10 flex items-center gap-3 font-display font-bold italic"
                            >
                                {isGenerating ? 'DECRYPTING DATA...' : (
                                    <>EXTRACT GAMES <Search className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/10 border-l-2 border-red-500">
                            <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest leading-relaxed">Extraction Error: {error}</p>
                        </div>
                    )}

                    {generatedGames && (
                        <div className="pt-8 border-t border-surface-border">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-display font-black uppercase italic text-white flex items-center gap-3">
                                    <Binary className="w-5 h-5 text-brand" />
                                    {generatedGames.length} Games Found
                                </h3>
                                <div className="h-px bg-surface-border flex-grow mx-8 hidden sm:block"></div>
                            </div>

                            <div className="space-y-2">
                                {generatedGames.map((g: ExtractedGame, i: number) => (
                                    <div key={i} className="grid grid-cols-12 items-center text-[10px] font-mono p-3 bg-white/5 border border-surface-border hover:border-brand/30 transition-colors group">
                                        <div className="col-span-2 sm:col-span-1">
                                            <span className="text-brand font-bold opacity-60 uppercase italic">{g.isHome ? 'VS' : '@'}</span>
                                        </div>
                                        <div className="col-span-10 sm:col-span-7">
                                            <span className="text-white font-bold uppercase tracking-tight">{g.opponentName}</span>
                                        </div>
                                        <div className="col-span-12 sm:col-span-4 text-left sm:text-right mt-1 sm:mt-0">
                                            <span className="text-gray-500 uppercase tracking-widest text-[9px] bg-black px-2 py-0.5 border border-surface-border">{new Date(g.scheduledTime).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {generatedGames && (
                    <div className="p-6 sm:p-8 bg-brand/5 border-t border-brand/20 shrink-0">
                        <button
                            onClick={handleConfirmImport}
                            className="cyber-button w-full py-4 text-sm font-display font-black italic tracking-widest shadow-[0_0_20px_rgba(255,87,34,0.2)]"
                        >
                            SAVE {generatedGames.length} IDENTIFIED GAMES TO TIMELINE
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ScheduleProps {
    teams: Team[];
    games: Game[];
    onAddGame: (homeTeamId: string, awayTeamInfo: { id?: string; name?: string }, scheduledTime: string) => void;
    onStartGame: (gameId: string) => void;
    onDeleteGame: (gameId: string) => void;
    onReturnToDashboard: (view: 'dashboard') => void;
    onViewReport: (game: Game) => void;
    initialViewMode?: 'timeline' | 'calendar';
    managedTeamId: string | null;
}

const Schedule: React.FC<ScheduleProps> = ({ teams, games, onAddGame, onStartGame, onDeleteGame, onReturnToDashboard, onViewReport, initialViewMode, managedTeamId }) => {
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [gameDate, setGameDate] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>(initialViewMode || 'timeline');

    const handleAddGame = () => {
        const trimmedAwayName = awayTeamName.trim();
        const homeTeam = teams.find(t => t.id === homeTeamId);

        if (homeTeam && trimmedAwayName && gameDate) {
            if (homeTeam.name.toLowerCase() === trimmedAwayName.toLowerCase()) {
                alert("Problem: Home and Away teams cannot be the same.");
                return;
            }

            const existingAwayTeam = teams.find(t => t.name.toLowerCase() === trimmedAwayName.toLowerCase());
            const awayTeamInfo = existingAwayTeam ? { id: existingAwayTeam.id } : { name: trimmedAwayName };

            onAddGame(homeTeamId, awayTeamInfo, gameDate);
            setHomeTeamId('');
            setAwayTeamName('');
            setGameDate('');
        } else {
            alert("Problem: All team and time fields must be filled out.");
        }
    };

    const handleScheduleImport = async (extractedGames: ExtractedGame[]) => {
        if (!homeTeamId) {
            alert("Select a Home Team first to associate these games with.");
            setIsImportModalOpen(false);
            return;
        }

        const cleanHomeTeamId = homeTeamId.trim();

        for (const g of extractedGames) {
            const opponentTeam = teams.find(t => t.name.toLowerCase() === g.opponentName.toLowerCase());
            const opponentInfo = opponentTeam ? { id: opponentTeam.id.trim() } : { name: g.opponentName };

            if (g.isHome) {
                // Managed team is Home
                await onAddGame(cleanHomeTeamId, opponentInfo, g.scheduledTime);
            } else {
                // Managed team is Away
                // We need to find the opponent's ID if possible, otherwise it's a string name
                // Note: onAddGame(homeId, awayInfo, time)
                if (opponentTeam) {
                    await onAddGame(opponentTeam.id.trim(), { id: cleanHomeTeamId }, g.scheduledTime);
                } else {
                    // Opponent is just a name, but they are HOME
                    await onAddGame('', { id: cleanHomeTeamId, name: g.opponentName }, g.scheduledTime);
                }
            }
        }

        setIsImportModalOpen(false);
    };

    const now = new Date();
    const cleanManagedTeamId = managedTeamId?.trim();
    const filteredGames = cleanManagedTeamId
        ? games.filter(g => g.homeTeam?.id?.trim() === cleanManagedTeamId || (typeof g.awayTeam !== 'string' && g.awayTeam?.id?.trim() === cleanManagedTeamId))
        : games;

    // Upcoming: All scheduled games that haven't been started yet
    const scheduledGames = filteredGames
        .filter(g => g.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    // Completed: Any finished game, latest first
    const finishedGames = filteredGames
        .filter(g => g.status === 'finished')
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());


    return (
        <div className="space-y-12 pb-12">
            {isImportModalOpen && (
                <ImportScheduleModal
                    onClose={() => setIsImportModalOpen(false)}
                    onScheduleImport={handleScheduleImport}
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-1">
                        <div className="h-px bg-brand w-12"></div>
                        <p className="text-[10px] font-mono tracking-[0.3em] text-brand uppercase font-bold">Timeline Control</p>
                        {managedTeamId && (
                            <>
                                <div className="h-1 w-1 bg-brand rounded-full animate-pulse"></div>
                                <p className="text-[8px] font-mono text-brand uppercase tracking-widest border border-brand/20 px-2 py-0.5 bg-brand/5">
                                    FILTER ACTIVE: {teams.find(t => t.id === managedTeamId)?.name?.toUpperCase() || 'SELECTED TEAM'}
                                </p>
                            </>
                        )}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
                        GAME <span className="text-brand">SCHEDULE</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                    <div className="flex bg-surface-card border border-surface-border p-1 rounded-sm">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-brand text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                        >
                            <LayoutList className="w-3 h-3" /> Timeline
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-brand text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Calendar className="w-3 h-3" /> Calendar
                        </button>
                    </div>
                    <button
                        onClick={() => onReturnToDashboard('dashboard')}
                        className="cyber-button-outline px-10 py-4 font-display font-bold italic tracking-widest text-xs uppercase hover:bg-white/5 transition-all"
                    >
                        RETURN TO COMMAND
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <CalendarView
                    games={filteredGames}
                    onStartGame={onStartGame}
                    onViewReport={onViewReport}
                    managedTeamId={managedTeamId}
                    teams={teams}
                />
            ) : (
                <>
                    {teams.length > 0 ? (
                        <div className="cyber-card p-10 bg-brand/5 border-surface-border/50">
                            <div className="flex items-center gap-6 mb-10">
                                <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">GAME <span className="text-brand">SCHEDULE</span></h2>
                                <div className="h-px bg-surface-border flex-grow"></div>
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="cyber-button-outline py-1 px-4 text-[10px] flex items-center gap-2"
                                >
                                    IMPORT / MERGE <Upload className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                <div className="space-y-3">
                                    <label htmlFor="homeTeam" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1 font-bold">Home Designation</label>
                                    <div className="relative">
                                        <select
                                            id="homeTeam"
                                            value={homeTeamId}
                                            onChange={e => setHomeTeamId(e.target.value)}
                                            className="w-full cyber-input appearance-none py-3 px-4 text-sm"
                                        >
                                            <option value="" className="bg-black">SELECT HOME TEAM</option>
                                            {teams.map(t => <option key={t.id} value={t.id} className="bg-black">{t.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="awayTeam" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1 font-bold">Away Designation</label>
                                    <div className="relative">
                                        <input
                                            id="awayTeam"
                                            type="text"
                                            value={awayTeamName}
                                            onChange={e => setAwayTeamName(e.target.value)}
                                            placeholder="SEARCH OR ENTER NAME..."
                                            className="w-full cyber-input py-3 px-4 text-sm"
                                            list="teams-list"
                                        />
                                        <datalist id="teams-list">
                                            {teams.filter(t => t.id !== homeTeamId).map(t => <option key={t.id} value={t.name} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="gameDate" className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1 font-bold">Sync Timestamp</label>
                                    <input
                                        type="datetime-local"
                                        id="gameDate"
                                        value={gameDate}
                                        onChange={e => setGameDate(e.target.value)}
                                        className="w-full cyber-input py-3 px-4 text-sm"
                                    />
                                </div>
                            </div>
                            <button onClick={handleAddGame} className="mt-10 cyber-button w-full md:w-auto px-16 py-4 flex items-center justify-center gap-4 text-sm font-display font-bold italic tracking-widest shadow-[0_0_20px_rgba(255,87,34,0.15)]">
                                SAVE GAME <Calendar className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="cyber-card p-16 text-center border-dashed border-surface-border grayscale flex flex-col items-center justify-center min-h-[300px]">
                            <TableProperties className="w-12 h-12 mb-6 opacity-20 text-brand" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-gray-500 leading-loose">Insufficient Data // Create tactical units (teams) before scheduling engagements.</p>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-12 pt-8">
                        {/* Upcoming */}
                        <div>
                            <h2 className="text-2xl font-display font-black text-white italic mb-8 flex items-center gap-4">
                                UPCOMING <span className="text-brand">GAMES</span>
                                <div className="h-px bg-surface-border flex-grow"></div>
                            </h2>
                            <div className="space-y-4">
                                {scheduledGames.map(game => {
                                    const isPast = new Date(game.scheduledTime) < now;
                                    return (
                                        <div key={game.id} className={`cyber-card p-6 flex flex-col md:flex-row items-center justify-between group hover:border-brand/40 transition-all gap-4 ${isPast ? 'border-red-500/20' : ''}`}>
                                            <div className="w-full">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-display font-black text-xl text-white group-hover:text-brand transition-colors italic uppercase tracking-tighter">{game.homeTeam.name} <span className="text-brand/50 px-2">//</span> {game.awayTeam.name}</p>
                                                    {isPast && (
                                                        <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest border border-red-500/30 px-2 bg-red-500/5 animate-pulse">Delayed/Past Due</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className={`h-1 w-1 rounded-full animate-pulse ${isPast ? 'bg-red-500' : 'bg-brand'}`}></div>
                                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-bold">Planned Kickoff: {new Date(game.scheduledTime).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 w-full md:w-auto">
                                                <button onClick={() => onStartGame(game.id)} className="cyber-button w-full md:w-auto py-3 px-8 text-[10px] font-display font-bold italic tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(255,87,34,0.15)] flex items-center justify-center gap-2 group/start">
                                                    SET ACTIVE <Play className="w-3 h-3 group-hover/start:fill-black" />
                                                </button>
                                                <button onClick={() => onDeleteGame(game.id)} className="p-3 text-gray-700 hover:text-red-500 transition-colors border border-surface-border hover:border-red-500/30">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {scheduledGames.length === 0 && (
                                    <div className="p-12 text-center border border-dashed border-surface-border opacity-50">
                                        <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">No Pending Games</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Completed */}
                        <div>
                            <h2 className="text-2xl font-display font-black text-white italic mb-8 flex items-center gap-4">
                                COMPLETED <span className="text-brand">GAMES</span>
                                <div className="h-px bg-surface-border flex-grow"></div>
                            </h2>
                            <div className="space-y-4">
                                {finishedGames.map(game => (
                                    <div key={game.id} className="cyber-card p-1 border-brand/20">
                                        <div className="bg-black p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-baseline gap-3 mb-1">
                                                    <p className="font-display font-bold text-lg text-white uppercase italic tracking-tight">{game.homeTeam.name} // {game.awayTeam.name}</p>
                                                    <span className="font-display font-black text-brand italic">{game.score.home} - {game.score.away}</span>
                                                </div>
                                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1 font-bold">
                                                    Session Logged: {new Date(game.scheduledTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onViewReport(game)}
                                                className="cyber-button-outline w-full sm:w-auto py-2 px-6 text-[10px] font-display font-bold italic tracking-widest hover:bg-white/5 transition-all text-center"
                                            >
                                                INTEL BRIEF
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {finishedGames.length === 0 && (
                                    <div className="p-12 text-center border border-dashed border-surface-border opacity-50">
                                        <Binary className="w-12 h-12 mx-auto mb-4 opacity-20 text-brand" />
                                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">History Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Schedule;

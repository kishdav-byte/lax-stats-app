import { GoogleGenerativeAI } from "@google/generative-ai";
import { Game, Player, StatType } from '../types';
import { getApiKey } from './apiKeyService';

export interface PlayerAnalysisData {
    name: string;
    position: string;
    totalGames: number;
    stats: { [key in StatType]?: number };
}

export interface ExtractedGame {
    opponentName: string;
    isHome: boolean;
    scheduledTime: string; // ISO string
}

/**
 * Robust Model Loader
 * Falls back between v1 and v1beta and different model names to ensure availability.
 */
const callGemini = async (prompt: string, isJson: boolean = false, isImage: boolean = false, imageData?: string) => {
    const genAI = new GoogleGenerativeAI(getApiKey());

    // Attempt sequence for maximum compatibility across regions/keys
    // Often 404s happen because of specific API version vs Model Name combinations
    const attempts = [
        { model: "gemini-1.5-flash", version: "v1beta" },
        { model: "gemini-1.5-flash", version: "v1" },
        { model: "gemini-pro", version: "v1" } // absolute fallback
    ];

    let lastError = null;

    for (const attempt of attempts) {
        try {
            const model = genAI.getGenerativeModel(
                {
                    model: attempt.model,
                    ...(isJson ? { generationConfig: { responseMimeType: "application/json" } } : {})
                },
                { apiVersion: attempt.version }
            );

            let result;
            if (isImage && imageData) {
                result = await model.generateContent([
                    prompt,
                    { inlineData: { mimeType: "image/jpeg", data: imageData } }
                ]);
            } else {
                result = await model.generateContent(prompt);
            }

            const response = await result.response;
            return response.text();
        } catch (e: any) {
            console.warn(`Gemini attempt failed (${attempt.model} on ${attempt.version}):`, e.message);
            lastError = e;
            // If it's a 404, we continue to next attempt
            if (e.message?.includes('404') || e.message?.includes('not found')) continue;
            // If it's something else (like 401/429), we might want to stop, but let's try fallbacks anyway
            continue;
        }
    }

    throw lastError || new Error("AI services currently unavailable.");
};

export const generateGameSummary = async (game: Game): Promise<string> => {
    try {
        const prompt = `Analyze this lacrosse game: ${game.homeTeam.name} (${game.score.home}) vs ${game.awayTeam.name} (${game.score.away}). Provide a summary and Player of the Game.`;
        return await callGemini(prompt);
    } catch (error) {
        console.error("Error generating game summary:", error);
        return "AI Summary unavailable.";
    }
};

export const generateScheduleFromText = async (pastedText: string): Promise<ExtractedGame[]> => {
    if (!pastedText.trim()) throw new Error("Text is empty.");

    const prompt = `Extract games from this text as a JSON array.
Properties: opponentName (string), isHome (boolean), scheduledTime (ISO 8601 string).
Current year: ${new Date().getFullYear()}.

Text:
"""
${pastedText}
"""
`;

    try {
        const resultText = await callGemini(prompt, true);
        const match = resultText.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("Invalid format returned by AI.");
        return JSON.parse(match[0]);
    } catch (error: any) {
        console.error("Schedule extraction error:", error);
        throw new Error(error.message || "Failed to parse schedule.");
    }
};

export const generateRosterFromText = async (pastedText: string): Promise<Omit<Player, 'id'>[]> => {
    if (!pastedText.trim()) throw new Error("Text is empty.");

    const prompt = `Extract player roster as a JSON array.
Properties: name, jerseyNumber, position.

Text:
"""
${pastedText}
"""
`;

    try {
        const resultText = await callGemini(prompt, true);
        const match = resultText.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("Invalid format returned by AI.");
        return JSON.parse(match[0]);
    } catch (error: any) {
        console.error("Roster extraction error:", error);
        throw new Error(error.message || "Failed to parse roster.");
    }
};

export const analyzeCodeProblem = async (question: string, code: string, fileName: string): Promise<string> => {
    const prompt = `Analysis for ${fileName}:\nQuestion: ${question}\nCode:\n${code}`;
    return await callGemini(prompt);
};

export const analyzePlayerPerformance = async (playerData: PlayerAnalysisData): Promise<string> => {
    const prompt = `Coach Analysis for ${playerData.name} (${playerData.position}). Stats:\n${JSON.stringify(playerData.stats)}`;
    return await callGemini(prompt);
};

export const analyzeShotPlacement = async (base64Image: string): Promise<number | null> => {
    try {
        const prompt = "Identify impact zone (0-8) in this 3x3 goal grid. Return only the digit.";
        const resultText = await callGemini(prompt, false, true, base64Image.split(',')[1]);
        const zone = parseInt(resultText.trim(), 10);
        return isNaN(zone) ? null : zone;
    } catch (error) {
        return null;
    }
};

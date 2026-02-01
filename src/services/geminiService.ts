import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
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
 * Unified AI Engine
 * Supports both OpenAI (sk-...) and Google Gemini (AIza...) keys.
 */
const callAI = async (prompt: string, isJson: boolean = false, isImage: boolean = false, imageData?: string) => {
    const key = getApiKey();

    // --- OpenAI Path ---
    if (key.startsWith('sk-')) {
        const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });

        const messages: any[] = [{ role: 'user', content: prompt }];

        if (isImage && imageData) {
            messages[0].content = [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
            ];
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            ...(isJson ? { response_format: { type: "json_object" } } : {})
        });

        return response.choices[0].message.content || "";
    }

    // --- Gemini Path ---
    const genAI = new GoogleGenerativeAI(key);
    const modelName = "gemini-2.0-flash"; // Fixed to the one we verified is available

    try {
        // Most recent SDK version (0.24.1) supports passing the config in the second object
        // but let's try a more universal way if that fails.
        const model = genAI.getGenerativeModel({
            model: modelName,
            ...(isJson ? { generationConfig: { responseMimeType: "application/json" } } : {})
        }, { apiVersion: 'v1beta' });

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
        console.warn(`Gemini primary failed, trying fallback...`, e.message);
        // Fallback: No JSON mode, different model
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(prompt + "\n\n(Return ONLY JSON)");
        const response = await result.response;
        return response.text();
    }
};

export const generateGameSummary = async (game: Game): Promise<string> => {
    try {
        const prompt = `Analyze this lacrosse game: ${game.homeTeam.name} (${game.score.home}) vs ${game.awayTeam.name} (${game.score.away}). Provide a summary and Player of the Game.`;
        return await callAI(prompt);
    } catch (error) {
        console.error("Error generating game summary:", error);
        return "AI Summary unavailable.";
    }
};

export const generateScheduleFromText = async (pastedText: string): Promise<ExtractedGame[]> => {
    if (!pastedText.trim()) throw new Error("Text is empty.");

    const prompt = `Extract games from this text as a JSON array. 
Format: [{"opponentName": string, "isHome": boolean, "scheduledTime": "ISO 8601 string"}]

Text:
"""
${pastedText}
"""
`;

    try {
        const resultText = await callAI(prompt, true);
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
Standardize positions (Attack, Midfield, Defense, Goalie, LSM).

Text:
"""
${pastedText}
"""
`;

    try {
        const resultText = await callAI(prompt, true);
        const match = resultText.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("Invalid format returned by AI.");
        return JSON.parse(match[0]);
    } catch (error: any) {
        console.error("Roster extraction error:", error);
        throw new Error(error.message || "Failed to parse roster.");
    }
};

export const analyzeCodeProblem = async (question: string, code: string, fileName: string): Promise<string> => {
    const prompt = `Engineer Analysis for ${fileName}:\nQuestion: ${question}\nCode:\n${code}`;
    return await callAI(prompt);
};

export const analyzePlayerPerformance = async (playerData: PlayerAnalysisData): Promise<string> => {
    const prompt = `Coach Analysis for ${playerData.name} (${playerData.position}). Stats:\n${JSON.stringify(playerData.stats)}`;
    return await callAI(prompt);
};

export const analyzeShotPlacement = async (base64Image: string): Promise<number | null> => {
    try {
        const prompt = "Identify impact zone (0-8) in this 3x3 goal grid. Return only the digit.";
        const resultText = await callAI(prompt, false, true, base64Image.split(',')[1]);
        const zone = parseInt(resultText.trim(), 10);
        return isNaN(zone) ? null : zone;
    } catch (error) {
        return null;
    }
};

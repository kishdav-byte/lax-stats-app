import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Game, Player, StatType, Team } from '../types';
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

    // We use models that we've verified appear in the 'list-models' diagnostic for your key.
    const attempts = [
        { model: "gemini-2.0-flash", version: "v1" },
        { model: "gemini-2.5-flash", version: "v1" },
        { model: "gemini-1.5-flash", version: "v1" },
        { model: "gemini-pro-latest", version: "v1beta" } // Final fallback
    ];

    let lastError: any = null;

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

            // Critical: If the key is leaked, stop and surface this immediately.
            if (e.message?.includes('leaked')) {
                throw new Error("CRITICAL: Your Gemini API Key has been flagged as LEAKED by Google and disabled. You must generate a new API key in Google AI Studio.");
            }

            // If it's a model not found (404), continue to next attempt
            if (e.message?.includes('404')) continue;

            // If it's a version/config error, try again without JSON mode but keep same model
            if (e.message?.includes('RESPONSEMIMETYPE') || e.message?.includes('400')) {
                try {
                    const fallbackModel = genAI.getGenerativeModel({ model: attempt.model }, { apiVersion: attempt.version });
                    const fbResult = await fallbackModel.generateContent(prompt + "\n\n(IMPORTANT: Return ONLY raw JSON array)");
                    return (await fbResult.response).text();
                } catch (innerE) {
                    continue;
                }
            }
            continue;
        }
    }

    throw lastError || new Error("AI services currently unavailable.");
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
        const prompt = "Identify which quadrant the ball hit in this lacrosse goal: 0: Top Left, 1: Top Right, 2: Bottom Left, 3: Bottom Right. Return only the digit.";
        const resultText = await callAI(prompt, false, true, base64Image.split(',')[1]);
        const zone = parseInt(resultText.trim(), 10);
        return isNaN(zone) || zone < 0 || zone > 3 ? null : zone;
    } catch (error) {
        return null;
    }
};

export const queryAIAssistant = async (question: string, context: { teams: Team[], games: Game[] }): Promise<string> => {
    const contextStr = `
Teams Data:
${context.teams.map(t => `- ${t.name} (ID: ${t.id}), Roster: ${t.roster.map(p => `${p.name} (#${p.jerseyNumber}, ${p.position})`).join(', ')}`).join('\n')}

Games Data:
${context.games.map(g => `- ${g.homeTeam.name} vs ${g.awayTeam.name} (Score: ${g.score.home}-${g.score.away}, Status: ${g.status}, Date: ${g.scheduledTime})`).join('\n')}
    `;

    const prompt = `You are a Lacrosse Assistant for the LaxKeeper app. 
You have access to the current team and game data. 
Answer the user's question accurately based on this data. 
Be concise, professional, and helpful. Use a "cyberpunk coach" persona - high-tech but grounded in the sport.

Context:
${contextStr}

User Question: ${question}`;

    return await callAI(prompt);
};

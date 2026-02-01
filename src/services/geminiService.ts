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
 * Forces the use of the 'v1' stable API to avoid 404/400 errors found in v1beta.
 */
const getStableModel = (genAI: GoogleGenerativeAI, modelName: string) => {
    return genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: 'v1' }
    );
};

const formatGameDataForPrompt = (game: Game): string => {
    let prompt = `Analyze the following lacrosse game data and provide a concise, exciting game summary. Also, name a "Player of the Game" with a brief justification.\n\n`;
    prompt += `Final Score: ${game.homeTeam.name} - ${game.score.home}, ${game.awayTeam.name} - ${game.score.away}\n\n`;
    prompt += `Key Events:\n`;
    const allPlayers: Player[] = [...game.homeTeam.roster, ...game.awayTeam.roster];

    game.stats.forEach(stat => {
        const player = allPlayers.find(p => p.id === stat.playerId);
        const team = game.homeTeam.roster.some(p => p.id === stat.playerId) ? game.homeTeam : game.awayTeam;
        if (player) {
            let eventString = `- ${team.name}: #${player.jerseyNumber} ${player.name} (${player.position || 'N/A'}) - ${stat.type}`;
            if (stat.type === 'Goal' && stat.assistingPlayerId) {
                const assistPlayer = allPlayers.find(p => p.id === stat.assistingPlayerId);
                if (assistPlayer) eventString += ` (Assist: #${assistPlayer.jerseyNumber} ${assistPlayer.name})`;
            }
            prompt += `${eventString}\n`;
        }
    });
    return prompt;
};

export const generateGameSummary = async (game: Game): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-flash");
        const prompt = formatGameDataForPrompt(game);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "";
    } catch (error) {
        console.error("Error generating game summary:", error);
        return "Could not generate AI summary. Please check your API key and connection.";
    }
};

export const generateScheduleFromText = async (pastedText: string): Promise<ExtractedGame[]> => {
    if (!pastedText.trim()) throw new Error("Pasted text cannot be empty.");

    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-flash");
        const currentYear = new Date().getFullYear();

        const prompt = `Analyze the following sports schedule text and extract game records.
Identify: Date, Time, Opponent, and Home/Away (vs = home, @ = away).
Convert Date/Time to ISO 8601 string. Use year ${currentYear}.

IMPORTANT: RETURN ONLY A VALID JSON ARRAY. No markdown, no intro.
Format: [{"opponentName": "Name", "isHome": true/false, "scheduledTime": "ISO_STRING"}]

Text:
"""
${pastedText}
"""
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Robust JSON extraction
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("AI failed to format result as a list. Try again.");

        return JSON.parse(match[0]);
    } catch (error: any) {
        console.error("Schedule AI Error:", error);
        throw new Error(error.message || "Extraction failed.");
    }
};

export const generateRosterFromText = async (pastedText: string): Promise<Omit<Player, 'id'>[]> => {
    if (!pastedText.trim()) throw new Error("Pasted text cannot be empty.");

    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-flash");

        const prompt = `Extract player roster data from this text. 
Return ONLY a valid JSON array of objects with: name, jerseyNumber, position.
Standardize positions (Attack, Midfield, Defense, Goalie, LSM).

Text:
"""
${pastedText}
"""
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("AI failed to format roster. Try again.");
        return JSON.parse(match[0]);
    } catch (error: any) {
        console.error("Roster AI Error:", error);
        throw new Error(error.message || "Roster extraction failed.");
    }
};

export const analyzeCodeProblem = async (question: string, code: string, fileName: string): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-pro");
        const prompt = `Engineer Analysis for ${fileName}:\nQuestion: ${question}\nCode:\n${code}`;
        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        return "AI analysis failed.";
    }
};

export const analyzePlayerPerformance = async (playerData: PlayerAnalysisData): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-pro");
        const prompt = `Coach Analysis for ${playerData.name} (${playerData.position}). Stats:\n${JSON.stringify(playerData.stats)}`;
        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        return "Performance analysis failed.";
    }
};

export const analyzeShotPlacement = async (base64Image: string): Promise<number | null> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = getStableModel(genAI, "gemini-1.5-flash");
        const prompt = "Identify the ball impact zone (0-8) in this 3x3 goal grid. Return only the digit.";
        const result = await model.generateContent([prompt, { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }]);
        const zone = parseInt((await result.response).text().trim(), 10);
        return isNaN(zone) ? null : zone;
    } catch (error) {
        return null;
    }
};

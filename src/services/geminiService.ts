import { GoogleGenAI } from "@google/genai";
import { Game, Player, StatType } from '../types';
import { getApiKey } from './apiKeyService';

// FIX: Add PlayerAnalysisData interface to support the analytics feature.
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
                if (assistPlayer) {
                    eventString += ` (Assist: #${assistPlayer.jerseyNumber} ${assistPlayer.name})`;
                }
            }
            prompt += `${eventString}\n`;
        }
    });

    return prompt;
};

export const generateGameSummary = async (game: Game): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = formatGameDataForPrompt(game);

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Error generating game summary:", error);
        return "Could not generate AI summary. Please check your API key and connection.";
    }
};


export const generateScheduleFromText = async (pastedText: string): Promise<ExtractedGame[]> => {
    if (!pastedText.trim()) {
        throw new Error("Pasted text cannot be empty.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const currentYear = new Date().getFullYear();

        const prompt = `Analyze the following text from a sports schedule (e.g., MaxPreps) and extract game information. 
Identify each game's date, time, opponent, and whether it's a home or away game.
Look for "@" indicating away or "vs" indicating home.
For the date and time, convert them into a valid ISO 8601 string. Assume the year is ${currentYear} unless specified otherwise.
If no time is provided, assume 00:00:00.

Pasted Text:
"""
${pastedText}
"""

Extract the schedule and return it as a JSON array of objects with the following properties:
- opponentName: string
- isHome: boolean
- scheduledTime: ISO 8601 string (e.g. "2024-03-15T19:15:00")
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        if (!response || !response.text) {
            throw new Error("The AI returned an empty response. This might be due to safety filters or a connection issue.");
        }

        let jsonText = response.text.trim();

        // Robustness: Strip potential markdown markers if the model ignored responseMimeType
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json\s*|```\s*$/g, '').trim();
        }

        const parsedSchedule: ExtractedGame[] = JSON.parse(jsonText);
        return parsedSchedule;

    } catch (error: any) {
        console.error("Error generating schedule:", error);
        let errorMessage = error.message || "The AI failed to process the request.";

        if (error instanceof SyntaxError) {
            errorMessage = "The AI returned an invalid JSON format. Try adjusting the pasted text.";
        } else if (errorMessage.includes("API_KEY_INVALID")) {
            errorMessage = "The Gemini API Key is invalid. Please check your settings.";
        } else if (errorMessage.includes("quota")) {
            errorMessage = "AI Quota exceeded. Please try again later.";
        }

        throw new Error(errorMessage);
    }
};

export const generateRosterFromText = async (pastedText: string): Promise<Omit<Player, 'id'>[]> => {
    if (!pastedText.trim()) {
        throw new Error("Pasted text cannot be empty.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `Analyze the following text from a lacrosse team's website roster and extract the player information. Identify each player's name, jersey number, and position. The position might be abbreviated (e.g., A, M, D, G, LSM, FOGO). Do your best to standardize the position to: Attack, Midfield, Defense, Goalie, LSM, or Face Off Specialist.

Pasted Text:
"""
${pastedText}
"""

Extract the roster and return it as a JSON array of objects with: name (string), jerseyNumber (string), position (string).
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        if (!response || !response.text) {
            throw new Error("No data returned from AI.");
        }

        let jsonText = response.text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json\s*|```\s*$/g, '').trim();
        }

        const parsedRoster: Omit<Player, 'id'>[] = JSON.parse(jsonText);
        return parsedRoster;

    } catch (error: any) {
        console.error("Error generating roster:", error);
        let errorMessage = error.message || "The AI failed to process the request.";

        if (error instanceof SyntaxError) {
            errorMessage = "Invalid JSON format from AI. Try again.";
        }

        throw new Error(errorMessage);
    }
};

export const analyzeCodeProblem = async (question: string, code: string, fileName: string): Promise<string> => {
    if (!question.trim() || !code.trim()) {
        throw new Error("Question and code content cannot be empty.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `You are a world-class senior frontend engineer with deep expertise in React, TypeScript, and modern UI/UX design. An administrator of this application is asking for help with the codebase.

    The user is asking the following question about the file \`${fileName}\`:
    """
    ${question}
    """

    Here is the full content of the file \`${fileName}\`:
    \`\`\`typescript
    ${code}
    \`\`\`

    Please analyze the user's question and the provided code. Provide a clear, expert-level explanation of the issue or concept. If applicable, suggest specific improvements or bug fixes, including corrected code snippets. Structure your response in well-formatted markdown.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro', // Using a more powerful model for code analysis
            contents: prompt,
        });

        return response.text || "";

    } catch (error) {
        console.error("Error analyzing code:", error);
        return "An error occurred while communicating with the AI. Please check the console for details.";
    }
};

// FIX: Add analyzePlayerPerformance function to support the analytics feature.
export const analyzePlayerPerformance = async (playerData: PlayerAnalysisData): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        let statsString = Object.entries(playerData.stats)
            .map(([stat, value]) => `- ${stat}: ${value}`)
            .join('\n');

        if (!statsString.trim()) {
            statsString = "No stats recorded for this player.";
        }

        const prompt = `
You are an expert lacrosse coach and performance analyst. Analyze the following player's performance based on their aggregated stats from ${playerData.totalGames} games.

Player Name: ${playerData.name}
Position: ${playerData.position}

Stats:
${statsString}

Provide a concise analysis of this player's strengths and weaknesses. Offer 2-3 specific, actionable suggestions for improvement. Structure your response in well-formatted markdown. Be encouraging but realistic in your feedback.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Error analyzing player performance:", error);
        return "An error occurred while communicating with the AI. Please check your API key and connection.";
    }
};
export const analyzeShotPlacement = async (base64Image: string): Promise<number | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `
Analyze this high-speed frame from a lacrosse shooting drill. 
A lacrosse ball has just impacted or is passing through the net.
The net is divided into a 3x3 grid (9 zones total).
Zones are numbered 0 to 8:
0 1 2 (Top Left, Top Center, Top Right)
3 4 5 (Middle Left, Middle Center, Middle Right)
6 7 8 (Bottom Left, Bottom Center, Bottom Right)

Identify the specific quadrant where the ball or the net's displacement is most visible.
Return ONLY the zone number as a single integer (0-8). 
If the ball is not visible, return -1.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image.split(',')[1] // Remove prefix
                            }
                        }
                    ]
                }
            ]
        });

        const zoneText = response.text?.trim() || "";
        console.log("AI_VISION_DEBUG: Zone raw text ->", zoneText);
        const zone = parseInt(zoneText, 10);

        if (isNaN(zone) || zone < 0 || zone > 8) {
            return null;
        }
        return zone;
    } catch (error) {
        console.error("Error analyzing shot placement:", error);
        return null;
    }
};

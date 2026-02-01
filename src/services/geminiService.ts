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
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
    if (!pastedText.trim()) {
        throw new Error("Pasted text cannot be empty.");
    }

    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        // Using default model initialization without restrictive JSON config to maximize compatibility
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const currentYear = new Date().getFullYear();

        const prompt = `Analyze the following text from a sports schedule (e.g., MaxPreps) and extract game information. 
Identify each game's date, time, opponent, and whether it's a home or away game.
Look for "@" indicating away or "vs" indicating home.
For the date and time, convert them into a valid ISO 8601 string. Assume the year is ${currentYear} unless specified otherwise.
If no time is provided, assume 00:00:00.

IMPORTANT: Return ONLY a valid JSON array of objects. No intro text, no markdown code blocks.
The objects must have:
- opponentName: string
- isHome: boolean
- scheduledTime: ISO 8601 string (e.g. "2024-03-15T19:15:00")

Pasted Text:
"""
${pastedText}
"""
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim();

        // Robustness: Strip potential markdown markers that the model might include
        if (jsonText.includes('```')) {
            jsonText = jsonText.replace(/```json\s*|```\s*/g, '').trim();
        }

        // Take everything from the first '[' to the last ']' to be extra safe
        const startIndex = jsonText.indexOf('[');
        const endIndex = jsonText.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        }

        return JSON.parse(jsonText);

    } catch (error: any) {
        console.error("Error generating schedule:", error);
        let errorMessage = error.message || "The AI failed to process the request.";
        if (error instanceof SyntaxError) {
            errorMessage = "The AI returned an invalid format. Try adjusting the pasted text.";
        }
        throw new Error(errorMessage);
    }
};

export const generateRosterFromText = async (pastedText: string): Promise<Omit<Player, 'id'>[]> => {
    if (!pastedText.trim()) {
        throw new Error("Pasted text cannot be empty.");
    }

    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze the following text from a lacrosse team's website roster and extract the player information. Identify each player's name, jersey number, and position. The position might be abbreviated (e.g., A, M, D, G, LSM, FOGO). Do your best to standardize the position to: Attack, Midfield, Defense, Goalie, LSM, or Face Off Specialist.

IMPORTANT: Return ONLY a valid JSON array of objects. No intro text, no markdown code blocks.
The objects must have: name (string), jerseyNumber (string), position (string).

Pasted Text:
"""
${pastedText}
"""
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim();

        if (jsonText.includes('```')) {
            jsonText = jsonText.replace(/```json\s*|```\s*/g, '').trim();
        }

        const startIndex = jsonText.indexOf('[');
        const endIndex = jsonText.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        }

        return JSON.parse(jsonText);

    } catch (error: any) {
        console.error("Error generating roster:", error);
        let errorMessage = error.message || "The AI failed to process the request.";
        throw new Error(errorMessage);
    }
};

export const analyzeCodeProblem = async (question: string, code: string, fileName: string): Promise<string> => {
    if (!question.trim() || !code.trim()) {
        throw new Error("Question and code content cannot be empty.");
    }

    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "";

    } catch (error) {
        console.error("Error analyzing code:", error);
        return "An error occurred while communicating with the AI. Please check the console for details.";
    }
};

export const analyzePlayerPerformance = async (playerData: PlayerAnalysisData): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "";
    } catch (error) {
        console.error("Error analyzing player performance:", error);
        return "An error occurred while communicating with the AI. Please check your API key and connection.";
    }
};

export const analyzeShotPlacement = async (base64Image: string): Promise<number | null> => {
    try {
        const genAI = new GoogleGenerativeAI(getApiKey());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image.split(',')[1]
                }
            }
        ]);
        const response = await result.response;
        const zoneText = response.text().trim();
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

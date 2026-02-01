// This service manages the Gemini API key using localStorage.

const STORAGE_KEY = 'gemini_api_key';
let apiKey: string | null = null;

export function initializeApiKey(): boolean {
    // 1. Check for Environment Variable (Hardcoded/Configured)
    // @ts-ignore - Vercel build environment workaround
    const env = (import.meta as any).env;
    if (env && env.VITE_GEMINI_API_KEY) {
        apiKey = env.VITE_GEMINI_API_KEY.replace(/^["']|["']$/g, '').trim();
        return true;
    }

    // 2. Check Local Storage (User Entered)
    try {
        const key = localStorage.getItem(STORAGE_KEY);
        if (key && key.trim() !== '') {
            apiKey = key;
            return true;
        }
    } catch (e) {
        console.error("Could not read from storage.", e);
    }
    apiKey = null;
    return false;
}

export function getApiKey(): string {
    if (!apiKey) {
        throw new Error("API Key has not been set.");
    }
    return apiKey;
}

export async function setApiKey(key: string): Promise<void> {
    if (!key || !key.trim()) {
        throw new Error("API Key cannot be empty.");
    }
    const cleanKey = key.replace(/^["']|["']$/g, '').trim();
    apiKey = cleanKey;
    localStorage.setItem(STORAGE_KEY, cleanKey);
}

export async function clearApiKey(): Promise<void> {
    apiKey = null;
    localStorage.removeItem(STORAGE_KEY);
}

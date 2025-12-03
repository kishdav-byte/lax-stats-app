// This service manages the Gemini API key using localStorage.

const STORAGE_KEY = 'gemini_api_key';
let apiKey: string | null = null;

export async function initializeApiKey(): Promise<boolean> {
    console.log("Initializing API Key...");
    try {
        const key = localStorage.getItem(STORAGE_KEY);
        console.log("Read key from storage:", key ? "***" : "null");
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
    console.log("Setting API Key...");
    if (!key || !key.trim()) {
        throw new Error("API Key cannot be empty.");
    }
    apiKey = key;
    localStorage.setItem(STORAGE_KEY, key);
    console.log("API Key saved to localStorage");
}

export async function clearApiKey(): Promise<void> {
    apiKey = null;
    localStorage.removeItem(STORAGE_KEY);
}

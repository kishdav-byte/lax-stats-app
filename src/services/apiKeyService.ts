import { fetchAppSetting, saveAppSetting } from './storageService';

let apiKey: string = "";
const STORAGE_KEY = "gemini_api_key";

/**
 * Global API Key Service
 * Now synchronizes with Supabase for team-wide access.
 */

export function getApiKey(): string {
    return apiKey;
}

export async function initializeApiKey(): Promise<boolean> {
    // 1. Try local cache first for fast boot
    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey) {
        apiKey = localKey;
    }

    // 2. Try ENV fallback (for Vercel/Production defaults)
    const env = (import.meta as any).env;
    if (!apiKey && env && env.VITE_GEMINI_API_KEY) {
        apiKey = env.VITE_GEMINI_API_KEY.replace(/^["']|["']$/g, '').trim();
    }

    // 3. Sync with Global Database (Supabase)
    try {
        const globalConfig = await fetchAppSetting('global_ai_config');
        if (globalConfig?.apiKey) {
            const remoteKey = globalConfig.apiKey.replace(/^["']|["']$/g, '').trim();
            if (remoteKey !== apiKey) {
                apiKey = remoteKey;
                localStorage.setItem(STORAGE_KEY, remoteKey);
            }
        }
    } catch (e) {
        console.warn("Global API Key fetch failed, using local/env instead.");
    }

    return apiKey.length > 0;
}

export async function setGlobalApiKey(key: string): Promise<void> {
    if (!key || !key.trim()) {
        throw new Error("API Key cannot be empty.");
    }
    const cleanKey = key.replace(/^["']|["']$/g, '').trim();
    apiKey = cleanKey;

    // Update Local
    localStorage.setItem(STORAGE_KEY, cleanKey);

    // Update Global (Supabase)
    await saveAppSetting('global_ai_config', { apiKey: cleanKey, updatedAt: new Date().toISOString() });
}

export async function clearApiKey(): Promise<void> {
    apiKey = "";
    localStorage.removeItem(STORAGE_KEY);
    // Note: We don't clear global here, only local. Global is cleared via DevSupport/Admin.
}

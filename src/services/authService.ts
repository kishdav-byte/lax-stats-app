import { supabase } from '../supabaseClient';

export const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
        },
    });
    if (error) throw error;
    return data;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const subscribeToAuthChanges = (callback: (user: any | null) => void) => {
    // Initial fetch of session
    supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Supabase Auth Event:", event);
        callback(session?.user || null);
    });

    // Return unsubscribe function
    return () => subscription.unsubscribe();
};

export const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) throw error;
};

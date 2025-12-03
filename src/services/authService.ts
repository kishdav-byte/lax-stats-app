import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { auth } from "../firebaseConfig";

export const login = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

export const register = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
    return await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const resetPassword = async (email: string) => {
    console.log(`Attempting to send password reset email to: ${email}`);
    const { sendPasswordResetEmail } = await import("firebase/auth");
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("Password reset email sent successfully (from client side).");
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

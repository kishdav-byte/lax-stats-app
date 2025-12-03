import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAa95FAra708U1ApV0yLo-TWb1Lfk4YliU",
    authDomain: "lax-stats-29341.firebaseapp.com",
    projectId: "lax-stats-29341",
    storageBucket: "lax-stats-29341.firebasestorage.app",
    messagingSenderId: "341700554468",
    appId: "1:341700554468:web:7c65ca27ff1a98d88c86f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

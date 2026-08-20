import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyWVzz0wpAYN7uxlLBv8ZJGJuPznsQAyo",
  authDomain: "neon-air.firebaseapp.com",
  projectId: "neon-air",
  storageBucket: "neon-air.firebasestorage.app",
  messagingSenderId: "705437255274",
  appId: "1:705437255274:web:2484cc2cd67c0d24c3ec13",
  measurementId: "G-4X2P35Q56Z",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
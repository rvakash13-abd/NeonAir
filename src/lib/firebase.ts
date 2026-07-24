import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Same "Neon-Air" Firebase project as the original app.
const firebaseConfig = {
  apiKey: 'AIzaSyDyWVzz0wpAYN7uxlLBv8ZJGJuPznsQAyo',
  authDomain: 'neon-air.firebaseapp.com',
  projectId: 'neon-air',
  storageBucket: 'neon-air.firebasestorage.app',
  messagingSenderId: '705437255274',
  appId: '1:705437255274:web:2484cc2cd67c0d24c3ec13',
};

export const firebaseIsConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';

export const app = firebaseIsConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    })
  : null;
export const db = app ? getFirestore(app) : null;

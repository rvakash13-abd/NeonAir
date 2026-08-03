import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account with that email already exists — try logging in instead.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/user-not-found': 'No account found with that email — try signing up.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/unauthorized-domain': 'This domain is not authorized for Google sign-in yet.',
};

export function friendlyAuthError(err: any): string {
  return FRIENDLY_ERRORS[err?.code] || err?.message || 'Something went wrong. Please try again.';
}

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  async function login(email: string, password: string) {
    if (!auth) throw new Error('Firebase not configured');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setAuthLoading(false);
    }
  }
  async function signup(email: string, password: string) {
    if (!auth) throw new Error('Firebase not configured');
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } finally {
      setAuthLoading(false);
    }
  }
  async function loginWithGoogle() {
    if (!auth) throw new Error('Firebase not configured');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } finally {
      setAuthLoading(false);
    }
  }
  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }
  async function resetPassword(email: string) {
    if (!auth) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  }

  return { user, authLoading, login, signup, logout, resetPassword, loginWithGoogle };
}
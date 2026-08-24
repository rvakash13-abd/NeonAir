import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account with that email already exists — try logging in instead.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/user-not-found': 'No account found with that username — try signing up.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
};

export function friendlyAuthError(err: any): string {
  const code = err?.code as string | undefined;
  return (code && FRIENDLY_ERRORS[code]) || err?.message || 'Something went wrong. Please try again.';
}

export function useAuth() {
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<AppUser | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser: User | null) => {
      setUser(fbUser ? {
        uid: fbUser.uid,
        email: fbUser.email,
      } : null);
    });
    return unsub;
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setAuthLoading(true);
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.trim().toLowerCase()));
      if (!usernameDoc.exists()) {
        const error: any = new Error('No account found with that username.');
        error.code = 'auth/user-not-found';
        throw error;
      }
      await signInWithEmailAndPassword(auth, usernameDoc.data().email as string, password);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      setAuthLoading(true);
      try {
        const key = username.trim().toLowerCase();
        const existing = await getDoc(doc(db, 'usernames', key));
        if (existing.exists()) {
          const error: any = new Error('That username is already taken.');
          error.code = 'auth/email-already-in-use';
          throw error;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: username.trim() });
        await setDoc(doc(db, 'usernames', key), { email: email.trim(), uid: cred.user.uid });
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (username: string) => {
    const usernameDoc = await getDoc(doc(db, 'usernames', username.trim().toLowerCase()));
    if (!usernameDoc.exists()) {
      const error: any = new Error('No account found with that username.');
      error.code = 'auth/user-not-found';
      throw error;
    }
    await sendPasswordResetEmail(auth, usernameDoc.data().email as string);
  }, []);

  // Use if you set a custom action URL and parse `oobCode` from it yourself.
  const confirmResetPassword = useCallback(async (oobCode: string, newPassword: string) => {
    await confirmPasswordReset(auth, oobCode, newPassword);
  }, []);

  return {
    user,
    authLoading,
    login,
    signup,
    logout,
    resetPassword,
    confirmResetPassword,
    loginWithGoogle,
  };
}
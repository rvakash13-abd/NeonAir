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
import { auth } from '../lib/firebase';

const INTERNAL_EMAIL_DOMAIN = '@accounts.neonair.invalid';

function usernameEmail(username: string) {
  return `${username.trim().toLowerCase()}${INTERNAL_EMAIL_DOMAIN}`;
}

export interface AppUser {
  uid: string;
  email: string | null;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account with that email already exists — try logging in instead.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/user-not-found': 'No account found with that email — try signing up.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
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
        email: fbUser.email?.endsWith(INTERNAL_EMAIL_DOMAIN) ? null : fbUser.email,
      } : null);
    });
    return unsub;
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, usernameEmail(username), password);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (username: string, password: string) => {
      setAuthLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, usernameEmail(username), password);
        await updateProfile(cred.user, { displayName: username.trim() });
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

  // Sends a reset-password email with a link. By default the link opens a
  // Firebase-hosted page. To handle it inside your own app, set a custom
  // action URL in Firebase Console → Authentication → Templates.
  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
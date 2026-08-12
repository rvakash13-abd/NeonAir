import { useCallback, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp, useClerk } from '@clerk/clerk-react';
import { signInWithCustomToken, signOut as fbSignOut } from 'firebase/auth';
import { auth as firebaseAuth } from '../lib/firebase';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const useUserCompat = hasClerk ? useUser : () => ({ isLoaded: true, isSignedIn: false, user: null });
const useClerkAuthCompat = hasClerk
  ? useClerkAuth
  : () => ({ getToken: async () => null, signOut: async () => undefined });
const useSignInCompat = hasClerk
  ? useSignIn
  : () => ({ signIn: null, isLoaded: true, setActive: undefined });
const useSignUpCompat = hasClerk
  ? useSignUp
  : () => ({ signUp: null, isLoaded: true, setActive: undefined });
const useClerkCompat = hasClerk ? useClerk : () => null;

export interface AppUser {
  uid: string;
  email: string | null;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  form_identifier_not_found: 'No account found with that email — try signing up.',
  form_password_incorrect: 'Incorrect password.',
  form_identifier_exists: 'An account with that email already exists — try logging in instead.',
  form_password_pwned: "That password isn't safe to use — please pick a stronger one.",
  form_password_length_too_short: 'Password should be at least 8 characters.',
  form_param_format_invalid: "That email address doesn't look right.",
  form_code_incorrect: 'That code is incorrect.',
  verification_expired: 'That code has expired — request a new one.',
  verification_already_verified: 'This is already verified — try logging in.',
};

export function friendlyAuthError(err: any): string {
  const code = err?.errors?.[0]?.code;
  return FRIENDLY_ERRORS[code] || err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Something went wrong. Please try again.';
}

export function useAuth() {
  const { isLoaded: userLoaded, isSignedIn, user: clerkUser } = useUserCompat();
  const { getToken, signOut: clerkSignOut } = useClerkAuthCompat();
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignInCompat();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUpCompat();
  const clerk = useClerkCompat();

  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<AppUser | null | undefined>(undefined); // undefined = loading

  // Bridges the Clerk session to Firebase Auth, so Firestore security rules
  // (checking request.auth) keep working. Requires the Firebase integration
  // to be turned on in the Clerk dashboard (see setup notes).
  useEffect(() => {
    if (!userLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      if (firebaseAuth) fbSignOut(firebaseAuth).catch(() => {});
      return;
    }
    (async () => {
      try {
        const token = await getToken({ template: 'integration_firebase' });
        if (token && firebaseAuth) {
          await signInWithCustomToken(firebaseAuth, token);
        }
      } catch (e) {
        console.error(
          'Firebase bridge failed — check the Firebase integration is enabled in the Clerk dashboard:',
          e
        );
      }
      setUser({
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
      });
    })();
  }, [userLoaded, isSignedIn, clerkUser, getToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!signInLoaded || !signIn) throw new Error('Auth not ready yet');
      setAuthLoading(true);
      try {
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await setActiveSignIn!({ session: result.createdSessionId });
        } else {
          throw { errors: [{ message: 'A verification code was sent — check your email.' }] };
        }
      } finally {
        setAuthLoading(false);
      }
    },
    [signIn, signInLoaded, setActiveSignIn]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      if (!signUpLoaded || !signUp) throw new Error('Auth not ready yet');
      setAuthLoading(true);
      try {
        const result = await signUp.create({ emailAddress: email, password });
        console.log('signUp.create result:', result.status, result);
        if (result.status === 'complete') {
          await setActiveSignUp!({ session: result.createdSessionId });
        } else {
          // Only send a fresh code if one hasn't already been prepared for
          // this signUp attempt — calling prepare twice invalidates the
          // first code and can leave the user typing a stale one.
          const alreadyPrepared = signUp.verifications?.emailAddress?.status === 'verified'
            || signUp.verifications?.emailAddress?.status === 'unverified'
              && signUp.verifications?.emailAddress?.attempts !== null;
          if (!alreadyPrepared) {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            console.log('Verification code prepared/sent');
          }
          throw { errors: [{ message: 'Account created! Check your email for a verification code.' }] };
        }
      } finally {
        setAuthLoading(false);
      }
    },
    [signUp, signUpLoaded, setActiveSignUp]
  );

  const loginWithGoogle = useCallback(async () => {
    if (!signInLoaded || !signIn) throw new Error('Auth not ready yet');
    setAuthLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: window.location.origin,
      });
      // Browser navigates away here — setAuthLoading(false) never runs, which is fine.
    } catch (e) {
      setAuthLoading(false);
      throw e;
    }
  }, [signIn, signInLoaded]);

  const logout = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  // Step 1 of the reset flow: send a code to the user's email.
  const resetPassword = useCallback(
    async (email: string) => {
      if (!signInLoaded || !signIn) throw new Error('Auth not ready yet');
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
    },
    [signIn, signInLoaded]
  );

  // Resend a fresh verification code for the in-progress sign-up, in case
  // the user's original code expired or was replaced by a duplicate send.
  const resendEmailCode = useCallback(async () => {
    if (!signUp) throw new Error('No pending sign-up to resend a code for.');
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  }, [signUp]);

  // Confirm an email verification code (used for signup/login email-code
  // flows). Reads Clerk's live signUp/signIn resource status directly and
  // surfaces Clerk's real error via friendlyAuthError, instead of a
  // hardcoded generic message.
  const confirmEmailCode = useCallback(
    async (code: string) => {
      setAuthLoading(true);
      const trimmed = code.trim();
      try {
        // If there's a pending sign-up, try verifying the email code regardless
        // of the signUp.status; Clerk may return different intermediate statuses
        // depending on configuration. Surface a clearer message if additional
        // requirements are needed to complete signup.
        if (signUp) {
          try {
            const result = await signUp.attemptEmailAddressVerification({ code: trimmed });
            console.log('attemptEmailAddressVerification result:', result.status, result);
            if (result.status === 'complete') {
              await setActiveSignUp!({ session: result.createdSessionId });
              return;
            }
            if (result.status === 'missing_requirements') {
              throw { errors: [{ message: 'Verification incomplete — additional information required to finish signup. Please complete the signup form.' }] };
            }
            throw { errors: [{ message: `Verification incomplete (status: ${result.status})` }] };
          } catch (err: any) {
            console.error('attemptEmailAddressVerification error:', JSON.stringify(err, null, 2));
            throw err;
          }
        }
        if (signIn && signIn.status === 'needs_first_factor') {
          try {
            const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: trimmed });
            console.log('attemptFirstFactor result:', result.status, result);
            if (result.status === 'complete') {
              await setActiveSignIn!({ session: result.createdSessionId });
              return;
            }
            throw { errors: [{ message: `Verification incomplete (status: ${result.status})` }] };
          } catch (err: any) {
            console.error('attemptFirstFactor error:', JSON.stringify(err, null, 2));
            throw err;
          }
        }
        throw new Error('No pending verification flow found — try signing up again.');
      } finally {
        setAuthLoading(false);
      }
    },
    [signUp, signIn, setActiveSignUp, setActiveSignIn]
  );

  // Step 2 of the reset flow: verify the code and set the new password.
  const confirmResetPassword = useCallback(
    async (code: string, newPassword: string) => {
      if (!signInLoaded || !signIn) throw new Error('Auth not ready yet');
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result.status === 'complete') {
        await setActiveSignIn!({ session: result.createdSessionId });
      } else {
        throw { errors: [{ message: 'Could not complete the reset — try again.' }] };
      }
    },
    [signIn, signInLoaded, setActiveSignIn]
  );

  return {
    user,
    authLoading,
    login,
    signup,
    logout,
    resetPassword,
    confirmResetPassword,
    loginWithGoogle,
    confirmEmailCode,
    resendEmailCode,
  };
}

// Not tied to Clerk — a tiny helper for the /sso-callback route so App.tsx
// doesn't need a router library just for this.
export function isSsoCallbackPath() {
  return window.location.pathname === '/sso-callback';
}
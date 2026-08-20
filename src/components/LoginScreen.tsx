import { useState } from 'react';
import { motion } from 'framer-motion';
import { friendlyAuthError } from '../hooks/useAuth';
import AnimatedShaderBackground from './Animatedshaderbackground';

type Mode = 'login' | 'signup';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
  onLoginWithGoogle: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.3 21.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.3 21.3 0 0 1-3.22 4.36M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3c-7.4 0-13.7 4.2-16.9 10.3z"/>
      <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.5 36.1 26.9 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.4 40.9 16.1 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.6 35.5 45 30.2 45 24c0-1.4-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

export default function LoginScreen({ onLogin, onSignup, onLoginWithGoogle, onResetPassword, loading }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit() {
    if (!username.trim() || !password) {
      setStatus('Please enter your username and password.');
      return;
    }
    if (mode === 'signup' && !/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim())) {
      setStatus('Username must be 3–32 characters: letters, numbers, dot, dash, or underscore.');
      return;
    }
    setStatus(mode === 'signup' ? 'Creating your account…' : 'Logging you in…');
    try {
      if (mode === 'signup') await onSignup(username, password);
      else await onLogin(username, password);
    } catch (e: any) {
      const msg = friendlyAuthError(e);
      setStatus(msg);
    }
  }

  async function google() {
    setGoogleBusy(true);
    setStatus('');
    try {
      await onLoginWithGoogle();
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
    } finally {
      setGoogleBusy(false);
    }
  }

  async function forgot() {
    if (!username.trim()) {
      setStatus('Enter your username first.');
      return;
    }
    try {
      setStatus('Password reset is unavailable for username-only accounts.');
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
    }
  }

  return (
    <div className="absolute inset-0 z-[60] overflow-hidden flex items-center justify-center">
      <AnimatedShaderBackground className="opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative z-10 w-full max-w-4xl px-6 md:px-10 py-8 grid md:grid-cols-[1fr_1fr] gap-10 items-center">
        {/* ── brand side ── */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="w-16 h-16 rounded-[18px] flex items-center justify-center text-3xl mb-5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
          >
            ✏️
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-display text-[clamp(2rem,4.6vw,3.2rem)] leading-tight text-white"
          >
            Scribble <span style={{ color: 'var(--accent)' }}>Air</span> Draw
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-white/55"
          >
            Wave your hand in the air and watch your drawing come to life. No crayons needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 flex flex-col gap-2 text-[12.5px] text-white/45 font-medium"
          >
            <span>👉 Point your finger to draw</span>
            <span>✌️ Show a peace sign to move around</span>
          </motion.div>
        </div>

        {/* ── auth card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="auth-card w-full"
        >
          <div className="auth-tabs">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <div
                key={m}
                onClick={() => { setMode(m); setStatus(''); }}
                className={'auth-tab' + (mode === m ? ' active' : '')}
              >
                {mode === m && (
                  <motion.div layoutId="authTabPill" className="auth-tab-pill-bg" />
                )}
                <span className="relative">{m === 'login' ? 'Log in' : 'Sign up'}</span>
              </div>
            ))}
          </div>

          <button onClick={google} disabled={googleBusy || loading} className="night-google-btn">
            <GoogleIcon />
            {googleBusy ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10.5px] font-semibold text-white/30 uppercase tracking-wide">or with email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex flex-col gap-3">
            <input
              className="night-input"
              type="email"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <div className="relative flex items-center">
              <input
                className="night-input pr-11"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <span className="night-pw-toggle absolute right-3.5" onClick={() => setShowPw((s) => !s)}>
                <EyeIcon off={showPw} />
              </span>
            </div>

            {mode === 'signup' && (
              <div className="text-center text-[11px] text-white/35">Username and password are enough to create your account.</div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} className="night-submit mt-1" onClick={submit} disabled={loading}>
              {mode === 'signup' ? 'Create account' : 'Log in'}
            </motion.button>

            <div className="text-center text-[12px] min-h-[16px] text-white/50 mt-1">{status}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
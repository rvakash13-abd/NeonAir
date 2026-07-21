import { useState } from 'react';
import { motion } from 'framer-motion';
import { friendlyAuthError } from '../hooks/useAuth';
import AnimatedShaderBackground from './Animatedshaderbackground';

type Mode = 'login' | 'signup';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const WORD = 'Neon Air';

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

export default function LoginScreen({ onLogin, onSignup, onResetPassword, loading }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('');

  async function submit() {
    if (!email || !password) {
      setStatus('Please enter both email and password.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setStatus("Passwords don't match.");
      return;
    }
    setStatus(mode === 'signup' ? 'Creating your account…' : 'Logging in…');
    try {
      if (mode === 'signup') await onSignup(email, password);
      else await onLogin(email, password);
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
    }
  }

  async function forgot() {
    if (!email) {
      setStatus('Enter your email above first, then tap "Forgot password?".');
      return;
    }
    try {
      await onResetPassword(email);
      setStatus('Password reset email sent — check your inbox.');
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
    }
  }

  return (
    <div className="absolute inset-0 z-[60] overflow-hidden bg-[#050608] flex items-center justify-center">
      {/* animated shader background */}
      <AnimatedShaderBackground className="opacity-70" />
      {/* dark scrim so the shader stays a backdrop, not the focus */}
      <div className="pointer-events-none absolute inset-0 bg-[#050608]/55" />

      <div className="relative z-10 w-full max-w-5xl px-6 md:px-12 py-10 grid md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-4 items-center">
        {/* ── brand / hero side ── */}
        <div className="flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10.5px] tracking-[0.32em] text-white/40 uppercase mb-4"
          >
            Webcam &middot; Hand tracking &middot; Light
          </motion.div>

          <h1 className="font-display italic text-[15vw] md:text-[5.2vw] leading-[0.95] text-white flex flex-wrap">
            {WORD.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.15 + i * 0.045, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: ch === ' ' ? 'inline-block' : 'inline-block',
                  width: ch === ' ' ? '0.28em' : undefined,
                  color: i > 4 ? '#00dcff' : '#fff',
                  textShadow: i > 4 ? '0 0 28px rgba(0,220,255,0.55)' : 'none',
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-white/50"
          >
            Point a finger at your camera and paint in mid-air. Every stroke glows, saves to
            your account, and follows you to any device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-7 flex gap-2"
          >
            <span className="text-[10.5px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/45">
              🖐 draw
            </span>
            <span className="text-[10.5px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/45">
              ✌️ move &amp; pan
            </span>
          </motion.div>

          {/* animated light trail linking brand to the form, desktop only */}
          <svg
            className="hidden md:block absolute left-[52%] top-[30%] w-[220px] h-[260px] pointer-events-none"
            viewBox="0 0 220 260"
            fill="none"
          >
            <motion.path
              d="M0,10 C90,10 40,140 130,150 C190,157 150,220 210,240"
              stroke="#00dcff"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.55 }}
              transition={{ delay: 1.0, duration: 1.3, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,220,255,0.8))' }}
            />
          </svg>
        </div>

        {/* ── auth card ── */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-2xl p-6 md:p-7 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.7)]"
        >
          <div className="relative flex mb-6 bg-white/[0.05] rounded-[11px] p-1">
            <motion.div
              className="absolute top-1 bottom-1 rounded-[9px]"
              style={{ background: 'linear-gradient(90deg,#00dcff,#7a5bff)', width: 'calc(50% - 4px)' }}
              animate={{ left: mode === 'login' ? 4 : 'calc(50% + 0px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
            <div className="auth-tab-pill flex-1 text-center" onClick={() => { setMode('login'); setStatus(''); }}>
              <span className={mode === 'login' ? 'auth-tab-pill active' : ''}>Log In</span>
            </div>
            <div className="auth-tab-pill flex-1 text-center" onClick={() => { setMode('signup'); setStatus(''); }}>
              <span className={mode === 'signup' ? 'auth-tab-pill active' : ''}>Sign Up</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <div className="relative flex items-center">
              <input
                className="auth-input pr-10"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <span
                className={'pw-toggle absolute right-3' + (showPw ? ' active' : '')}
                onClick={() => setShowPw((s) => !s)}
              >
                <EyeIcon off={showPw} />
              </span>
            </div>

            {mode === 'signup' && (
              <div className="relative flex items-center">
                <input
                  className="auth-input pr-10"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <span
                  className={'pw-toggle absolute right-3' + (showConfirm ? ' active' : '')}
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  <EyeIcon off={showConfirm} />
                </span>
              </div>
            )}

            <button className="auth-submit mt-1" onClick={submit} disabled={loading}>
              {mode === 'signup' ? 'Sign Up' : 'Log In'}
            </button>

            {mode === 'login' && (
              <div
                className="text-center text-[11px] text-white/35 underline cursor-pointer mt-0.5"
                onClick={forgot}
              >
                Forgot password?
              </div>
            )}

            <div className="text-center text-[11px] min-h-[14px] text-white/55">{status}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
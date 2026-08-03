import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { friendlyAuthError } from '../hooks/useAuth';

type Mode = 'login' | 'signup';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
  onLoginWithGoogle: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.3 21.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.3 21.3 0 0 1-3.22 4.36M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3c-7.4 0-13.7 4.2-16.9 10.3z"/>
      <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.5 36.1 26.9 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.4 40.9 16.1 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.6 35.5 45 30.2 45 24c0-1.4-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

/** Soft animated sky: drifting sun + moon on gentle arcs, twinkling stars, floating clouds */
function AnimatedKidSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const seed = i * 37.7;
        return {
          id: i,
          top: (seed * 13) % 85,
          left: (seed * 29) % 100,
          size: 2 + ((i * 5) % 4),
          delay: (i % 10) * 0.4,
          duration: 2.5 + (i % 5) * 0.6,
        };
      }),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="kid-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* sun arcing across the top */}
      <div className="kid-sun-orbit">
        <div className="kid-sun">☀️</div>
      </div>

      {/* moon arcing on a slower, offset path */}
      <div className="kid-moon-orbit">
        <div className="kid-moon">🌙</div>
      </div>

      {/* drifting clouds */}
      <div className="kid-cloud kid-cloud-1">☁️</div>
      <div className="kid-cloud kid-cloud-2">☁️</div>
      <div className="kid-cloud kid-cloud-3">☁️</div>
    </div>
  );
}

export default function LoginScreen({ onLogin, onSignup, onLoginWithGoogle, onResetPassword, loading }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit() {
    if (!email || !password) {
      setStatus('Oops! Please fill in your email and password. 🖍️');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setStatus("Those passwords don't match — try again! 🔎");
      return;
    }
    setStatus(mode === 'signup' ? 'Making your account… ✨' : 'Logging you in… 🚀');
    try {
      if (mode === 'signup') await onSignup(email, password);
      else await onLogin(email, password);
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
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
    if (!email) {
      setStatus('Type your email above first, then tap "Forgot password?" 💌');
      return;
    }
    try {
      await onResetPassword(email);
      setStatus('Sent! Check your inbox for a reset link. 📬');
    } catch (e: any) {
      setStatus(friendlyAuthError(e));
    }
  }

  return (
    <div className="absolute inset-0 z-[60] overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FFF3B0] via-[#FFD6E8] to-[#B6E3FF]">
      <AnimatedKidSky />

      <div className="relative z-10 w-full max-w-4xl px-6 md:px-10 py-8 grid md:grid-cols-[1fr_1fr] gap-10 items-center">
        {/* ── brand side ── */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="text-7xl md:text-8xl mb-2"
          >
            ✏️🎨
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-tight text-[#3a2e6b]"
          >
            Scribble <span className="text-[#ff6fa8]">Air</span> Draw
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5b4e8a] font-medium"
          >
            Wave your hand in the air and watch your drawing come to life! 🌈✨ No crayons needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 flex flex-col gap-2 text-[13px] text-[#5b4e8a] font-semibold"
          >
            <span>👉 Point your finger to draw</span>
            <span>✌️ Show a peace sign to move around</span>
          </motion.div>
        </div>

        {/* ── auth card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white rounded-[28px] shadow-[0_18px_40px_-12px_rgba(120,90,200,0.35)] p-6 md:p-8 border-4 border-white"
        >
          <div className="flex gap-2 mb-6 bg-[#F4EEFF] p-1.5 rounded-2xl">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <div
                key={m}
                onClick={() => { setMode(m); setStatus(''); }}
                className="relative flex-1 text-center py-2.5 rounded-xl cursor-pointer font-bold text-[13px] transition-colors"
                style={{ color: mode === m ? '#3a2e6b' : '#9b8fc7' }}
              >
                {mode === m && (
                  <motion.div layoutId="authTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
                )}
                <span className="relative">{m === 'login' ? '👋 Log in' : '🌟 Sign up'}</span>
              </div>
            ))}
          </div>

          <button
            onClick={google}
            disabled={googleBusy || loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white border-2 border-[#E8E1FF] rounded-2xl py-3.5 text-[14px] font-bold text-[#3a2e6b] disabled:opacity-60 hover:bg-[#FAF7FF] transition-colors"
          >
            <GoogleIcon />
            {googleBusy ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[#EDE7FA]" />
            <span className="text-[11px] font-bold text-[#B4A8DE] uppercase tracking-wide">or with email</span>
            <div className="h-px flex-1 bg-[#EDE7FA]" />
          </div>

          <div className="flex flex-col gap-3">
            <input
              className="kid-input"
              type="email"
              placeholder="Your email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <div className="relative flex items-center">
              <input
                className="kid-input pr-11"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <span className="kid-pw-toggle absolute right-3.5" onClick={() => setShowPw((s) => !s)}>
                <EyeIcon off={showPw} />
              </span>
            </div>

            {mode === 'signup' && (
              <div className="relative flex items-center">
                <input
                  className="kid-input pr-11"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Type password again"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <span className="kid-pw-toggle absolute right-3.5" onClick={() => setShowConfirm((s) => !s)}>
                  <EyeIcon off={showConfirm} />
                </span>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              className="kid-submit mt-2"
              onClick={submit}
              disabled={loading}
            >
              {mode === 'signup' ? "Let's create my account! 🎉" : "Let's draw! 🚀"}
            </motion.button>

            {mode === 'login' && (
              <div className="text-center text-[12px] text-[#9b8fc7] underline cursor-pointer mt-1 font-semibold" onClick={forgot}>
                Forgot password?
              </div>
            )}

            <div className="text-center text-[12.5px] min-h-[16px] text-[#5b4e8a] font-semibold mt-1">{status}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
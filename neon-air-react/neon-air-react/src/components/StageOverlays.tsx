import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NicknameScreen({ onContinue }: { onContinue: (nickname: string) => Promise<void> }) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!nickname.trim()) {
      setStatus('Please enter a nickname.');
      return;
    }
    setBusy(true);
    setStatus('Saving…');
    await onContinue(nickname.trim());
    setBusy(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[62] bg-[#050608] flex flex-col items-center justify-center gap-4 px-6"
    >
      <div className="font-display italic text-3xl text-white">One more thing</div>
      <div className="text-[12.5px] text-white/45 text-center max-w-xs leading-relaxed">
        What should we call you? This is shown instead of your email around the app.
      </div>
      <input
        className="auth-input max-w-[220px] text-center"
        placeholder="Nickname"
        maxLength={24}
        autoComplete="off"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
      <button className="auth-submit max-w-[220px]" onClick={go} disabled={busy}>
        Continue
      </button>
      <div className="text-[11px] text-white/40 min-h-[14px]">{status}</div>
    </motion.div>
  );
}

export function WelcomeScreen({
  nickname,
  isNew,
  onContinue,
}: {
  nickname: string | null;
  isNew: boolean;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[62] bg-[#050608] flex flex-col items-center justify-center gap-4 px-6"
    >
      <div
        className="font-display italic text-3xl bg-clip-text text-transparent text-center"
        style={{ backgroundImage: 'linear-gradient(90deg, #00dcff, #b450ff)' }}
      >
        Welcome to NeonAir{nickname ? `, ${nickname}` : ''}!
      </div>
      <div className="text-[12.5px] text-white/45 text-center max-w-xs">
        {isNew
          ? "Your account is set up — let's get drawing in the air."
          : 'Great to see you again — your drawings are right where you left them.'}
      </div>
      <button className="auth-submit max-w-[220px]" onClick={onContinue}>
        Let's Draw ✨
      </button>
    </motion.div>
  );
}

export function LoadOverlay({ pct, msg }: { pct: number; msg: string }) {
  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-[18px]"
      >
        <div className="w-[38px] h-[38px] rounded-full border-[3px] border-white/[0.07] border-t-cyan-neon animate-spin" />
        <div className="font-display italic text-2xl text-[#00dcff]" style={{ textShadow: '0 0 30px rgba(0,220,255,0.5)' }}>
          Neon Air Draw
        </div>
        <div className="w-[200px] h-[3px] bg-white/[0.08] rounded overflow-hidden">
          <motion.div
            className="h-full rounded bg-[#00dcff]"
            style={{ boxShadow: '0 0 8px rgba(0,220,255,0.6)' }}
            animate={{ width: pct + '%' }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="text-[12px] text-white/40 tracking-wide text-center max-w-[280px]">{msg}</div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ConfigMissingScreen() {
  return (
    <div className="absolute inset-0 z-[65] bg-black flex flex-col items-center justify-center gap-3.5 px-6">
      <div className="font-display italic text-2xl text-[#ff5050]" style={{ textShadow: '0 0 20px rgba(255,80,80,0.5)' }}>
        Setup needed
      </div>
      <div className="text-[12.5px] text-white/45 text-center max-w-sm leading-relaxed">
        This app needs a Firebase project connected before login will work. Fill in{' '}
        <code className="bg-white/10 px-1.5 py-0.5 rounded">firebaseConfig</code> in{' '}
        <code className="bg-white/10 px-1.5 py-0.5 rounded">src/lib/firebase.ts</code>, then reload.
      </div>
    </div>
  );
}

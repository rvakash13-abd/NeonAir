import { motion } from 'framer-motion';
import AnimatedShaderBackground from './Animatedshaderbackground';

interface Props {
  onGetStarted: () => void;
}

export default function LandingScreen({ onGetStarted }: Props) {
  return (
    <div className="absolute inset-0 z-[70] overflow-hidden flex items-center justify-center">
      <AnimatedShaderBackground className="opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-[22px] flex items-center justify-center text-4xl mb-6"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
        >
          ✏️
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-[clamp(2.1rem,6vw,3.2rem)] leading-tight text-white"
        >
          Scribble <span style={{ color: 'var(--accent)' }}>Air</span> Draw
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-[15px] leading-relaxed text-white/60"
        >
          Wave your hand in the air and watch your drawing come to life — no crayons, no mess, just your webcam and your imagination.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3 w-full text-[11px] text-white/50"
        >
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xl">👉</span>
            Point to draw
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xl">✌️</span>
            Peace sign to move
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xl">🖼️</span>
            Save &amp; revisit
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetStarted}
          className="landing-cta mt-9"
        >
          Get Started 🚀
        </motion.button>
      </div>
    </div>
  );
}
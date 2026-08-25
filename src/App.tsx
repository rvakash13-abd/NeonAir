import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DrawEngine, type Color, type ToolType, type Stroke } from './lib/engine';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import LandingScreen from './components/LandingScreen';
import LoginScreen from './components/LoginScreen';
import { NicknameScreen, WelcomeScreen, LoadOverlay } from './components/StageOverlays';
import Panel from './components/Panel';
import GalleryPanel from './components/GalleryPanel';
import { StatsModal, HistoryModal, ProfileModal } from './components/Modals';
import TemplatesModal from './components/TemplatesModal';
import type { Template } from './lib/templates';

const CHALLENGES = [
  'Draw a creature that lives in clouds', 'Draw your morning coffee', 'Draw a robot pet',
  'Draw a city skyline at midnight', 'Draw something that only exists in dreams',
  'Draw your favorite season', 'Draw a plant from another planet', 'Draw a musical instrument',
  'Draw a doorway to somewhere unexpected', 'Draw a constellation of your own',
  'Draw a vehicle with wings', 'Draw the inside of a volcano', 'Draw a friendly monster',
  'Draw a floating island', "Draw your name in one continuous line",
];
function todaysChallenge() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date().getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

type Stage = 'boot' | 'landing' | 'login' | 'nickname' | 'welcome' | 'app';

export default function App() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<DrawEngine | null>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const { user, authLoading, login, signup, logout, resetPassword, loginWithGoogle } = useAuth();
  const profile = useProfile();

  const [stage, setStage] = useState<Stage>('boot');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showLoadOverlay, setShowLoadOverlay] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [loadMsg, setLoadMsg] = useState('Starting…');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [galleryHidden, setGalleryHidden] = useState(true);

  const [color, setColorState] = useState<Color>({ r: 0, g: 220, b: 255 });
  const [tool, setToolState] = useState<ToolType>('freehand');
  const [size, setSizeState] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [gradientOn, setGradientOn] = useState(false);
  const [transparentExport, setTransparentExport] = useState(false);
  const [camPaused, setCamPaused] = useState(false);
  const [canvasMode, setCanvasMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [bgImageActive, setBgImageActive] = useState(false);

  const [hint, setHint] = useState('Initialising…');
  const [modeBadge, setModeBadge] = useState({ cls: '', text: '' });
  const [zoomPct, setZoomPct] = useState(100);
  const [zoomShow, setZoomShow] = useState(false);
  const [dot, setDot] = useState({ show: false, x: 0, y: 0, size: 0, color: '', glow: '' });

  const [modal, setModal] = useState<null | 'stats' | 'history' | 'profile' | 'templates'>(null);
  const [strokesTick, setStrokesTick] = useState(0); // bump to re-render stats/history reading engine
  const challengeText = useRef(todaysChallenge()).current;

  // ── init engine once canvases exist ──
  useEffect(() => {
    if (!bgCanvasRef.current || !drawCanvasRef.current || !camRef.current) return;
    const engine = new DrawEngine(bgCanvasRef.current, drawCanvasRef.current, camRef.current, {
      onProgress: (pct, msg) => { setLoadPct(pct); setLoadMsg(msg); },
      onReady: () => setShowLoadOverlay(false),
      onHint: setHint,
      onModeBadge: (cls, text) => setModeBadge({ cls, text }),
      onZoomFlash: (pct) => {
        setZoomPct(pct);
        setZoomShow(true);
        clearTimeout((window as any)._zoomT);
        (window as any)._zoomT = setTimeout(() => setZoomShow(false), 1200);
      },
      onStrokesChanged: () => {
        setStrokesTick((t) => t + 1);
        if (engineRef.current) profile.scheduleSave(engineRef.current);
      },
      onDot: (show, x, y, sz, c, glow) => setDot({ show, x, y, size: sz, color: c, glow }),
    });
    engineRef.current = engine;

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
    const vv = (window as any).visualViewport;
    vv?.addEventListener('resize', onResize);

    ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
      document.addEventListener(ev, (e) => e.preventDefault())
    );

    return () => {
      window.removeEventListener('resize', onResize);
      vv?.removeEventListener('resize', onResize);
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── boot: wait for auth state ──
  useEffect(() => {
    if (user === undefined) return; // still loading
    if (user === null) {
      profile.reset();
      // First-ever load shows the landing page; a logout later goes straight to login.
      setStage((s) => (s === 'boot' ? 'landing' : 'login'));
      return;
    }
    // user logged in
    (async () => {
      const engine = engineRef.current!;
      const nickname = await profile.load(user, engine);
      if (!nickname) {
        setStage('nickname');
      } else {
        setIsNewUser(false);
        enterApp();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const enterApp = useCallback(() => {
    setStage('app');
    const isMobileLayout = window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 900px)').matches;
    setGalleryHidden(isMobileLayout);
  }, []);

  useEffect(() => {
    if (stage !== 'app') return;
    const startTimer = window.setTimeout(() => {
      const engine = engineRef.current;
      if (!engine || engine.mpReady || engine.stream) return;
      setShowLoadOverlay(true);
      void engine.start();
    }, 0);
    return () => window.clearTimeout(startTimer);
  }, [stage]);

  function handleGetStarted() {
    setStage('login');
  }

  async function handleNicknameContinue(nickname: string) {
    setIsNewUser(true);
    enterApp();
    try {
      await profile.saveNicknameOnly(nickname);
    } catch (error) {
      console.error('Failed to save nickname:', error);
    }
  }

  function handleLogout() {
    logout();
  }

  // ── panel handlers ──
  const eng = () => engineRef.current!;
  const onColor = (c: Color) => { eng().setColor(c); setColorState(c); setIsEraser(false); };
  const onTool = (t: ToolType) => { eng().setTool(t); setToolState(t); setIsEraser(false); };
  const onSize = (v: number) => { eng().setSize(v); setSizeState(v); };
  const onEraserToggle = () => setIsEraser(eng().toggleEraser());
  const onGradientToggle = () => setGradientOn(eng().toggleGradient());
  const onUndo = () => eng().undo();
  const onClear = () => eng().clear();
  const onZoomIn = () => eng().zoomBy(1.25);
  const onZoomOut = () => eng().zoomBy(0.8);
  const onZoomReset = () => eng().zoomReset();
  const onCamToggle = () => setCamPaused(eng().toggleCamPause());
  const onCanvasModeToggle = () => setCanvasMode(eng().toggleCanvasMode());
  const onPipFlip = () => eng().flipPip();
  const onTransparentToggle = () => setTransparentExport(eng().toggleTransparentExport());
  const onExport = () => eng().exportPNG(profile.currentName);
  const onPickTemplate = async (tpl: Template) => {
    await eng().setBgImageFromUrl(tpl.url);
    setCamPaused(true);
    setBgImageActive(true);
  };
  const onRemoveBgImage = () => {
    eng().clearBgImage();
    setCamPaused(false);
    setBgImageActive(false);
  };
  const onReplay = () => eng().replay();
  const onRecord = () => {
    if (recording) return;
    setRecording(true);
    const rec = eng().record(profile.currentName);
    recorderRef.current = rec || null;
    setTimeout(() => setRecording(false), 400); // engine handles actual stop; badge just pulses
  };
  const onThemeToggle = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.body.classList.toggle('light', next === 'light');
      return next;
    });
  };
  const onBgImageClick = () => bgImgInputRef.current?.click();
  const onBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      eng().importBgImage(f);
      setCamPaused(true);
      setBgImageActive(true);
    }
  };

  const drawingNames = Object.keys(profile.drawings);
  const currentStrokes: Stroke[] = engineRef.current?.getStrokes() || [];
  void strokesTick;

  return (
    <div className="transition-colors duration-700 overflow-x-hidden w-full h-full relative">
      <video id="cam" ref={camRef} autoPlay playsInline muted />
      <canvas className="bg-canvas" ref={bgCanvasRef} />
      <canvas className="draw-canvas" ref={drawCanvasRef} />
      {dot.show && (
        <div
          className="dot"
          style={{ left: dot.x, top: dot.y, width: dot.size, height: dot.size, background: dot.color, boxShadow: dot.glow }}
        />
      )}

      {stage === 'app' && (
        <>
          <div id="hint">{hint}</div>
          <div className={'mode-badge ' + modeBadge.cls}>{modeBadge.text}</div>
          <div id="challengeBanner">
            Today's challenge: <b>{challengeText}</b>
          </div>
          <div className={'zoom-indicator' + (zoomShow ? ' show' : '')}>Zoom {zoomPct}%</div>

          {bgImageActive && (
            <div
              onClick={onRemoveBgImage}
              style={{
                position: 'absolute',
                top: 'max(52px, calc(env(safe-area-inset-top) + 40px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 21,
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 20,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✕ Remove image
            </div>
          )}

          <div className="panel-toggle" style={{ right: 10, top: 'max(12px, env(safe-area-inset-top))' }} onClick={() => setPanelCollapsed((c) => !c)}>⚙</div>
          <div className="panel-toggle" style={{ left: 10, top: 'max(12px, env(safe-area-inset-top))' }} onClick={() => setGalleryHidden((c) => !c)}>☰</div>

          <Panel
            collapsed={panelCollapsed}
            color={color}
            onColor={onColor}
            tool={tool}
            onTool={onTool}
            gradientOn={gradientOn}
            onGradient={onGradientToggle}
            size={size}
            onSize={onSize}
            isEraser={isEraser}
            onEraser={onEraserToggle}
            onUndo={onUndo}
            onClear={onClear}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
            onBgImage={onBgImageClick}
            camPaused={camPaused}
            onCamToggle={onCamToggle}
            canvasMode={canvasMode}
            onCanvasMode={onCanvasModeToggle}
            onPipFlip={onPipFlip}
            transparentExport={transparentExport}
            onTransparent={onTransparentToggle}
            onExport={onExport}
            onReplay={onReplay}
            onRecord={onRecord}
            recording={recording}
            theme={theme}
            onTheme={onThemeToggle}
          />
          <input type="file" ref={bgImgInputRef} accept="image/*" style={{ display: 'none' }} onChange={onBgImageChange} />

          <GalleryPanel
            hidden={galleryHidden}
            profileLabel={profile.nickname || user?.email || ''}
            names={drawingNames}
            favorites={profile.favorites}
            currentName={profile.currentName}
            saveStatus={profile.saveStatus}
            onSwitch={(name) => profile.switchDrawing(name, eng())}
            onToggleFavorite={(name) => profile.toggleFavorite(name, eng())}
            onRename={(name) => {
              const nn = prompt(`Rename "${name}" to:`, name);
              if (nn) profile.renameDrawing(name, nn, eng());
            }}
            onDuplicate={(name) => profile.duplicateDrawing(name, eng())}
            onDelete={(name) => profile.deleteDrawing(name, eng())}
            onNew={(name) => profile.newDrawing(name, eng())}
            onTemplates={() => setModal('templates')}
            onStats={() => setModal('stats')}
            onHistory={() => setModal('history')}
            onProfile={() => setModal('profile')}
            onLogout={handleLogout}
          />

          {modal === 'stats' && (
            <StatsModal
              onClose={() => setModal(null)}
              currentName={profile.currentName}
              strokes={currentStrokes}
              drawStartTime={profile.drawStartTime.current}
              totalDrawings={drawingNames.length}
            />
          )}
          {modal === 'history' && (
            <HistoryModal
              onClose={() => setModal(null)}
              history={profile.history[profile.currentName] || []}
              onRestore={(snap) => { profile.restoreVersion(snap, eng()); setModal(null); }}
            />
          )}
          {modal === 'templates' && (
            <TemplatesModal
              onClose={() => setModal(null)}
              subscribed={profile.subscribed}
              onSubscribe={() => profile.markSubscribedLocally()}
              onPick={onPickTemplate}
            />
          )}
          {modal === 'profile' && (
            <ProfileModal
              onClose={() => setModal(null)}
              nickname={profile.nickname}
              bio={profile.bio}
              email={user?.email}
              drawingCount={drawingNames.length}
              onSave={(name, bio) => profile.saveProfileDetails(name, bio)}
            />
          )}

        </>
      )}

      <AnimatePresence>
        {stage === 'nickname' && <NicknameScreen key="nickname" onContinue={handleNicknameContinue} />}
        {stage === 'welcome' && (
          <WelcomeScreen key="welcome" nickname={profile.nickname} isNew={isNewUser} onContinue={enterApp} />
        )}
      </AnimatePresence>

      {stage === 'landing' && <LandingScreen onGetStarted={handleGetStarted} />}

      {stage === 'login' && (
        <LoginScreen
          onLogin={login}
          onSignup={signup}
          onLoginWithGoogle={loginWithGoogle}
          onResetPassword={resetPassword}
          loading={authLoading}
        />
      )}

      {showLoadOverlay && <LoadOverlay pct={loadPct} msg={loadMsg} />}
    </div>
  );
}
import { useCallback, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import type { DrawEngine, Stroke } from '../lib/engine';

export interface HistorySnap {
  ts: number;
  strokes: Stroke[];
}

export function useProfile() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [drawings, setDrawings] = useState<Record<string, Stroke[]>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<Record<string, HistorySnap[]>>({});
  const [currentName, setCurrentName] = useState('Untitled');
  const [saveStatus, setSaveStatus] = useState('');
  const userRef = useRef<User | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const drawStart = useRef(Date.now());

  const load = useCallback(async (user: User, engine: DrawEngine) => {
    userRef.current = user;
    let nn: string | null = null;
    let bb = '';
    let dr: Record<string, Stroke[]> = {};
    let fv: Record<string, boolean> = {};
    let hs: Record<string, HistorySnap[]> = {};
    let cur = 'Untitled';
    try {
      const snap = await getDoc(doc(db!, 'profiles', user.uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        dr = data.drawings || {};
        fv = data.favorites || {};
        hs = data.history || {};
        nn = data.nickname || null;
        bb = data.bio || '';
        cur = data.current && dr[data.current] ? data.current : Object.keys(dr)[0] || 'Untitled';
      }
    } catch (e) {
      console.error('Failed to load saved drawings:', e);
    }
    setNickname(nn);
    setBio(bb);
    setDrawings(dr);
    setFavorites(fv);
    setHistory(hs);
    setCurrentName(cur);
    drawStart.current = Date.now();
    engine.setStrokes(dr[cur] ? JSON.parse(JSON.stringify(dr[cur])) : []);
    return nn;
  }, []);

  const persist = useCallback(
    async (partial: Record<string, any>) => {
      if (!userRef.current) return;
      try {
        await setDoc(doc(db!, 'profiles', userRef.current.uid), partial, { merge: true });
      } catch (e) {
        console.error('Save failed:', e);
        throw e;
      }
    },
    []
  );

  const saveNicknameOnly = useCallback(
    async (nn: string) => {
      setNickname(nn);
      await persist({ nickname: nn, email: userRef.current?.email });
    },
    [persist]
  );

  const saveProfileDetails = useCallback(
    async (name: string, newBio: string) => {
      setNickname(name);
      setBio(newBio);
      await persist({ nickname: name, bio: newBio, email: userRef.current?.email });
    },
    [persist]
  );

  const saveCurrentDrawing = useCallback(
    (engine: DrawEngine) => {
      if (!userRef.current) return;
      setDrawings((prevDr) => {
        const nextDr = { ...prevDr, [currentName]: engine.getStrokes() };
        setHistory((prevHs) => {
          const h = [...(prevHs[currentName] || [])];
          h.push({ ts: Date.now(), strokes: JSON.parse(JSON.stringify(engine.getStrokes())) });
          if (h.length > 10) h.shift();
          const nextHs = { ...prevHs, [currentName]: h };
          setFavorites((prevFv) => {
            setSaveStatus('Saving…');
            persist({
              drawings: nextDr,
              current: currentName,
              favorites: prevFv,
              history: nextHs,
              email: userRef.current?.email,
              updatedAt: Date.now(),
            })
              .then(() => {
                setSaveStatus('Saved ✓');
                setTimeout(() => setSaveStatus((s) => (s === 'Saved ✓' ? '' : s)), 1500);
              })
              .catch(() => setSaveStatus('Save failed'));
            return prevFv;
          });
          return nextHs;
        });
        return nextDr;
      });
    },
    [currentName, persist]
  );

  const scheduleSave = useCallback(
    (engine: DrawEngine) => {
      if (!userRef.current) return;
      setSaveStatus('Saving…');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveCurrentDrawing(engine), 800);
    },
    [saveCurrentDrawing]
  );

  const switchDrawing = useCallback(
    (name: string, engine: DrawEngine) => {
      if (name === currentName) return;
      engine.commitActiveStroke();
      engine.commitShape();
      setDrawings((prev) => {
        const next = { ...prev, [currentName]: engine.getStrokes() };
        setCurrentName(name);
        engine.setStrokes(next[name] ? JSON.parse(JSON.stringify(next[name])) : []);
        drawStart.current = Date.now();
        scheduleSave(engine);
        return next;
      });
    },
    [currentName, scheduleSave]
  );

  const newDrawing = useCallback(
    (rawName: string, engine: DrawEngine) => {
      engine.commitActiveStroke();
      engine.commitShape();
      setDrawings((prev) => {
        let name = rawName.trim();
        if (!name) {
          let n = Object.keys(prev).length + 1;
          do {
            name = 'Drawing ' + n;
            n++;
          } while (prev[name]);
        }
        if (prev[name]) {
          setCurrentName(name);
          engine.setStrokes(prev[name] ? JSON.parse(JSON.stringify(prev[name])) : []);
          return prev;
        }
        const next = { ...prev, [currentName]: engine.getStrokes(), [name]: [] };
        setCurrentName(name);
        engine.setStrokes([]);
        drawStart.current = Date.now();
        scheduleSave(engine);
        return next;
      });
    },
    [currentName, scheduleSave]
  );

  const renameDrawing = useCallback(
    (oldName: string, newName: string, engine: DrawEngine) => {
      if (!newName || newName === oldName) return;
      setDrawings((prev) => {
        if (prev[newName]) {
          alert('A drawing with that name already exists.');
          return prev;
        }
        const next = { ...prev, [newName]: prev[oldName] };
        delete next[oldName];
        return next;
      });
      setFavorites((prev) => {
        const next = { ...prev };
        if (next[oldName]) {
          next[newName] = true;
          delete next[oldName];
        }
        return next;
      });
      setHistory((prev) => {
        const next = { ...prev };
        if (next[oldName]) {
          next[newName] = next[oldName];
          delete next[oldName];
        }
        return next;
      });
      setCurrentName((prev) => (prev === oldName ? newName : prev));
      scheduleSave(engine);
    },
    [scheduleSave]
  );

  const duplicateDrawing = useCallback(
    (name: string, engine: DrawEngine) => {
      setDrawings((prev) => {
        let copyName = name + ' copy';
        let n = 2;
        while (prev[copyName]) {
          copyName = name + ' copy ' + n;
          n++;
        }
        const next = { ...prev, [copyName]: JSON.parse(JSON.stringify(prev[name])) };
        return next;
      });
      scheduleSave(engine);
    },
    [scheduleSave]
  );

  const deleteDrawing = useCallback(
    (name: string, engine: DrawEngine) => {
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      setDrawings((prev) => {
        const next = { ...prev };
        delete next[name];
        if (currentName === name) {
          const remaining = Object.keys(next);
          const nextCurrent = remaining[0] || 'Untitled';
          if (!next[nextCurrent]) next[nextCurrent] = [];
          setCurrentName(nextCurrent);
          engine.setStrokes(next[nextCurrent] ? JSON.parse(JSON.stringify(next[nextCurrent])) : []);
        }
        return next;
      });
      setFavorites((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setHistory((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      scheduleSave(engine);
    },
    [currentName, scheduleSave]
  );

  const toggleFavorite = useCallback(
    (name: string, engine: DrawEngine) => {
      setFavorites((prev) => ({ ...prev, [name]: !prev[name] }));
      scheduleSave(engine);
    },
    [scheduleSave]
  );

  const restoreVersion = useCallback(
    (snap: HistorySnap, engine: DrawEngine) => {
      if (!confirm('Restore this version? Current changes will be overwritten.')) return;
      engine.commitActiveStroke();
      engine.commitShape();
      engine.setStrokes(JSON.parse(JSON.stringify(snap.strokes)));
      scheduleSave(engine);
    },
    [scheduleSave]
  );

  const reset = useCallback(() => {
    userRef.current = null;
    setNickname(null);
    setBio('');
    setDrawings({});
    setFavorites({});
    setHistory({});
    setCurrentName('Untitled');
    setSaveStatus('');
  }, []);

  return {
    nickname,
    bio,
    drawings,
    favorites,
    history,
    currentName,
    saveStatus,
    drawStartTime: drawStart,
    load,
    saveNicknameOnly,
    saveProfileDetails,
    scheduleSave,
    switchDrawing,
    newDrawing,
    renameDrawing,
    duplicateDrawing,
    deleteDrawing,
    toggleFavorite,
    restoreVersion,
    reset,
  };
}

// stopwatch-core.jsx
// Shared state + formatting + Gun.js real-time P2P sync.

const STORE_KEY = 'multi-stopwatch:v1';
// Unique per page-load — used to filter out our own Gun echoes
const _SESSION_ID = Math.random().toString(36).slice(2, 10);

// ─── Formatting ───────────────────────────────────────────────
function fmt(ms) {
  if (ms < 0) ms = 0;
  const cs = Math.floor(ms / 100) % 10, s = Math.floor(ms / 1000) % 60,
        m  = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
  const pad = n => String(n).padStart(2, '0');
  return (h > 0 ? `${pad(h)}:` : '') + `${pad(m)}:${pad(s)}.${cs}`;
}
function fmtCompact(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60,
        h = Math.floor(ms / 3600000);
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function fmtHuman(ms) {
  if (ms < 1000) return `${Math.max(0, Math.floor(ms / 100))}.0s`;
  const s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60,
        h = Math.floor(ms / 3600000);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Timer data ────────────────────────────────────────────────
const ACCENT_COLORS = [
  '#ff6b35', '#22d3ee', '#a3e635', '#f472b6',
  '#fbbf24', '#a78bfa', '#34d399', '#f87171',
];
const SAMPLE_NAMES = [
  'Linear Algebra · Ch. 4', 'Client Site Redesign',
  'Reading — Sapiens', 'Spanish Practice', 'Side Project',
];

function newTimer(idx = 0, name) {
  return {
    id: 'sw_' + Math.random().toString(36).slice(2, 9),
    name: name || (SAMPLE_NAMES[idx] || `Stopwatch ${idx + 1}`),
    color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
    offsetMs: 0, startedAt: null, accumMs: 0, laps: [], sessions: [],
  };
}

function elapsed(t, now) {
  return t.accumMs + t.offsetMs + (t.startedAt ? now - t.startedAt : 0);
}

function seed() {
  const a = newTimer(0, 'Linear Algebra · Ch. 4');
  a.offsetMs = 1000 * 60 * 45 + 1000 * 12;
  a.startedAt = Date.now() - 1000 * 60 * 8;
  a.laps = [
    { id: 'l1', name: 'Read 4.1', atMs: 1000 * 60 * 18 },
    { id: 'l2', name: 'Worked problems 1–6', atMs: 1000 * 60 * 38 },
  ];
  const b = newTimer(1, 'Client Site Redesign');
  b.accumMs = 1000 * 60 * 23 + 1000 * 41;
  b.laps = [
    { id: 'l3', name: 'Wireframes', atMs: 1000 * 60 * 12 },
    { id: 'l4', name: 'Color exploration', atMs: 1000 * 60 * 23 + 1000 * 41 },
  ];
  const c = newTimer(2, 'Reading — Sapiens');
  c.accumMs = 1000 * 60 * 12;
  return { timers: [a, b, c] };
}

// ─── Sync Code ────────────────────────────────────────────────
// Generates (or loads) a short room code stored in localStorage.
// Any device that enters the same code shares the same Gun.js room.
function useSyncCode() {
  const CODE_KEY = 'multi-stopwatch:sync-code';

  const makeCode = () => {
    // Unambiguous chars — no 0/O, 1/I/L confusion
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  };

  const [code, setCode] = React.useState(() => {
    try { const s = localStorage.getItem(CODE_KEY); if (s && s.length >= 4) return s; } catch {}
    const nc = makeCode();
    try { localStorage.setItem(CODE_KEY, nc); } catch {}
    return nc;
  });

  const changeCode = React.useCallback((raw) => {
    const c = String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length < 4) return false;
    try { localStorage.setItem(CODE_KEY, c); } catch {}
    setCode(c);
    return true;
  }, []);

  return { code, changeCode };
}

// ─── Gun.js connection indicator ─────────────────────────────
function useFirebaseConnected() {
  const [connected, setConnected] = React.useState(false);
  React.useEffect(() => {
    if (!window._gun) return;
    // Gun fires 'hi' when it successfully connects to a relay peer
    window._gun.on('hi', () => setConnected(true));
    // Optimistically show connected after a short delay
    // (Gun's local store works immediately even before peers respond)
    const t = setTimeout(() => setConnected(true), 1200);
    return () => clearTimeout(t);
  }, []);
  return connected;
}

// ─── Normalize helpers ────────────────────────────────────────
// Ensure a timer always has the array fields that may be missing.
function normalizeTimer(t) {
  const out = { offsetMs: 0, accumMs: 0, startedAt: null, ...t };
  if (!Array.isArray(out.laps))     out.laps = [];
  if (!Array.isArray(out.sessions)) out.sessions = [];
  return out;
}
function normalizeState(s) {
  if (!s?.timers) return null;
  return { ...s, timers: s.timers.map(normalizeTimer) };
}

// ─── Store — localStorage + optional Gun P2P sync ────────────
// roomCode: the sync code for the shared room, or null for local-only.
//
// Architecture:
//   • State is serialised to a single JSON string ("payload") so Gun's
//     deep-merge behaviour never mangles arrays or nulls.
//   • Each write stamps a "ts" (wall-clock ms). The Gun listener ignores
//     any update whose ts ≤ our own lastWriteTs, which prevents our own
//     echoed writes from creating a loop while still accepting updates
//     from other devices (which will always have a higher ts).
//   • persistRef.current is re-assigned every render so it always closes
//     over the latest roomCode without forcing the stable api to change.
function useStopwatchStore(roomCode = null) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const p = normalizeState(JSON.parse(raw)); if (p) return p; }
    } catch {}
    return seed();
  });

  // Updated every render — always has the correct roomCode in its closure.
  const persistRef = React.useRef(() => {});

  persistRef.current = (next) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
    if (roomCode && window._gun) {
      window._gun.get('mswv1').get(roomCode).put({
        payload: JSON.stringify(next),
        ts: Date.now(),
        from: _SESSION_ID,
      });
    }
  };

  // Gun real-time listener — re-attaches whenever roomCode changes.
  React.useEffect(() => {
    if (!roomCode || !window._gun) return;
    const node = window._gun.get('mswv1').get(roomCode);
    let initialLoad = true;

    const handler = (data) => {
      if (initialLoad) {
        initialLoad = false;
        // Room is empty — push our local state so other devices see it.
        if (!data || !data.payload) {
          setState(prev => {
            node.put({ payload: JSON.stringify(prev), ts: Date.now(), from: _SESSION_ID });
            return prev;
          });
          return;
        }
      }

      if (!data || !data.payload) return;

      // Ignore echoes of our own writes (Gun always echoes them back).
      if (data.from === _SESSION_ID) return;

      try {
        const parsed = normalizeState(JSON.parse(data.payload));
        if (parsed) {
          setState(parsed);
          try { localStorage.setItem(STORE_KEY, JSON.stringify(parsed)); } catch {}
        }
      } catch (e) { console.error('Gun sync parse error', e); }
    };

    node.on(handler);
    return () => node.off();
  }, [roomCode]);

  // Core write helpers — access persistRef.current at call time.
  const doUpdate = (fn) => setState(s => {
    const next = fn(s);
    persistRef.current(next);
    return next;
  });
  const update = (id, fn) => doUpdate(s => ({
    ...s, timers: s.timers.map(t => t.id === id ? { ...t, ...fn(t) } : t),
  }));

  // Stable API — created once, always uses doUpdate/update which in turn
  // use persistRef.current (always current).
  const api = React.useMemo(() => {
    const sid = () => 's_' + Math.random().toString(36).slice(2, 8);
    const lid = () => 'l_' + Math.random().toString(36).slice(2, 8);
    return {
      add()      { doUpdate(s => ({ ...s, timers: [...s.timers, newTimer(s.timers.length)] })); },
      remove(id) { doUpdate(s => ({ ...s, timers: s.timers.filter(t => t.id !== id) })); },
      rename(id, name)        { update(id, () => ({ name })); },
      setOffset(id, offsetMs) { update(id, () => ({ offsetMs })); },
      setTime(id, ms)         { update(id, () => ({ startedAt: null, accumMs: Math.max(0, ms), offsetMs: 0 })); },
      setColor(id, color)     { update(id, () => ({ color })); },
      start(id)  { update(id, t => t.startedAt ? {} : { startedAt: Date.now() }); },
      pause(id) {
        const now = Date.now();
        update(id, t => !t.startedAt ? {} : {
          startedAt: null, accumMs: t.accumMs + (now - t.startedAt),
          sessions: [...(t.sessions || []), { id: sid(), startedAt: t.startedAt, endedAt: now }],
        });
      },
      toggle(id) {
        const now = Date.now();
        update(id, t => t.startedAt
          ? { startedAt: null, accumMs: t.accumMs + (now - t.startedAt),
              sessions: [...(t.sessions || []), { id: sid(), startedAt: t.startedAt, endedAt: now }] }
          : { startedAt: now }
        );
      },
      reset(id) { update(id, () => ({ startedAt: null, accumMs: 0, offsetMs: 0, laps: [], sessions: [] })); },
      addLap(id, name) {
        const now = Date.now();
        update(id, t => ({
          laps: [...t.laps, { id: lid(), name: name || `Lap ${t.laps.length + 1}`, atMs: elapsed(t, now), recordedAt: now }],
        }));
      },
      renameLap(tid, lapId, name) {
        update(tid, t => ({ laps: t.laps.map(l => l.id === lapId ? { ...l, name } : l) }));
      },
      deleteLap(tid, lapId) {
        update(tid, t => ({ laps: t.laps.filter(l => l.id !== lapId) }));
      },
      startAll() {
        doUpdate(s => ({ ...s, timers: s.timers.map(t => t.startedAt ? t : { ...t, startedAt: Date.now() }) }));
      },
      pauseAll() {
        const now = Date.now();
        doUpdate(s => ({
          ...s, timers: s.timers.map(t => !t.startedAt ? t : {
            ...t, startedAt: null, accumMs: t.accumMs + (now - t.startedAt),
            sessions: [...(t.sessions || []), { id: sid(), startedAt: t.startedAt, endedAt: now }],
          }),
        }));
      },
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, api];
}

// ─── useNow ───────────────────────────────────────────────────
function useNow(active) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!active) return;
    let raf;
    const tick = () => { setNow(Date.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

// ─── Daily-log / session helpers ─────────────────────────────
function localDateStr(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function splitSessionDetailed(startedAt, endedAt) {
  const result = [];
  let cursor = startedAt;
  while (true) {
    const d = new Date(cursor);
    const nextMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + 86400000;
    if (endedAt <= nextMidnight) { result.push({ date: localDateStr(cursor), startMs: cursor, endMs: endedAt }); break; }
    result.push({ date: localDateStr(cursor), startMs: cursor, endMs: nextMidnight });
    cursor = nextMidnight;
  }
  return result;
}
function getSessionsByDay(sessions) {
  const map = new Map();
  for (const s of sessions) {
    for (const { date, startMs, endMs } of splitSessionDetailed(s.startedAt, s.endedAt)) {
      if (!map.has(date)) map.set(date, []);
      map.get(date).push({ startMs, endMs, ms: endMs - startMs });
    }
  }
  return map;
}
function fmtWallTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function fmtDateLabel(dateStr) {
  const todayStr = localDateStr(Date.now());
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  if (dateStr === todayStr) return 'Today';
  if (dateStr === localDateStr(yd.getTime())) return 'Yesterday';
  const d = new Date(dateStr + 'T12:00:00');
  const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
}

Object.assign(window, {
  fmt, fmtCompact, fmtHuman, ACCENT_COLORS, elapsed, newTimer,
  useStopwatchStore, useNow, useSyncCode, useFirebaseConnected,
  localDateStr, getSessionsByDay, fmtWallTime, fmtDateLabel,
});

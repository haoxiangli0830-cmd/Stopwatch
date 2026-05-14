// stopwatch-core.jsx
// Shared state, formatting, idle store. No sync/MQTT.

const STORE_KEY      = 'multi-stopwatch:v1';
const IDLE_STORE_KEY = 'multi-stopwatch:idle:v1';

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
// Format a 24h hour+minute as 12-hour AM/PM string
function fmtWindowTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Timer data ────────────────────────────────────────────────
const ACCENT_COLORS = [
  '#ff6b35', '#22d3ee', '#a3e635', '#f472b6',
  '#fbbf24', '#a78bfa', '#34d399', '#f87171',
];
const SAMPLE_NAMES = [
  'Deep Work', 'Client Project', 'Reading', 'Side Project', 'Exercise',
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
  const a = newTimer(0, 'Deep Work');
  a.accumMs = 1000 * 60 * 45 + 1000 * 12;
  const b = newTimer(1, 'Client Project');
  b.accumMs = 1000 * 60 * 23 + 1000 * 41;
  const c = newTimer(2, 'Reading');
  c.accumMs = 1000 * 60 * 12;
  return { timers: [a, b, c] };
}

// ─── Normalize helpers ────────────────────────────────────────
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

// ─── useStopwatchStore ────────────────────────────────────────
function useStopwatchStore() {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const p = normalizeState(JSON.parse(raw)); if (p) return p; }
    } catch {}
    return seed();
  });

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const persistRef = React.useRef(() => {});
  persistRef.current = (next) => {
    stateRef.current = next;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
  };

  const doUpdate = (fn) => setState(s => {
    const next = fn(s);
    persistRef.current(next);
    return next;
  });
  const update = (id, fn) => doUpdate(s => ({
    ...s, timers: s.timers.map(t => t.id === id ? { ...t, ...fn(t) } : t),
  }));

  const api = React.useMemo(() => {
    const sid = () => 's_' + Math.random().toString(36).slice(2, 8);
    const lid = () => 'l_' + Math.random().toString(36).slice(2, 8);
    return {
      add()      { doUpdate(s => ({ ...s, timers: [...s.timers, newTimer(s.timers.length)] })); },
      remove(id) { doUpdate(s => ({ ...s, timers: s.timers.filter(t => t.id !== id) })); },
      rename(id, name)    { update(id, () => ({ name })); },
      setTime(id, ms)     { update(id, () => ({ startedAt: null, accumMs: Math.max(0, ms), offsetMs: 0 })); },
      setColor(id, color) { update(id, () => ({ color })); },
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
  }, []); // eslint-disable-line

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

// ─── Date / session helpers ───────────────────────────────────
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

// Compute today's accumulated idle ms (including live session if running)
function idleElapsedToday(idleTimer, now) {
  const today = localDateStr(now);
  const live = [...(idleTimer.sessions || [])];
  if (idleTimer.startedAt) live.push({ startedAt: idleTimer.startedAt, endedAt: now });
  const byDay = getSessionsByDay(live);
  if (!byDay.has(today)) return 0;
  return byDay.get(today).reduce((a, s) => a + s.ms, 0);
}

// ─── Idle Timer Store ─────────────────────────────────────────
// Automatically tracks "not working" time within a user-set daily window.
// Stops whenever any regular stopwatch is running; resumes when all stop.
// Settings changes only take effect on the NEXT day.

const DEFAULT_IDLE_SETTINGS = {
  // Effective today
  startH: 7, startM: 0, endH: 21, endM: 0,
  // Pending — applied at midnight
  pendingStartH: 7, pendingStartM: 0, pendingEndH: 21, pendingEndM: 0,
  effectiveDate: '', // date string when current settings were last promoted
};

function useIdleStore(anyRunning) {
  const [idleState, setIdleState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(IDLE_STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.settings && p.timer) return p;
      }
    } catch {}
    return {
      settings: { ...DEFAULT_IDLE_SETTINGS },
      timer: { sessions: [], startedAt: null },
    };
  });

  const stateRef = React.useRef(idleState);
  stateRef.current = idleState;

  // doUpdate is stable — setIdleState is a stable ref from useState
  const doUpdate = React.useCallback((fn) => {
    setIdleState(s => {
      const next = fn(s);
      try { localStorage.setItem(IDLE_STORE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // At the start of each new day, promote pending → effective settings
  React.useEffect(() => {
    const today = localDateStr(Date.now());
    const s = stateRef.current;
    // If effectiveDate is empty (first use) OR it's a new day, promote
    if (s.settings.effectiveDate !== today) {
      doUpdate(prev => {
        const ps = prev.settings;
        return {
          ...prev,
          settings: {
            startH:        ps.pendingStartH ?? ps.startH,
            startM:        ps.pendingStartM ?? ps.startM,
            endH:          ps.pendingEndH   ?? ps.endH,
            endM:          ps.pendingEndM   ?? ps.endM,
            pendingStartH: ps.pendingStartH ?? ps.startH,
            pendingStartM: ps.pendingStartM ?? ps.startM,
            pendingEndH:   ps.pendingEndH   ?? ps.endH,
            pendingEndM:   ps.pendingEndM   ?? ps.endM,
            effectiveDate: today,
          },
        };
      });
    }
  }, [doUpdate]);

  // Core auto-management: start/stop idle based on running timers & time window
  React.useEffect(() => {
    const check = () => {
      const now = Date.now();
      const { settings, timer } = stateRef.current;
      const d = new Date(now);
      const winStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(),
                                 settings.startH, settings.startM, 0, 0).getTime();
      const winEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(),
                                 settings.endH,   settings.endM,   0, 0).getTime();
      const inWindow  = now >= winStart && now < winEnd;
      const shouldRun = inWindow && !anyRunning;
      const isRunning = !!timer.startedAt;

      if (shouldRun && !isRunning) {
        // Start idle
        doUpdate(s => ({ ...s, timer: { ...s.timer, startedAt: now } }));
      } else if (!shouldRun && isRunning) {
        // Stop idle — cap end at window end if we've passed it
        const endAt = (!inWindow && now > winEnd) ? winEnd : now;
        doUpdate(s => ({
          ...s,
          timer: {
            ...s.timer,
            startedAt: null,
            sessions: [...s.timer.sessions, {
              startedAt: s.timer.startedAt,
              endedAt: endAt,
            }],
          },
        }));
      }
    };

    check(); // react immediately to anyRunning change
    const id = setInterval(check, 5000); // also check every 5s for window open/close
    return () => clearInterval(id);
  }, [anyRunning, doUpdate]);

  const api = React.useMemo(() => ({
    // Save new pending window times (take effect tomorrow)
    setPending(startH, startM, endH, endM) {
      doUpdate(s => ({
        ...s,
        settings: {
          ...s.settings,
          pendingStartH: startH,
          pendingStartM: startM,
          pendingEndH:   endH,
          pendingEndM:   endM,
        },
      }));
    },
  }), [doUpdate]);

  return [idleState, api];
}

Object.assign(window, {
  fmt, fmtCompact, fmtHuman, fmtWindowTime, idleElapsedToday,
  ACCENT_COLORS, elapsed, newTimer,
  useStopwatchStore, useIdleStore, useNow,
  localDateStr, getSessionsByDay, fmtWallTime, fmtDateLabel,
  DEFAULT_IDLE_SETTINGS,
});

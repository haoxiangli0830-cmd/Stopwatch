// stopwatch-combined.jsx
// Combined flow: Home → Detail → Daily Log → Global History
// Includes automatic "Not Working" idle timer system.

const IDLE_COLOR = '#818cf8'; // indigo — distinct from all working timer accents

// ─── Gear icon ────────────────────────────────────────────────
const GearIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.4"/>
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
  </svg>
);

// ─── Time picker (for settings sheet) ────────────────────────
function TimePicker({ label, h, m, onHChange, onMChange }) {
  const selStyle = {
    flex: 1, padding: '11px 6px', background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`, borderRadius: 8,
    color: COLORS.text, fontFamily: FONT_DIGITS, fontSize: 18,
    outline: 'none', textAlign: 'center', cursor: 'pointer',
    WebkitAppearance: 'none', appearance: 'none',
  };
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <select value={h} onChange={e => onHChange(+e.target.value)} style={selStyle}>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
          ))}
        </select>
        <span style={{ color: COLORS.textMuted, fontFamily: FONT_DIGITS, fontSize: 18, flexShrink: 0 }}>:</span>
        <select value={m} onChange={e => onMChange(+e.target.value)} style={selStyle}>
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(i => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Settings Sheet ───────────────────────────────────────────
function SettingsSheet({ idleState, idleApi, onClose }) {
  const { settings } = idleState;
  const [startH, setStartH] = React.useState(settings.pendingStartH);
  const [startM, setStartM] = React.useState(settings.pendingStartM);
  const [endH,   setEndH]   = React.useState(settings.pendingEndH);
  const [endM,   setEndM]   = React.useState(settings.pendingEndM);

  const pendingChanged =
    startH !== settings.pendingStartH || startM !== settings.pendingStartM ||
    endH   !== settings.pendingEndH   || endM   !== settings.pendingEndM;

  const save = () => {
    idleApi.setPending(startH, startM, endH, endM);
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: COLORS.surface, borderRadius: '20px 20px 0 0', padding: '20px 22px', paddingBottom: 'max(36px, env(safe-area-inset-bottom))', fontFamily: FONT_UI, color: COLORS.text }}>
        <div style={{ width: 36, height: 4, background: COLORS.border, borderRadius: 2, margin: '0 auto 22px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: IDLE_COLOR }} />
          <div style={{ fontSize: 11, color: IDLE_COLOR, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Not Working · Active Hours</div>
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, marginBottom: 6 }}>Daily Window</div>
        <div style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.55, marginBottom: 22 }}>
          The "Not Working" timer runs automatically while no stopwatch is active — within this window. Changes take effect <span style={{ color: COLORS.text, fontWeight: 600 }}>tomorrow</span>.
        </div>

        {/* Today's active window — read-only pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Today's window (active)</div>
            <div style={{ fontFamily: FONT_DIGITS, fontSize: 16, color: COLORS.text }}>
              {fmtWindowTime(settings.startH, settings.startM)} — {fmtWindowTime(settings.endH, settings.endM)}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: IDLE_COLOR, background: 'rgba(129,140,248,0.12)', border: `1px solid rgba(129,140,248,0.3)`, borderRadius: 6, padding: '3px 8px', letterSpacing: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Active</div>
        </div>

        {/* Editable pending times */}
        <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>From tomorrow</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22 }}>
          <TimePicker label="Start" h={startH} m={startM} onHChange={setStartH} onMChange={setStartM} />
          <div style={{ alignSelf: 'flex-end', marginBottom: 12, color: COLORS.textMuted, fontSize: 20 }}>→</div>
          <TimePicker label="End"   h={endH}   m={endM}   onHChange={setEndH}   onMChange={setEndM} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save}
            style={{ flex: 2, padding: '13px', background: IDLE_COLOR, border: 'none', borderRadius: 10, color: '#0a0a0a', fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Save · Takes effect tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Idle Card (home screen) ──────────────────────────────────
// Shows today's accumulated "not working" time. Fully automatic — no user controls.
function IdleCard({ idleState, now, onTap }) {
  const { settings, timer } = idleState;
  const todayMs   = idleElapsedToday(timer, now);
  const isRunning = !!timer.startedAt;

  // Window boundary timestamps for today
  const d        = new Date(now);
  const winStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), settings.startH, settings.startM).getTime();
  const winEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), settings.endH,   settings.endM  ).getTime();
  const inWindow = now >= winStart && now < winEnd;

  let statusText;
  if (now < winStart)      statusText = `Starts at ${fmtWindowTime(settings.startH, settings.startM)}`;
  else if (now >= winEnd)  statusText = 'Window ended for today';
  else if (isRunning)      statusText = 'Running · accumulating idle time';
  else                     statusText = 'Paused · stopwatch is active';

  // Live elapsed for current session (not today's total — just current segment)
  const liveSessionMs = isRunning ? (now - timer.startedAt) : 0;

  return (
    <div onClick={onTap}
      style={{ margin: '0 20px 0', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${isRunning ? IDLE_COLOR : COLORS.textMuted}`, borderRadius: 12, padding: '13px 16px', cursor: 'pointer', transition: 'border-color .2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: IDLE_COLOR, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>Not Working</span>
            <span style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase', background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '1px 5px' }}>AUTO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isRunning && (
              <span style={{ width: 6, height: 6, borderRadius: 3, background: IDLE_COLOR, display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, color: COLORS.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{statusText}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FONT_DIGITS, fontSize: 22, fontWeight: 500, color: isRunning ? IDLE_COLOR : COLORS.textDim, fontVariantNumeric: 'tabular-nums', letterSpacing: -1, lineHeight: 1 }}>
            {fmtCompact(todayMs)}
          </div>
          {isRunning && liveSessionMs > 0 && (
            <div style={{ fontFamily: FONT_DIGITS, fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>+{fmtCompact(liveSessionMs)} now</div>
          )}
        </div>
      </div>
      {/* Window hint bar */}
      <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, display: 'flex', justifyContent: 'space-between' }}>
        <span>{fmtWindowTime(settings.startH, settings.startM)}</span>
        <span style={{ color: COLORS.border }}>· · · · · · · · ·</span>
        <span>{fmtWindowTime(settings.endH, settings.endM)}</span>
      </div>
    </div>
  );
}

// ─── Daily Log (per-timer) ────────────────────────────────────
function DailyLogView({ timer, now, onBack }) {
  const [exp, setExp] = React.useState(null);
  const live = [...(timer.sessions || [])];
  if (timer.startedAt) live.push({ id: '__live__', startedAt: timer.startedAt, endedAt: now });
  const byDay = getSessionsByDay(live);
  const days  = [...byDay.keys()].sort().reverse();
  const total = [...byDay.values()].flat().reduce((a, s) => a + s.ms, 0);

  return (
    <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 'var(--top-spacer,54px)', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: 6 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px 8px 6px', background: 'transparent', border: 'none', color: timer.color, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>&#8249;</span> Back
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.textMuted }}>All · {fmtCompact(total)}</div>
      </div>
      <div style={{ padding: '0 20px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>Daily Log</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{timer.name}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {days.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: COLORS.textMuted, fontSize: 14 }}>No sessions yet. Start the timer to begin tracking.</div>
        )}
        {days.map(ds => {
          const sessions = byDay.get(ds);
          const dayTotal = sessions.reduce((a, s) => a + s.ms, 0);
          const open = exp === ds;
          return (
            <div key={ds} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div onClick={() => setExp(open ? null : ds)}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDateLabel(ds)}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: FONT_DIGITS, fontSize: 16, fontWeight: 500, color: timer.color }}>{fmtCompact(dayTotal)}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 14, transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#8250;</div>
              </div>
              {open && (
                <div style={{ background: COLORS.surface, padding: '4px 20px 12px' }}>
                  {sessions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < sessions.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                      <div style={{ flex: 1, fontFamily: FONT_DIGITS, fontSize: 12, color: COLORS.textDim }}>
                        {fmtWallTime(s.startMs)} – {fmtWallTime(s.endMs)}
                      </div>
                      <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.text }}>{fmtCompact(s.ms)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Global History (working + not working) ───────────────────
function GlobalLogView({ timers, idleTimer, now, onBack }) {
  const [expandedDay, setExpandedDay] = React.useState(null);

  // Working: per-timer breakdown per day
  const workingByDay = new Map(); // date → [{ name, color, ms }]
  for (const t of timers) {
    const live = [...(t.sessions || [])];
    if (t.startedAt) live.push({ startedAt: t.startedAt, endedAt: now });
    for (const [ds, sessions] of getSessionsByDay(live)) {
      const ms = sessions.reduce((a, s) => a + s.ms, 0);
      if (!workingByDay.has(ds)) workingByDay.set(ds, []);
      workingByDay.get(ds).push({ name: t.name, color: t.color, ms });
    }
  }

  // Not Working: idle sessions per day
  const idleLive = [...((idleTimer && idleTimer.sessions) || [])];
  if (idleTimer && idleTimer.startedAt) idleLive.push({ startedAt: idleTimer.startedAt, endedAt: now });
  const idleByDay = idleLive.length ? getSessionsByDay(idleLive) : new Map();

  // Union of all days that have any data
  const allDays = [...new Set([...workingByDay.keys(), ...idleByDay.keys()])].sort().reverse();

  const grandWorking = [...workingByDay.values()].flat().reduce((a, e) => a + e.ms, 0);
  const grandIdle    = [...idleByDay.values()].flat().reduce((a, s) => a + s.ms, 0);

  return (
    <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 'var(--top-spacer,54px)', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: 6 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px 8px 6px', background: 'transparent', border: 'none', color: COLORS.text, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>&#8249;</span> Today
        </button>
      </div>

      <div style={{ padding: '0 20px 14px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>All Time</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginTop: 2 }}>History</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Working</div>
            <div style={{ fontFamily: FONT_DIGITS, fontSize: 16, color: COLORS.text, marginTop: 2 }}>{fmtCompact(grandWorking)}</div>
          </div>
          <div style={{ width: 1, background: COLORS.border, alignSelf: 'stretch' }} />
          <div>
            <div style={{ fontSize: 10, color: IDLE_COLOR, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Not Working</div>
            <div style={{ fontFamily: FONT_DIGITS, fontSize: 16, color: IDLE_COLOR, marginTop: 2 }}>{fmtCompact(grandIdle)}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {allDays.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: COLORS.textMuted, fontSize: 14 }}>No history yet. Start any timer to begin.</div>
        )}
        {allDays.map(ds => {
          const workingEntries = workingByDay.get(ds) || [];
          const idleSessions   = idleByDay.get(ds)   || [];
          const workingTotal   = workingEntries.reduce((a, e) => a + e.ms, 0);
          const idleTotal      = idleSessions.reduce((a, s) => a + s.ms, 0);
          const open           = expandedDay === ds;

          return (
            <div key={ds} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {/* Day header row */}
              <div onClick={() => setExpandedDay(open ? null : ds)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDateLabel(ds)}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    {workingTotal > 0 && (
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>
                        Working <span style={{ fontFamily: FONT_DIGITS, color: COLORS.text }}>{fmtCompact(workingTotal)}</span>
                      </span>
                    )}
                    {idleTotal > 0 && (
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>
                        Idle <span style={{ fontFamily: FONT_DIGITS, color: IDLE_COLOR }}>{fmtCompact(idleTotal)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 14, transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#8250;</div>
              </div>

              {/* Expanded content */}
              {open && (
                <div style={{ background: COLORS.surface, padding: '4px 20px 14px' }}>

                  {/* Working section */}
                  {workingEntries.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, padding: '10px 0 6px', borderBottom: `1px solid ${COLORS.border}` }}>Working</div>
                      {workingEntries.map((e, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < workingEntries.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                          <div style={{ width: 3, height: 16, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                          <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.text }}>{fmtCompact(e.ms)}</div>
                        </div>
                      ))}
                      {/* Working day total */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0 4px' }}>
                        <div style={{ fontFamily: FONT_DIGITS, fontSize: 12, color: COLORS.textMuted }}>Total working: <span style={{ color: COLORS.text }}>{fmtCompact(workingTotal)}</span></div>
                      </div>
                    </>
                  )}

                  {/* Not Working section */}
                  {idleSessions.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, color: IDLE_COLOR, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, padding: '10px 0 6px', borderBottom: `1px solid ${COLORS.border}`, borderTop: workingEntries.length > 0 ? `1px solid ${COLORS.border}` : 'none', marginTop: workingEntries.length > 0 ? 6 : 0 }}>Not Working</div>
                      {idleSessions.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: i < idleSessions.length - 1 ? `1px solid ${COLORS.border}` : 'none', gap: 12 }}>
                          <div style={{ width: 3, height: 16, borderRadius: 2, background: IDLE_COLOR, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontFamily: FONT_DIGITS, fontSize: 12, color: COLORS.textDim }}>
                            {fmtWallTime(s.startMs)} – {fmtWallTime(s.endMs)}
                          </div>
                          <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: IDLE_COLOR }}>{fmtCompact(s.ms)}</div>
                        </div>
                      ))}
                      {/* Idle day total */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0 4px' }}>
                        <div style={{ fontFamily: FONT_DIGITS, fontSize: 12, color: COLORS.textMuted }}>Total idle: <span style={{ color: IDLE_COLOR }}>{fmtCompact(idleTotal)}</span></div>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main combined component ──────────────────────────────────
function VariationCombined() {
  const [state, api]         = useStopwatchStore();
  const anyRunning           = state.timers.some(t => t.startedAt);
  const [idleState, idleApi] = useIdleStore(anyRunning);
  // RAF loop runs when any timer or the idle timer is ticking
  const anyActive = anyRunning || !!idleState.timer.startedAt;
  const now = useNow(anyActive);
  const ctrl = useController(api);

  const [nav, setNav]               = React.useState({ view: 'home', timerId: null });
  const [editingNameId, setEditingNameId] = React.useState(null);
  const [showSettings, setShowSettings]   = React.useState(false);

  const goHome   = () => setNav({ view: 'home',   timerId: null });
  const goDetail = id => setNav({ view: 'detail', timerId: id });
  const goDaily  = id => setNav({ view: 'daily',  timerId: id });
  const goGlobal = ()  => setNav({ view: 'global', timerId: null });

  const selected = state.timers.find(t => t.id === nav.timerId);

  // Today's working total across all timers
  const totalWorkingMs = state.timers.reduce((a, t) => a + elapsed(t, now), 0);
  const todayIdleMs    = idleElapsedToday(idleState.timer, now);

  // ── Home screen ──────────────────────────────────────────────
  const Home = (
    <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 'var(--top-spacer,54px)', flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '6px 20px 14px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>
              {state.timers.length} timer{state.timers.length !== 1 ? 's' : ''} · {state.timers.filter(t => t.startedAt).length} running
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Today</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSettings(true)}
                style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GearIcon size={14} />
              </button>
              <button onClick={goGlobal}
                style={{ padding: '6px 12px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                History
              </button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Working</div>
              <div style={{ fontFamily: FONT_DIGITS, fontSize: 20, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: COLORS.text }}>{fmtCompact(totalWorkingMs)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={anyRunning ? api.pauseAll : api.startAll}
            style={{ flex: 1, padding: '10px 14px', background: anyRunning ? COLORS.surface : COLORS.text, color: anyRunning ? COLORS.text : '#000', border: `1px solid ${anyRunning ? COLORS.border : COLORS.text}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {anyRunning ? '❚❚ Pause all' : '▶ Start all'}
          </button>
          <button onClick={() => api.add()}
            style={{ padding: '10px 14px', background: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Idle card — always at top */}
        <div style={{ padding: '14px 0 4px' }}>
          <IdleCard idleState={idleState} now={now} onTap={goGlobal} />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 6px' }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Working</div>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Timer rows */}
        {state.timers.map(t => {
          const ms      = elapsed(t, now);
          const running = !!t.startedAt;
          return (
            <div key={t.id} onClick={() => goDetail(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' }}>
              <div style={{ width: 3, alignSelf: 'stretch', background: t.color, borderRadius: 2, opacity: running ? 1 : 0.35 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: COLORS.textDim }}>
                  {running && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: t.color, animation: 'pulse 1.4s ease-in-out infinite' }} /> running</span>}
                  {!running && t.accumMs + t.offsetMs > 0 && <span>paused</span>}
                  {!running && !t.accumMs && !t.offsetMs && <span>idle</span>}
                  <span style={{ color: COLORS.textMuted }}>·</span>
                  <span>{t.laps.length} {t.laps.length === 1 ? 'lap' : 'laps'}</span>
                </div>
              </div>
              <div style={{ fontFamily: FONT_DIGITS, fontSize: 22, fontWeight: 500, color: running ? t.color : COLORS.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
                {fmtCompact(ms)}
              </div>
              <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => api.toggle(t.id)}
                  style={{ width: 36, height: 36, borderRadius: 18, background: running ? t.color : 'transparent', border: `1px solid ${running ? t.color : COLORS.border}`, color: running ? '#000' : COLORS.text, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                  {running ? '❚❚' : '▶'}
                </button>
                <div style={{ color: COLORS.textMuted, alignSelf: 'center', fontSize: 16 }}>&#8250;</div>
              </div>
            </div>
          );
        })}

        <button onClick={() => api.add()}
          style={{ width: '100%', padding: '20px', background: 'transparent', border: 'none', color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          + New stopwatch
        </button>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );

  // ── Detail screen ────────────────────────────────────────────
  const Detail = selected && (() => {
    const t            = selected;
    const ms           = elapsed(t, now);
    const running      = !!t.startedAt;
    const lastLapMs    = t.laps.length > 0 ? t.laps[t.laps.length - 1].atMs : 0;
    const currentLapMs = Math.max(0, ms - lastLapMs);

    return (
      <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 'var(--top-spacer,54px)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: 6 }}>
          <button onClick={goHome}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px 8px 6px', background: 'transparent', border: 'none', color: t.color, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            <span style={{ fontSize: 18 }}>&#8249;</span> Today
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => ctrl.askConfirm({ title: 'Delete stopwatch?', message: `"${t.name}" and its laps will be removed.`, confirmLabel: 'Delete', destructive: true, onConfirm: () => { api.remove(t.id); goHome(); } })}
            style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 8, fontSize: 18 }}>&#8943;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
          {/* Hero card */}
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.color, opacity: running ? 1 : 0.4 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: running ? t.color : COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: running ? t.color : COLORS.textMuted, animation: running ? 'pulse 1.4s ease-in-out infinite' : 'none' }} />
                {running ? 'Running' : (t.accumMs + t.offsetMs ? 'Paused' : 'Idle')}
              </span>
            </div>

            {editingNameId === t.id ? (
              <input autoFocus defaultValue={t.name}
                onBlur={e => { api.rename(t.id, e.target.value || t.name); setEditingNameId(null); }}
                onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontFamily: FONT_UI, fontSize: 20, fontWeight: 700, letterSpacing: -0.4, padding: 0 }} />
            ) : (
              <div onClick={() => setEditingNameId(t.id)}
                style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2, cursor: 'text' }}>{t.name}</div>
            )}

            <div style={{ marginTop: 14, padding: '8px 12px', background: COLORS.surface2, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Current lap</span>
              <Digits ms={currentLapMs} size={20} color={running ? t.color : COLORS.textDim} />
            </div>

            <div style={{ padding: '20px 0 10px', textAlign: 'center' }}>
              <Digits ms={ms} size={62} color={running ? t.color : COLORS.text} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 18px', fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>
              <span>{t.accumMs + t.offsetMs > 0 ? `Saved · ${fmtCompact(t.accumMs + t.offsetMs)}` : 'Fresh'}</span>
              <span>{t.laps.length} {t.laps.length === 1 ? 'Lap' : 'Laps'}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => api.toggle(t.id)}
                style={{ flex: 2, padding: '14px', background: running ? COLORS.surface2 : t.color, color: running ? COLORS.text : '#000', border: running ? `1px solid ${COLORS.border}` : 'none', borderRadius: 12, fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>
                {running ? '❚❚ PAUSE' : (t.accumMs || t.offsetMs ? '▶ RESUME' : '▶ START')}
              </button>
              <button onClick={() => ctrl.requestLap(t, Date.now())} disabled={!running}
                style={{ flex: 1, padding: '14px', background: 'transparent', color: running ? COLORS.text : COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 12, fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, letterSpacing: 0.4, cursor: running ? 'pointer' : 'not-allowed' }}>
                &#9873; LAP
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => ctrl.requestSetTime(t, Date.now())}
                style={{ flex: 1, padding: '10px', background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Set time</button>
              <button onClick={() => goDaily(t.id)}
                style={{ flex: 1, padding: '10px', background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Daily Log</button>
              <button onClick={() => ctrl.askConfirm({ title: 'Reset stopwatch?', message: `This will clear the time and all laps for "${t.name}".`, confirmLabel: 'Reset', destructive: true, onConfirm: () => api.reset(t.id) })}
                style={{ flex: 1, padding: '10px', background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Reset</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 2px 0', borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginRight: 'auto' }}>Color</span>
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => api.setColor(t.id, c)}
                  style={{ width: 16, height: 16, borderRadius: 8, background: c, border: c === t.color ? `2px solid ${COLORS.text}` : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Laps */}
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 10px' }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Laps</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.6 }}>name · split · total</div>
            </div>
            {t.laps.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 12 }}>
                {running ? 'Tap LAP to record what you finished.' : 'No laps yet.'}
              </div>
            ) : (
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {[...t.laps].reverse().map((l, ri) => {
                  const i     = t.laps.length - 1 - ri;
                  const prev  = i === 0 ? 0 : t.laps[i - 1].atMs;
                  const delta = l.atMs - prev;
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: ri === t.laps.length - 1 ? 'none' : `1px solid ${COLORS.border}` }}>
                      <div style={{ fontFamily: FONT_DIGITS, fontSize: 11, color: COLORS.textMuted, width: 24 }}>{String(i + 1).padStart(2, '0')}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                      <div style={{ fontFamily: FONT_DIGITS, fontSize: 12, color: t.color, fontWeight: 500 }}>+{fmtHuman(delta)}</div>
                      <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.text, minWidth: 60, textAlign: 'right' }}>{fmtCompact(l.atMs)}</div>
                      <button onClick={() => api.deleteLap(t.id, l.id)} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 4, fontSize: 12 }}>&#10005;</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })();

  // ── Navigation shell ─────────────────────────────────────────
  const atHome   = nav.view === 'home';
  const atDetail = nav.view === 'detail';
  const atDaily  = nav.view === 'daily';
  const atGlobal = nav.view === 'global';

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Home */}
      <div style={{ position: 'absolute', inset: 0, transform: (!atHome && !atGlobal) ? 'translateX(-30%)' : 'translateX(0)', opacity: (!atHome && !atGlobal) ? 0.4 : (atGlobal ? 0 : 1), transition: 'transform .28s cubic-bezier(.2,.7,.3,1), opacity .28s', pointerEvents: atHome ? 'auto' : 'none' }}>
        {Home}
      </div>
      {/* Detail */}
      <div style={{ position: 'absolute', inset: 0, transform: atDetail ? 'translateX(0)' : atDaily ? 'translateX(-30%)' : 'translateX(100%)', opacity: atDaily ? 0.4 : 1, transition: 'transform .28s cubic-bezier(.2,.7,.3,1), opacity .28s', boxShadow: (atDetail || atDaily) ? '-8px 0 24px rgba(0,0,0,0.3)' : 'none', pointerEvents: atDetail ? 'auto' : 'none' }}>
        {Detail}
      </div>
      {/* Daily Log */}
      <div style={{ position: 'absolute', inset: 0, transform: atDaily ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s cubic-bezier(.2,.7,.3,1)', boxShadow: atDaily ? '-8px 0 24px rgba(0,0,0,0.3)' : 'none' }}>
        {selected && <DailyLogView timer={selected} now={now} onBack={() => goDetail(selected.id)} />}
      </div>
      {/* Global History */}
      <div style={{ position: 'absolute', inset: 0, transform: atGlobal ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s cubic-bezier(.2,.7,.3,1)', boxShadow: atGlobal ? '-8px 0 24px rgba(0,0,0,0.3)' : 'none' }}>
        <GlobalLogView timers={state.timers} idleTimer={idleState.timer} now={now} onBack={goHome} />
      </div>

      <ControllerOverlays ctrl={ctrl} />
      {showSettings && <SettingsSheet idleState={idleState} idleApi={idleApi} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

Object.assign(window, { VariationCombined });

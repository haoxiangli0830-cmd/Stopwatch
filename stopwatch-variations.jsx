// stopwatch-variations.jsx
// Two designs sharing useStopwatchStore — both render inside an iOS frame.
//
// Variation A (List):  vertical rows, expand-to-show-laps, dense
// Variation B (Cards): hero card per timer, horizontal swipe between them
//
// Aesthetic: stark dark mono. JetBrains Mono digits, Inter UI. Single accent
// per timer (user-pickable from a small swatch palette). No gradients.

const COLORS = {
  bg:        '#0a0a0a',
  surface:   '#141414',
  surface2:  '#1c1c1c',
  border:    '#262626',
  text:      '#f5f5f5',
  textDim:   '#a3a3a3',
  textMuted: '#525252',
  danger:    '#ef4444',
};

const FONT_DIGITS = '"JetBrains Mono", "SF Mono", ui-monospace, monospace';
const FONT_UI = '"Inter", -apple-system, system-ui, sans-serif';

// ─────────────────────────────────────────────────────────────
// Tiny shared atoms
// ─────────────────────────────────────────────────────────────
function Digits({ ms, size = 56, dim, color = COLORS.text }) {
  // split into main + cs so the centisecond is visually quieter — keeps
  // attention on min/sec while still showing motion.
  const cs = Math.floor(ms / 100) % 10;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  const main = (h > 0 ? `${pad(h)}:` : '') + `${pad(m)}:${pad(s)}`;
  return (
    <span style={{ fontFamily: FONT_DIGITS, fontWeight: 500, fontSize: size, letterSpacing: -size * 0.04, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: dim ? 0.55 : 1 }}>
      {main}<span style={{ fontSize: size * 0.5, color: COLORS.textDim, marginLeft: size * 0.06 }}>.{cs}</span>
    </span>
  );
}

function IconBtn({ children, onClick, size = 36, color = COLORS.text, bg = 'transparent', border = COLORS.border, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: size, height: size, borderRadius: size / 2, background: bg, border: `1px solid ${border}`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'background .12s, border-color .12s' }}>
      {children}
    </button>
  );
}

// SVG glyphs
const Play = ({ size = 14, fill = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill={fill}><path d="M3 1.5l9 5.5-9 5.5z"/></svg>
);
const Pause = ({ size = 14, fill = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill={fill}><rect x="3" y="2" width="3" height="10" rx="0.5"/><rect x="8" y="2" width="3" height="10" rx="0.5"/></svg>
);
const Flag = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13V2M3 2.5h7l-1.5 2.5L10 8H3"/></svg>
);
const Plus = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
);
const Chevron = ({ size = 12, color = 'currentColor', dir = 'down' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === 'up' ? 'rotate(180deg)' : 'none' }}><path d="M2 4l4 4 4-4"/></svg>
);
const Trash = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"><path d="M2 3.5h9M5 3V2h3v1M3.5 3.5l.5 8h5l.5-8M5.5 5.5v4M7.5 5.5v4"/></svg>
);
const Dot = ({ color, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block' }} />
);

// ─────────────────────────────────────────────────────────────
// Lap-name modal (used by both variations).
// Pops up after the lap button is pressed; the lap's atMs is captured at
// press-time, the user names it, then it's committed.
// ─────────────────────────────────────────────────────────────
function LapModal({ open, defaultName, suggestedTime, accent, onConfirm, onCancel }) {
  const [name, setName] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      setName('');
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div onClick={onCancel}
      style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 28px', fontFamily: FONT_UI, color: COLORS.text }}>
        <div style={{ width: 36, height: 4, background: COLORS.border, borderRadius: 2, margin: '-8px auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Name this lap</div>
          <Digits ms={suggestedTime} size={18} color={accent} />
        </div>
        <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(name || defaultName); if (e.key === 'Escape') onCancel(); }}
          placeholder={defaultName}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, fontFamily: FONT_UI, fontSize: 16, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(name || defaultName)} style={{ flex: 2, padding: '12px', background: accent, border: 'none', borderRadius: 10, color: '#000', fontFamily: FONT_UI, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Save lap</button>
        </div>
      </div>
    </div>
  );
}

// Set-time editor — overwrites the timer's elapsed display directly. Works
// whether the timer is running, paused, or fresh. Pauses on confirm so the
// user can decide when to resume from the new value.
function SetTimeSheet({ open, current, accent, timerName, isRunning, onConfirm, onCancel }) {
  const [h, setH] = React.useState(0);
  const [m, setM] = React.useState(0);
  const [s, setS] = React.useState(0);
  React.useEffect(() => {
    if (open) {
      setH(Math.floor(current / 3600000));
      setM(Math.floor(current / 60000) % 60);
      setS(Math.floor(current / 1000) % 60);
    }
  }, [open, current]);
  if (!open) return null;
  const NumField = ({ value, onChange, label, max }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <input type="number" min={0} max={max} value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.max(0, Math.min(max, +e.target.value || 0)))}
        style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '14px 0', background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, fontFamily: FONT_DIGITS, fontSize: 28, fontWeight: 500, outline: 'none' }} />
      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
    </div>
  );
  return (
    <div onClick={onCancel}
      style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, borderRadius: '20px 20px 0 0', padding: '20px 20px 28px', fontFamily: FONT_UI, color: COLORS.text }}>
        <div style={{ width: 36, height: 4, background: COLORS.border, borderRadius: 2, margin: '-8px auto 14px' }} />
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Set time</div>
        <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>Set the timer to an exact value. {isRunning ? 'It will pause — resume when you\u2019re ready.' : 'Tap resume after to continue from here.'}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NumField value={h} onChange={setH} label="hours" max={99} />
          <NumField value={m} onChange={setM} label="minutes" max={59} />
          <NumField value={s} onChange={setS} label="seconds" max={59} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(h * 3600000 + m * 60000 + s * 1000)}
            style={{ flex: 2, padding: '12px', background: accent, border: 'none', borderRadius: 10, color: '#000', fontFamily: FONT_UI, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Set time</button>
        </div>
      </div>
    </div>
  );
}

// Confirm dialog — replaces window.confirm() with on-brand UI.
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', destructive, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={onCancel}
      style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 320, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 22, fontFamily: FONT_UI, color: COLORS.text, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: COLORS.textDim, lineHeight: 1.4, marginBottom: 18 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, fontFamily: FONT_UI, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', background: destructive ? COLORS.danger : COLORS.text, border: 'none', borderRadius: 10, color: destructive ? '#fff' : '#000', fontFamily: FONT_UI, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared "controller" — both variations call useController to get a
// consistent set of handlers + the modal elements. Keeps state for
// pending lap / offset editor / which timer's expanded.
// ─────────────────────────────────────────────────────────────
function useController(api) {
  const [pendingLap, setPendingLap] = React.useState(null);
  const [editingTime, setEditingTime] = React.useState(null);
  const [confirmState, setConfirmState] = React.useState(null);

  const requestLap = (timer, now) => {
    const atMs = (window.elapsed ? window.elapsed(timer, now) : 0);
    setPendingLap({ timerId: timer.id, atMs, accent: timer.color, defaultName: `Lap ${timer.laps.length + 1}` });
  };
  const confirmLap = (name) => { if (pendingLap) { api.addLap(pendingLap.timerId, name); setPendingLap(null); } };

  // "Set time" — opens a sheet pre-filled with the timer's current elapsed.
  const requestSetTime = (timer, now) => {
    const cur = (window.elapsed ? window.elapsed(timer, now) : 0);
    setEditingTime({ timerId: timer.id, current: cur, accent: timer.color, name: timer.name, isRunning: !!timer.startedAt });
  };
  const confirmSetTime = (ms) => { api.setTime(editingTime.timerId, ms); setEditingTime(null); };

  // Generic confirm. confirmState shape: { title, message, confirmLabel, destructive, onConfirm }
  const askConfirm = (cfg) => setConfirmState(cfg);
  const closeConfirm = () => setConfirmState(null);

  return {
    pendingLap, requestLap, confirmLap, cancelLap: () => setPendingLap(null),
    editingTime, requestSetTime, confirmSetTime, cancelSetTime: () => setEditingTime(null),
    confirmState, askConfirm, closeConfirm,
  };
}

// Helpers used by all variations to render the controller's overlays.
function ControllerOverlays({ ctrl }) {
  return (
    <>
      <LapModal open={!!ctrl.pendingLap} accent={ctrl.pendingLap?.accent} suggestedTime={ctrl.pendingLap?.atMs} defaultName={ctrl.pendingLap?.defaultName} onConfirm={ctrl.confirmLap} onCancel={ctrl.cancelLap} />
      <SetTimeSheet open={!!ctrl.editingTime} accent={ctrl.editingTime?.accent} current={ctrl.editingTime?.current || 0} timerName={ctrl.editingTime?.name} isRunning={!!ctrl.editingTime?.isRunning} onConfirm={ctrl.confirmSetTime} onCancel={ctrl.cancelSetTime} />
      <ConfirmDialog open={!!ctrl.confirmState} title={ctrl.confirmState?.title} message={ctrl.confirmState?.message} confirmLabel={ctrl.confirmState?.confirmLabel} destructive={ctrl.confirmState?.destructive} onConfirm={() => { ctrl.confirmState?.onConfirm(); ctrl.closeConfirm(); }} onCancel={ctrl.closeConfirm} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// VARIATION A — "List"
// Vertical stack of compact rows. Tap a row to expand laps inline.
// Big sticky header has master start/pause-all.
// ─────────────────────────────────────────────────────────────
function VariationList() {
  const [state, api] = useStopwatchStore();
  const anyRunning = state.timers.some((t) => t.startedAt);
  const now = useNow(anyRunning);
  const ctrl = useController(api);
  const [expandedId, setExpandedId] = React.useState(null);
  const [editingNameId, setEditingNameId] = React.useState(null);

  // Total tracked across all timers — small badge in header
  const totalMs = state.timers.reduce((a, t) => a + elapsed(t, now), 0);

  const startAll = () => api.startAll();
  const pauseAll = () => api.pauseAll();

  return (
    <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* status bar spacer */}
      <div style={{ height: 54, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '6px 20px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>{state.timers.length} timers</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Today</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
            <div style={{ fontFamily: FONT_DIGITS, fontSize: 22, fontWeight: 500, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalMs)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={anyRunning ? pauseAll : startAll}
            style={{ flex: 1, padding: '10px 14px', background: anyRunning ? COLORS.surface : COLORS.text, color: anyRunning ? COLORS.text : '#000', border: `1px solid ${anyRunning ? COLORS.border : COLORS.text}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: 0.2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {anyRunning ? <Pause size={11}/> : <Play size={11}/>}
            {anyRunning ? 'Pause all' : 'Start all'}
          </button>
          <button onClick={() => api.add()}
            style={{ padding: '10px 14px', background: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={12}/> Add
          </button>
        </div>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state.timers.map((t) => {
          const ms = elapsed(t, now);
          const running = !!t.startedAt;
          const expanded = expandedId === t.id;
          return (
            <div key={t.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div onClick={() => setExpandedId(expanded ? null : t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}>
                {/* color rail */}
                <div style={{ width: 3, alignSelf: 'stretch', background: t.color, borderRadius: 2, opacity: running ? 1 : 0.35 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingNameId === t.id ? (
                    <input autoFocus defaultValue={t.name}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => { api.rename(t.id, e.target.value || t.name); setEditingNameId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontFamily: FONT_UI, fontSize: 15, fontWeight: 600, padding: 0 }} />
                  ) : (
                    <div onClick={(e) => { e.stopPropagation(); setEditingNameId(t.id); }}
                      style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: COLORS.textDim }}>
                    {running && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: t.color, animation: 'pulse 1.4s ease-in-out infinite' }} /> running</span>}
                    {!running && t.accumMs + t.offsetMs > 0 && <span>paused</span>}
                    {!running && !t.accumMs && !t.offsetMs && <span>idle</span>}
                    <span style={{ color: COLORS.textMuted }}>·</span>
                    <span>{t.laps.length} {t.laps.length === 1 ? 'lap' : 'laps'}</span>
                  </div>
                </div>
                <Digits ms={ms} size={26} color={running ? t.color : COLORS.text} />
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                  <IconBtn size={36} bg={running ? t.color : 'transparent'} border={running ? t.color : COLORS.border} color={running ? '#000' : COLORS.text} onClick={() => api.toggle(t.id)} title={running ? 'Pause' : 'Start'}>
                    {running ? <Pause size={11}/> : <Play size={11}/>}
                  </IconBtn>
                  <IconBtn size={36} onClick={() => ctrl.requestLap(t, Date.now())} title="Lap">
                    <Flag size={13} color={running ? COLORS.text : COLORS.textMuted} />
                  </IconBtn>
                </div>
              </div>

              {/* Expanded panel: laps + offset */}
              {expanded && (
                <div style={{ padding: '0 20px 18px', background: COLORS.surface }}>
                  {/* offset row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Pre-existing time</div>
                      <div style={{ fontFamily: FONT_DIGITS, fontSize: 16, marginTop: 2, color: t.offsetMs ? COLORS.text : COLORS.textDim }}>{t.offsetMs ? fmtCompact(t.offsetMs) : '—'}</div>
                    </div>
                    <button onClick={() => ctrl.requestOffset(t)}
                      style={{ padding: '8px 12px', background: 'transparent', color: t.color, border: `1px solid ${t.color}`, borderRadius: 8, fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t.offsetMs ? 'Edit offset' : 'Set offset'}
                    </button>
                  </div>

                  {/* color picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginRight: 'auto' }}>Color</div>
                    {ACCENT_COLORS.map((c) => (
                      <button key={c} onClick={() => api.setColor(t.id, c)}
                        style={{ width: 18, height: 18, borderRadius: 9, background: c, border: c === t.color ? `2px solid ${COLORS.text}` : '2px solid transparent', cursor: 'pointer', padding: 0, boxShadow: c === t.color ? `0 0 0 1px ${COLORS.bg} inset` : 'none' }} />
                    ))}
                  </div>

                  {/* laps list */}
                  {t.laps.length === 0 ? (
                    <div style={{ padding: '18px 0 8px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No laps yet — tap the flag to record one.</div>
                  ) : (
                    <div style={{ paddingTop: 8 }}>
                      {t.laps.map((l, i) => {
                        const prev = i === 0 ? 0 : t.laps[i - 1].atMs;
                        const delta = l.atMs - prev;
                        return (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === t.laps.length - 1 ? 'none' : `1px solid ${COLORS.border}` }}>
                            <div style={{ fontFamily: FONT_DIGITS, fontSize: 11, color: COLORS.textMuted, width: 22 }}>{String(i + 1).padStart(2, '0')}</div>
                            <div style={{ flex: 1, fontSize: 14 }}>{l.name}</div>
                            <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.textDim }}>+{fmtHuman(delta)}</div>
                            <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.text, minWidth: 56, textAlign: 'right' }}>{fmtCompact(l.atMs)}</div>
                            <button onClick={() => api.deleteLap(t.id, l.id)} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 4 }}><Trash size={12}/></button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* footer actions */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 14 }}>
                    <button onClick={() => api.reset(t.id)}
                      style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Reset</button>
                    <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) api.remove(t.id); }}
                      style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.danger, fontFamily: FONT_UI, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* add row at end */}
        <button onClick={() => api.add()}
          style={{ width: '100%', padding: '20px', background: 'transparent', border: 'none', borderBottom: `1px dashed ${COLORS.border}`, color: COLORS.textDim, fontFamily: FONT_UI, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={12}/> New stopwatch
        </button>
        <div style={{ height: 40 }} />
      </div>

      <ControllerOverlays ctrl={ctrl} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VARIATION B — "Cards"
// Hero card per timer, swipe horizontally to switch. Each card has the
// timer's full state: massive digits, controls, lap list inline. Tabs
// at top showing all timers.
// ─────────────────────────────────────────────────────────────
function VariationCards() {
  const [state, api] = useStopwatchStore();
  const anyRunning = state.timers.some((t) => t.startedAt);
  const now = useNow(anyRunning);
  const ctrl = useController(api);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [editingNameId, setEditingNameId] = React.useState(null);
  const idx = Math.min(activeIdx, Math.max(0, state.timers.length - 1));
  const t = state.timers[idx];

  if (!t) {
    return (
      <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ color: COLORS.textDim }}>No timers yet</div>
        <button onClick={() => api.add()} style={{ padding: '12px 20px', background: COLORS.text, color: '#000', border: 'none', borderRadius: 10, fontFamily: FONT_UI, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ New stopwatch</button>
      </div>
    );
  }

  const ms = elapsed(t, now);
  const running = !!t.startedAt;

  return (
    <div style={{ height: '100%', background: COLORS.bg, color: COLORS.text, fontFamily: FONT_UI, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* status bar spacer */}
      <div style={{ height: 54, flexShrink: 0 }} />

      {/* Tab strip — all timers as pills */}
      <div style={{ padding: '8px 16px 14px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {state.timers.map((tt, i) => {
          const active = i === idx;
          const ttRunning = !!tt.startedAt;
          return (
            <button key={tt.id} onClick={() => setActiveIdx(i)}
              style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 100, background: active ? COLORS.surface : 'transparent', border: `1px solid ${active ? COLORS.border : 'transparent'}`, color: active ? COLORS.text : COLORS.textDim, fontFamily: FONT_UI, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 160 }}>
              <Dot color={ttRunning ? tt.color : COLORS.textMuted} size={6} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tt.name}</span>
            </button>
          );
        })}
        <button onClick={() => { api.add(); setActiveIdx(state.timers.length); }}
          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 16, background: 'transparent', border: `1px dashed ${COLORS.border}`, color: COLORS.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={12}/>
        </button>
      </div>

      {/* Hero card */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '24px 22px 20px', position: 'relative', overflow: 'hidden' }}>
          {/* corner color bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.color, opacity: running ? 1 : 0.4 }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: running ? t.color : COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: running ? t.color : COLORS.textMuted, animation: running ? 'pulse 1.4s ease-in-out infinite' : 'none' }} />
                  {running ? 'Running' : (t.accumMs + t.offsetMs ? 'Paused' : 'Idle')}
                </span>
              </div>
              {editingNameId === t.id ? (
                <input autoFocus defaultValue={t.name}
                  onBlur={(e) => { api.rename(t.id, e.target.value || t.name); setEditingNameId(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontFamily: FONT_UI, fontSize: 20, fontWeight: 700, letterSpacing: -0.4, padding: 0 }} />
              ) : (
                <div onClick={() => setEditingNameId(t.id)}
                  style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2, cursor: 'text' }}>{t.name}</div>
              )}
            </div>
            <button onClick={() => ctrl.askConfirm({ title: 'Delete stopwatch?', message: `“${t.name}” and its laps will be removed.`, confirmLabel: 'Delete', destructive: true, onConfirm: () => api.remove(t.id) })}
              style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 6, marginRight: -6, marginTop: -6 }}><Trash size={14}/></button>
          </div>

          {/* Big digits */}
          <div style={{ padding: '28px 0 10px', textAlign: 'center' }}>
            <Digits ms={ms} size={62} color={running ? t.color : COLORS.text} />
          </div>

          {/* meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 18px', fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>
            <span>Offset · {t.offsetMs ? fmtCompact(t.offsetMs) : '—'}</span>
            <span>{t.laps.length} {t.laps.length === 1 ? 'Lap' : 'Laps'}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => api.toggle(t.id)}
              style={{ flex: 2, padding: '14px', background: running ? COLORS.surface2 : t.color, color: running ? COLORS.text : '#000', border: running ? `1px solid ${COLORS.border}` : 'none', borderRadius: 12, fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {running ? <><Pause size={12}/> PAUSE</> : <><Play size={12}/> {t.accumMs || t.offsetMs ? 'RESUME' : 'START'}</>}
            </button>
            <button onClick={() => ctrl.requestLap(t, Date.now())} disabled={!running}
              style={{ flex: 1, padding: '14px', background: 'transparent', color: running ? COLORS.text : COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 12, fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, letterSpacing: 0.4, cursor: running ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Flag size={12}/> LAP
            </button>
          </div>

          {/* Quick actions: offset, color, reset */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => ctrl.requestOffset(t)}
              style={{ flex: 1, padding: '10px', background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Set offset</button>
            <button onClick={() => api.reset(t.id)}
              style={{ flex: 1, padding: '10px', background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Reset</button>
          </div>

          {/* color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 2px 0', borderTop: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginRight: 'auto' }}>Color</span>
            {ACCENT_COLORS.map((c) => (
              <button key={c} onClick={() => api.setColor(t.id, c)}
                style={{ width: 16, height: 16, borderRadius: 8, background: c, border: c === t.color ? `2px solid ${COLORS.text}` : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>

        {/* Laps */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 10px' }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Laps</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.6, fontWeight: 500 }}>name · split · total</div>
          </div>
          {t.laps.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 12 }}>
              {running ? 'Tap LAP to record what you finished.' : 'No laps yet.'}
            </div>
          ) : (
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: 'hidden' }}>
              {[...t.laps].reverse().map((l, ri) => {
                const i = t.laps.length - 1 - ri; // original index
                const prev = i === 0 ? 0 : t.laps[i - 1].atMs;
                const delta = l.atMs - prev;
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: ri === t.laps.length - 1 ? 'none' : `1px solid ${COLORS.border}` }}>
                    <div style={{ fontFamily: FONT_DIGITS, fontSize: 11, color: COLORS.textMuted, width: 24 }}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                    <div style={{ fontFamily: FONT_DIGITS, fontSize: 12, color: t.color, fontWeight: 500 }}>+{fmtHuman(delta)}</div>
                    <div style={{ fontFamily: FONT_DIGITS, fontSize: 13, color: COLORS.text, minWidth: 60, textAlign: 'right' }}>{fmtCompact(l.atMs)}</div>
                    <button onClick={() => api.deleteLap(t.id, l.id)} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 4 }}><Trash size={11}/></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* master controls — small footer */}
        <div style={{ marginTop: 22, padding: '14px 16px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>All timers</div>
            <div style={{ fontSize: 13, color: COLORS.textDim, marginTop: 2 }}>{state.timers.filter((x) => x.startedAt).length} of {state.timers.length} running</div>
          </div>
          <button onClick={anyRunning ? api.pauseAll : api.startAll}
            style={{ padding: '10px 14px', background: anyRunning ? 'transparent' : COLORS.text, color: anyRunning ? COLORS.text : '#000', border: anyRunning ? `1px solid ${COLORS.border}` : 'none', borderRadius: 10, fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {anyRunning ? <><Pause size={11}/> PAUSE ALL</> : <><Play size={11}/> START ALL</>}
          </button>
        </div>
      </div>

      <ControllerOverlays ctrl={ctrl} />
    </div>
  );
}

Object.assign(window, { VariationList, VariationCards, COLORS, FONT_UI, FONT_DIGITS, ControllerOverlays, LapModal, SetTimeSheet, ConfirmDialog, Digits, useController });

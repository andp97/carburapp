// CarburApp — Design tokens & atoms
// Modern editorial-utility aesthetic. Deep anthracite + vivid orange accent.

// ───────────────────────────────────────────────────────────
// Theme — two modes. T is mutated on switch so all screens
// (which read window.T at render time) update on next render.
// ───────────────────────────────────────────────────────────
const THEMES = {
  notte: {
    bg:         '#0B0F17',
    surface:    '#131A26',
    surfaceHi:  '#1A2332',
    surfaceLo:  '#0F1521',
    border:     'rgba(255,255,255,0.06)',
    borderHi:   'rgba(255,255,255,0.10)',
    text:       '#F2F4F8',
    textSec:    '#9AA3B5',
    textTer:    '#5E6678',
    textInv:    '#0B0F17',
    scrim:      'rgba(11,15,23,0.96)',
    scrimEnd:   'rgba(11,15,23,0)',
    grabber:    'rgba(255,255,255,0.18)',
    canvasBg:   '#050810',
    ok:         '#4ADE80',
    warn:       '#F4B740',
    danger:     '#F87171',
    info:       '#6FA8FF',
    diesel:     '#6FA8FF',
    gpl:        '#4ADE80',
    metano:     '#C792FF',
  },
  giorno: {
    bg:         '#F4F6FA',
    surface:    '#FFFFFF',
    surfaceHi:  '#ECEFF5',
    surfaceLo:  '#F8FAFC',
    border:     'rgba(15,21,33,0.07)',
    borderHi:   'rgba(15,21,33,0.13)',
    text:       '#0B0F17',
    textSec:    '#5A6478',
    textTer:    '#98A0AE',
    textInv:    '#FFFFFF',
    scrim:      'rgba(244,246,250,0.96)',
    scrimEnd:   'rgba(244,246,250,0)',
    grabber:    'rgba(11,15,23,0.18)',
    canvasBg:   '#E6EAF1',
    ok:         '#16A34A',
    warn:       '#D97706',
    danger:     '#DC2626',
    info:       '#2563EB',
    diesel:     '#2563EB',
    gpl:        '#16A34A',
    metano:     '#9333EA',
  },
};

// Mutable runtime theme. Screens reference T as a free identifier
// which resolves to window.T at execution time.
const T = { ...THEMES.notte, accent: '#FF7A3D', accentDim: '', accentLine: '', benzina: '#FF7A3D' };

function applyTheme(mode, accent) {
  const m = THEMES[mode] || THEMES.notte;
  Object.assign(T, m);
  T.accent     = accent;
  T.accentDim  = accent + (mode === 'giorno' ? '1F' : '24');
  T.accentLine = accent + '48';
  T.benzina    = accent;
  // Update doc bg too so the canvas surround matches
  document.documentElement.style.background = m.canvasBg;
  document.body.style.background = m.canvasBg;
}
applyTheme('notte', '#FF7A3D');

// Typography scale
const TYPE = {
  family: '"Manrope", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono:   '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  // Tabular figures for numbers
  num:    '"Manrope", system-ui, sans-serif',
};

// ───────────────────────────────────────────────────────────
// Icon — lightweight linear icon set drawn from one path family
// ───────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) {
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'block', flexShrink: 0 }}>
      {Array.isArray(p) ? p.map((d, i) => <path key={i} d={d} />) : <path d={p} />}
    </svg>
  );
}

const ICON_PATHS = {
  fuel:       'M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5',
  car:        'M5 17h14M5 17l1.5-5.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 17M5 17v2M19 17v2M3 12h2M19 12h2M8 14h.01M16 14h.01',
  wrench:     'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4z',
  bell:       'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M9 21a3 3 0 0 0 6 0',
  chart:      'M3 21h18M7 17V11M12 17V7M17 17v-4',
  plus:       'M12 5v14M5 12h14',
  home:       'M3 12 12 3l9 9M5 10v10h14V10',
  clock:      'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
  receipt:    'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3M8 8h8M8 12h8M8 16h5',
  calendar:   'M3 8h18M3 8v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8M3 8V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3M8 3v3M16 3v3',
  filter:     'M3 5h18M6 12h12M10 19h4',
  search:     'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3',
  chevR:      'M9 6l6 6-6 6',
  chevD:      'M6 9l6 6 6-6',
  chevU:      'M18 15l-6-6-6 6',
  check:      'M5 12l5 5L20 7',
  x:          'M6 6l12 12M18 6L6 18',
  arrowUp:    'M12 19V5M5 12l7-7 7 7',
  arrowDown:  'M12 5v14M19 12l-7 7-7-7',
  trend:      'M3 17l6-6 4 4 8-8M21 7h-4M21 7v4',
  user:       'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  settings:   ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
  pin:        'M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shield:     'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  document:   'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5',
  tire:       ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z', 'M12 3v4M12 17v4M3 12h4M17 12h4'],
  oil:        'M12 3l-4 6a5 5 0 1 0 8 0l-4-6z',
  euro:       'M18 7a6 6 0 1 0 0 10M4 10h10M4 14h10',
  road:       'M6 21l3-18M18 21l-3-18M12 5v2M12 11v2M12 17v2',
  speedo:     ['M3 13a9 9 0 1 1 18 0', 'M12 13l4-4'],
  dots:       'M5 12h.01M12 12h.01M19 12h.01',
  lightning:  'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  flag:       'M5 21V4M5 4h11l-2 4 2 4H5',
};

// ───────────────────────────────────────────────────────────
// Common atoms
// ───────────────────────────────────────────────────────────
function Card({ children, style, padded = true, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      padding: padded ? 16 : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Pill({ children, tone = 'neutral', size = 'md', style }) {
  const tones = {
    neutral: { bg: 'rgba(255,255,255,0.06)', fg: T.textSec, line: 'transparent' },
    accent:  { bg: T.accentDim, fg: T.accent, line: 'transparent' },
    ok:      { bg: 'rgba(74,222,128,0.12)', fg: T.ok, line: 'transparent' },
    warn:    { bg: 'rgba(244,183,64,0.14)', fg: T.warn, line: 'transparent' },
    danger:  { bg: 'rgba(248,113,113,0.14)', fg: T.danger, line: 'transparent' },
    info:    { bg: 'rgba(111,168,255,0.14)', fg: T.info, line: 'transparent' },
  };
  const t = tones[tone] || tones.neutral;
  const sz = size === 'sm'
    ? { padding: '3px 8px', fontSize: 10.5, letterSpacing: 0.4 }
    : { padding: '5px 10px', fontSize: 11.5, letterSpacing: 0.3 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: t.bg, color: t.fg, borderRadius: 999,
      fontWeight: 600, textTransform: 'uppercase',
      ...sz, ...style,
    }}>
      {children}
    </span>
  );
}

// A consistent round icon tile used in lists
function IconTile({ name, color = T.accent, size = 40, bg }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg ?? `${color}1F`,
      color, flexShrink: 0,
    }}>
      <Icon name={name} size={size * 0.5} />
    </div>
  );
}

// Numeric display — tabular figures, tight tracking
function Num({ children, size = 28, weight = 700, color = T.text, style }) {
  return (
    <span style={{
      fontFamily: TYPE.num,
      fontFeatureSettings: '"tnum" 1, "cv11" 1',
      fontSize: size, fontWeight: weight,
      color, letterSpacing: -0.5,
      lineHeight: 1.05,
      ...style,
    }}>{children}</span>
  );
}

// Section header inside screens
function SectionHead({ title, action, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 4px', marginBottom: 10, ...style,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1.2, color: T.textTer,
      }}>{title}</div>
      {action && <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{action}</div>}
    </div>
  );
}

// Bottom tab bar (used by all main screens)
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'dash',   label: 'Riepilogo',   icon: 'home' },
    { id: 'hist',   label: 'Storico',     icon: 'receipt' },
    { id: 'add',    label: 'Aggiungi',    icon: 'plus', center: true },
    { id: 'dead',   label: 'Scadenze',    icon: 'bell' },
    { id: 'stats',  label: 'Statistiche', icon: 'chart' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 10,
      background: `linear-gradient(to top, ${T.scrim} 60%, ${T.scrimEnd})`,
      backdropFilter: 'blur(20px)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      zIndex: 5,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        if (t.center) {
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              background: T.accent, border: 'none', cursor: 'pointer',
              width: 54, height: 54, borderRadius: 18, marginTop: -18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${T.accent}55, 0 2px 0 rgba(255,255,255,0.15) inset`,
              color: '#fff',
            }}>
              <Icon name="plus" size={24} strokeWidth={2.4} />
            </button>
          );
        }
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? T.text : T.textTer,
            padding: '4px 10px',
            transition: 'color .15s',
          }}>
            <Icon name={t.icon} size={22} strokeWidth={isActive ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.2 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Vehicle selector chip used in headers
function VehicleChip({ vehicle, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: T.surfaceHi, border: `1px solid ${T.border}`,
      borderRadius: 999, padding: '5px 12px 5px 6px',
      color: T.text, cursor: 'pointer',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 7, background: T.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        <Icon name="car" size={13} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{vehicle.name}</span>
      <span style={{ fontSize: 11, color: T.textTer, fontFamily: TYPE.mono }}>{vehicle.plate}</span>
      <Icon name="chevD" size={14} color={T.textTer} />
    </button>
  );
}

// Inline sparkline (svg) — used on dashboard
function Spark({ data, w = 100, h = 28, color = T.accent }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * h]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ');
  const dFill = `${d} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sparkG-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dFill} fill={`url(#sparkG-${color})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { T, THEMES, applyTheme, TYPE, Icon, ICON_PATHS, Card, Pill, IconTile, Num, SectionHead, TabBar, VehicleChip, Spark });

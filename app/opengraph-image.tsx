import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'CarburApp — La tua auto, sotto controllo.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#0B0F17';
const SURFACE = '#131A26';
const SURFACE_HI = '#1A2332';
const ACCENT = '#FF7A3D';
const TEXT = '#F2F4F8';
const TEXT_SEC = '#9AA3B5';
const TEXT_TER = '#5E6678';
const BORDER = 'rgba(255,255,255,0.07)';
const OK = '#16A34A';
const OK_BG = 'rgba(22,163,74,0.12)';

export default async function OGImage() {
  const [bold, extrabold] = await Promise.all([
    readFile(join(process.cwd(), 'assets/Manrope-Bold.ttf')),
    readFile(join(process.cwd(), 'assets/Manrope-ExtraBold.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: BG,
          display: 'flex',
          fontFamily: 'Manrope',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            left: -100,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,122,61,0.18) 0%, transparent 70%)',
          }}
        />
        {/* Ambient glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            right: 380,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,122,61,0.10) 0%, transparent 70%)',
          }}
        />

        {/* LEFT PANEL */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px 56px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            {/* App icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5"
                  stroke="white"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
              CarburApp
            </span>
          </div>

          {/* Hero headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 62,
              fontWeight: 800,
              color: TEXT,
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              marginBottom: 20,
            }}
          >
            <span>La tua auto,</span>
            <span style={{ color: ACCENT }}>sotto controllo.</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: TEXT_SEC,
              lineHeight: 1.5,
              marginBottom: 40,
              maxWidth: 440,
            }}
          >
            Rifornimenti, spese e scadenze in un colpo d'occhio.
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['⛽  Rifornimenti', '🔧  Manutenzione', '📅  Scadenze'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  background: SURFACE_HI,
                  border: `1px solid ${BORDER}`,
                  fontSize: 14,
                  fontWeight: 700,
                  color: TEXT_SEC,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — phone mockup */}
        <div
          style={{
            width: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 48,
            paddingTop: 32,
            paddingBottom: 32,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Phone frame */}
          <div
            style={{
              width: 288,
              height: 560,
              borderRadius: 40,
              background: SURFACE,
              border: `1.5px solid rgba(255,255,255,0.12)`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Status bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px 6px',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>9:41</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div style={{ width: 14, height: 8, borderRadius: 2, background: TEXT_SEC }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: TEXT_SEC }} />
              </div>
            </div>

            {/* App content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 14px 0', gap: 10 }}>
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div
                  style={{
                    padding: '5px 10px',
                    background: SURFACE_HI,
                    borderRadius: 20,
                    border: `1px solid ${BORDER}`,
                    fontSize: 10,
                    fontWeight: 700,
                    color: TEXT,
                  }}
                >
                  Panda 🐼
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: SURFACE_HI,
                        border: `1px solid ${BORDER}`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Hero spend card */}
              <div
                style={{
                  background: SURFACE_HI,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC }}>Maggio 2026</span>
                  <div
                    style={{
                      padding: '2px 7px',
                      background: OK_BG,
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 700,
                      color: OK,
                    }}
                  >
                    ↓ 12%
                  </div>
                </div>
                <span style={{ fontSize: 30, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  €142,50
                </span>
                <span style={{ fontSize: 10, color: TEXT_TER, marginTop: 4 }}>€161,80 mese scorso</span>

                {/* Breakdown pills */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  {[
                    { label: '⛽', value: '€98', color: '#6FA8FF' },
                    { label: '🔧', value: '€44,50', color: '#F4B740' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        flex: 1,
                        background: SURFACE,
                        borderRadius: 10,
                        padding: '6px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 9, color: TEXT_TER }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last refuel card */}
              <div
                style={{
                  background: SURFACE_HI,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(111,168,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  ⛽
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Benzina · 38,4 L</span>
                  <span style={{ fontSize: 9, color: TEXT_TER }}>3 giorni fa · Eni</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>€67,20</span>
              </div>

              {/* Deadline card */}
              <div
                style={{
                  background: SURFACE_HI,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(217,119,6,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  📋
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Assicurazione</span>
                  <span style={{ fontSize: 9, color: TEXT_TER }}>Scade tra 18 giorni</span>
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    background: 'rgba(217,119,6,0.15)',
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#D97706',
                  }}
                >
                  18 gg
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '10px 0 16px',
                borderTop: `1px solid ${BORDER}`,
                background: SURFACE,
              }}
            >
              {[
                { icon: '🏠', label: 'Home', active: true },
                { icon: '📋', label: 'Storico', active: false },
                { icon: '📅', label: 'Scadenze', active: false },
                { icon: '📊', label: 'Stats', active: false },
              ].map((tab) => (
                <div
                  key={tab.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: tab.active ? 16 : 14 }}>{tab.icon}</span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: tab.active ? ACCENT : TEXT_TER,
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Manrope', data: bold, weight: 700, style: 'normal' },
        { name: 'Manrope', data: extrabold, weight: 800, style: 'normal' },
      ],
    },
  );
}

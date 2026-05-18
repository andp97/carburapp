import Link from 'next/link';

const FEATURES = [
  {
    title: 'Rifornimenti',
    desc: 'Tieni traccia di ogni rifornimento',
    rgb: '111,168,255',
    svgPath: 'M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5',
  },
  {
    title: 'Scadenze',
    desc: 'Bollo, assicurazione, revisione',
    rgb: '244,183,64',
    svgPath: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M9 21a3 3 0 0 0 6 0',
  },
  {
    title: 'Statistiche',
    desc: 'Analizza i tuoi consumi nel tempo',
    rgb: '74,222,128',
    svgPath: 'M3 21h18M7 17V11M12 17V7M17 17v-4',
  },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hero */}
      <div style={{
        flex: '1 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 40px',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,122,61,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #FF7A3D 0%, #FF5A1A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(255,122,61,0.35)',
          position: 'relative',
          zIndex: 1,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--text)',
          textAlign: 'center',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1,
        }}>
          CarburApp
        </h1>

        <p style={{
          fontSize: '17px',
          color: 'var(--text-sec)',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '280px',
          marginBottom: '48px',
          position: 'relative',
          zIndex: 1,
        }}>
          Il tracker spese auto pensato per gli italiani.{' '}
          Rifornimenti, scadenze, statistiche — tutto in un posto.
        </p>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          position: 'relative',
          zIndex: 1,
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '14px',
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: `rgba(${f.rgb},0.12)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={`rgb(${f.rgb})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.svgPath} />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '1px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{
        padding: '16px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        width: '100%',
        margin: '0 auto',
      }}>
        <Link
          href="/login"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            borderRadius: '18px',
            background: '#FF7A3D',
            color: '#fff',
            fontSize: '17px',
            fontWeight: 800,
            textDecoration: 'none',
            minHeight: '56px',
            boxShadow: '0 8px 24px rgba(255,122,61,0.4)',
          }}
        >
          Accedi
        </Link>
        <Link
          href="/register"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            borderRadius: '18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '17px',
            fontWeight: 700,
            textDecoration: 'none',
            minHeight: '56px',
          }}
        >
          Registrati gratis
        </Link>
      </div>
    </div>
  );
}

// CarburApp — Screens
// All Italian copy. Each screen returns 402×874 content.

// ───────────────────────────────────────────────────────────
// Shared header
// ───────────────────────────────────────────────────────────
function ScreenHeader({ title, vehicle, action, subtitle }) {
  return (
    <div style={{ padding: '8px 20px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <VehicleChip vehicle={vehicle} />
        {action}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, color: T.text, lineHeight: 1.05 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. ONBOARDING — single editorial intro
// ═══════════════════════════════════════════════════════════
function ScreenOnboarding({ onStart }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: T.bg,
      display: 'flex', flexDirection: 'column',
      padding: '60px 28px 40px',
    }}>
      {/* Hero number — the brand: a fuel pump abstraction */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 28 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${T.accent}55`,
            }}>
              <Icon name="fuel" size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, color: T.text }}>
              Carbur<span style={{ color: T.accent }}>App</span>
            </div>
          </div>

          {/* The hook — a big editorial stat */}
          <div style={{ fontSize: 13, color: T.textTer, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
            La tua auto, sotto controllo
          </div>
          <div style={{
            fontSize: 42, fontWeight: 800, color: T.text,
            letterSpacing: -1.4, lineHeight: 1.02,
            textWrap: 'balance',
          }}>
            Ogni litro,<br />
            ogni euro,<br />
            <span style={{ color: T.accent }}>ogni scadenza.</span>
          </div>
          <div style={{ fontSize: 15, color: T.textSec, lineHeight: 1.5, marginTop: 18, maxWidth: 320 }}>
            Tieni traccia di rifornimenti, manutenzione e bollo. Tre tocchi e hai finito.
          </div>
        </div>

        {/* Feature glance — three rows, no decoration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '4px 0' }}>
          {[
            { ic: 'fuel',    k: 'Rifornimenti',  v: 'in 3 tap' },
            { ic: 'wrench',  k: 'Manutenzione',  v: 'avvisi automatici' },
            { ic: 'shield',  k: 'Bollo & RCA',   v: 'mai più dimenticati' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 4px',
              borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
            }}>
              <IconTile name={r.ic} size={36} color={T.accent} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.text }}>{r.k}</div>
              <div style={{ fontSize: 12, color: T.textTer, fontFamily: TYPE.mono, letterSpacing: 0.3 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onStart} style={{
          width: '100%', background: T.accent, color: '#fff',
          border: 'none', borderRadius: 16, padding: '17px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          fontFamily: TYPE.family, letterSpacing: -0.1,
          boxShadow: `0 10px 28px ${T.accent}40`,
        }}>
          Aggiungi la tua prima auto
        </button>
        <button style={{
          width: '100%', background: 'transparent', color: T.textSec,
          border: 'none', padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: TYPE.family,
        }}>
          Ho già un account · Accedi
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. DASHBOARD
// ═══════════════════════════════════════════════════════════
function ScreenDashboard({ vehicle, onAddFuel }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden auto', paddingBottom: 110 }}>
      <ScreenHeader
        vehicle={vehicle}
        title="Maggio 2026"
        subtitle="Stai spendendo meno del solito."
        action={
          <button style={{
            width: 38, height: 38, borderRadius: 12, background: T.surfaceHi,
            border: `1px solid ${T.border}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer',
          }}>
            <Icon name="bell" size={18} />
          </button>
        }
      />

      <div style={{ padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Hero: spend card — big, editorial */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.textTer }}>
                  Spesa del mese
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <Num size={44} weight={800}>247,80</Num>
                  <Num size={18} weight={700} color={T.textSec}>€</Num>
                </div>
              </div>
              <Pill tone="ok" size="md">
                <Icon name="arrowDown" size={11} strokeWidth={2.4} />
                12%
              </Pill>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              {[
                { l: 'Carburante', v: '189,40', c: T.accent },
                { l: 'Manutenz.',  v: '58,40',  c: T.info },
                { l: 'Pedaggi',    v: '12,00',  c: T.textSec },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: s.c }} />
                    <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, letterSpacing: 0.3 }}>{s.l}</div>
                  </div>
                  <Num size={15} weight={700} style={{ marginTop: 4 }}>{s.v}<span style={{ color: T.textTer, fontWeight: 500 }}> €</span></Num>
                </div>
              ))}
            </div>
          </div>
          {/* Sparkline strip */}
          <div style={{ background: T.surfaceLo, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, letterSpacing: 0.4 }}>ULTIMI 6 MESI</div>
            <Spark data={[280, 312, 264, 298, 281, 248]} w={140} h={26} color={T.accent} />
          </div>
        </Card>

        {/* Two-up: consumo + autonomia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.textTer }}>Consumo medio</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
              <Num size={26} weight={800}>6,4</Num>
              <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>L/100km</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Icon name="arrowDown" size={11} color={T.ok} strokeWidth={2.4} />
              <span style={{ fontSize: 11, color: T.ok, fontWeight: 600 }}>0,3 vs aprile</span>
            </div>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.textTer }}>Autonomia</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
              <Num size={26} weight={800}>312</Num>
              <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>km</span>
            </div>
            {/* mini fuel level */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.surfaceHi, overflow: 'hidden' }}>
                <div style={{ width: '62%', height: '100%', background: T.accent }} />
              </div>
              <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>5/8</span>
            </div>
          </Card>
        </div>

        {/* Last fuel entry */}
        <div>
          <SectionHead title="Ultimo rifornimento" action="Vedi tutti" />
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconTile name="fuel" color={T.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Eni Station · Tangenziale Nord</div>
                  <Num size={15} weight={700}>62,40<span style={{ color: T.textTer, fontWeight: 500 }}> €</span></Num>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: T.textSec }}>
                    <span style={{ color: T.accent, fontWeight: 600 }}>Benzina</span> · 38,2 L · 1,634 €/L
                  </div>
                  <div style={{ fontSize: 11, color: T.textTer, fontFamily: TYPE.mono }}>12 mag · 47.218 km</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming deadlines */}
        <div>
          <SectionHead title="Prossime scadenze" action="Vedi tutte" />
          <Card padded={false}>
            <DeadlineRow icon="shield" color={T.danger} title="Assicurazione RCA" sub="Generali · Polizza n. 8472619"
              date="28 mag" days={12} urgency="danger" />
            <DeadlineRow icon="document" color={T.warn} title="Bollo auto 2026" sub="Regione Lombardia"
              date="30 giu" days={45} urgency="warn" last />
          </Card>
        </div>

        {/* Quick add row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { ic: 'wrench', l: 'Manutenzione' },
            { ic: 'receipt', l: 'Pagamento' },
            { ic: 'road',   l: 'Viaggio' },
          ].map((q, i) => (
            <button key={i} style={{
              flex: 1, background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: '12px 8px', color: T.text, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              fontFamily: TYPE.family,
            }}>
              <Icon name={q.ic} size={18} color={T.textSec} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{q.l}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeadlineRow({ icon, color, title, sub, date, days, urgency, last }) {
  const urgencyMap = { danger: 'danger', warn: 'warn', info: 'info', ok: 'ok' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <IconTile name={icon} color={color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</div>
        <div style={{ fontSize: 12, color: T.textTer, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: TYPE.num }}>{date}</div>
        <Pill tone={urgencyMap[urgency]} size="sm" style={{ marginTop: 4 }}>tra {days}g</Pill>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenOnboarding, ScreenDashboard, ScreenHeader, DeadlineRow });

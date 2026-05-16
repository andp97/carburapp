// CarburApp — Screens part 3: Scadenze (deadlines) + Statistiche (charts)

// ═══════════════════════════════════════════════════════════
// 5. SCADENZE — list with urgency badges + mini timeline
// ═══════════════════════════════════════════════════════════
function ScreenScadenze({ vehicle }) {
  const items = [
    { ic: 'shield',   col: T.danger, t: 'Assicurazione RCA', s: 'Generali · Polizza 8472619',  date: '28 mag 2026', days: 12, urgency: 'danger', amt: '742,00', kind: 'admin' },
    { ic: 'document', col: T.warn,   t: 'Bollo auto 2026',   s: 'Regione Lombardia',           date: '30 giu 2026', days: 45, urgency: 'warn',   amt: '278,40', kind: 'admin' },
    { ic: 'oil',      col: T.info,   t: 'Tagliando 50.000 km', s: 'Officina Rossi · stimato', date: '14 lug 2026', days: 59, urgency: 'info',   amt: '~ 220',  kind: 'maint' },
    { ic: 'tire',     col: T.info,   t: 'Cambio gomme estive→invernali', s: 'Promemoria stagionale', date: '01 nov 2026', days: 169, urgency: 'info', amt: '~ 80', kind: 'maint' },
    { ic: 'document', col: T.textSec, t: 'Revisione biennale', s: 'Centro Revisioni Brera',    date: '07 mag 2028', days: 720, urgency: 'ok',   amt: '~ 79',  kind: 'admin' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden auto', paddingBottom: 110 }}>
      <ScreenHeader
        vehicle={vehicle}
        title="Scadenze"
        subtitle="2 urgenti · 3 in arrivo"
        action={
          <button style={{
            width: 38, height: 38, borderRadius: 12, background: T.surfaceHi,
            border: `1px solid ${T.border}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer',
          }}>
            <Icon name="plus" size={18} />
          </button>
        }
      />

      {/* Urgent banner */}
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${T.danger}26, ${T.danger}10)`,
          border: `1px solid ${T.danger}40`,
          borderRadius: 18, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: T.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <Icon name="bell" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.danger }}>
              Tra 12 giorni
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 2 }}>L'assicurazione RCA scade</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Confronta preventivi prima del rinnovo</div>
          </div>
        </div>
      </div>

      {/* Year timeline strip */}
      <div style={{ padding: '0 20px 18px' }}>
        <SectionHead title="I prossimi 12 mesi" />
        <Card style={{ padding: '14px 14px 10px' }}>
          <YearTimeline items={items} />
        </Card>
      </div>

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        <SectionHead title="Tutte le scadenze" />
        <Card padded={false}>
          {items.map((it, i) => (
            <ScadenzaRow key={i} {...it} last={i === items.length - 1} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function ScadenzaRow({ ic, col, t, s, date, days, urgency, amt, last }) {
  const urgencyLabel = {
    danger: 'Urgente',
    warn:   'In arrivo',
    info:   'Pianificata',
    ok:     'A lungo termine',
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <IconTile name={ic} color={col} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
          <Num size={13} weight={700} color={T.textSec} style={{ flexShrink: 0 }}>{amt}<span style={{ color: T.textTer, fontWeight: 500 }}> €</span></Num>
        </div>
        <div style={{ fontSize: 12, color: T.textTer, marginTop: 2 }}>{s}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <Pill tone={urgency} size="sm">{urgencyLabel[urgency]}</Pill>
          <span style={{ fontSize: 11, color: T.textSec, fontFamily: TYPE.mono }}>{date} · tra {days}g</span>
        </div>
      </div>
    </div>
  );
}

function YearTimeline({ items }) {
  // Position items along a 0..365 day line
  const max = 365;
  return (
    <div style={{ position: 'relative', paddingTop: 8 }}>
      {/* Track */}
      <div style={{
        position: 'relative', height: 2, background: T.surfaceHi,
        marginTop: 24, marginBottom: 28, marginLeft: 4, marginRight: 4,
      }}>
        {/* Today marker */}
        <div style={{
          position: 'absolute', left: 0, top: -4, width: 2, height: 10, background: T.text,
        }} />
        <div style={{
          position: 'absolute', left: 0, top: -22,
          fontSize: 9, color: T.text, fontWeight: 700, letterSpacing: 0.4, transform: 'translateX(-50%)',
        }}>OGGI</div>

        {/* Items */}
        {items.filter(i => i.days <= max).map((it, i) => {
          const tones = { danger: T.danger, warn: T.warn, info: T.info, ok: T.ok };
          const c = tones[it.urgency];
          const pct = (it.days / max) * 100;
          return (
            <div key={i} style={{
              position: 'absolute', left: `${pct}%`, top: -5, transform: 'translateX(-50%)',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: c, border: `2px solid ${T.surface}` }} />
            </div>
          );
        })}

        {/* Month ticks */}
        {[0, 33, 66, 100].map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p}%`, top: 6, transform: 'translateX(-50%)',
            fontSize: 9, color: T.textTer, fontFamily: TYPE.mono,
          }}>
            {['mag', 'ago', 'nov', 'mag \u201927'][i]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. STATISTICHE — charts
// ═══════════════════════════════════════════════════════════
function ScreenStatistiche({ vehicle }) {
  const [range, setRange] = React.useState('6m');
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden auto', paddingBottom: 110 }}>
      <ScreenHeader
        vehicle={vehicle}
        title="Statistiche"
        subtitle="L'andamento della tua auto."
      />

      {/* Range selector */}
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{
          display: 'flex', background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 3, gap: 2,
        }}>
          {[
            { id: '3m', l: '3 mesi' },
            { id: '6m', l: '6 mesi' },
            { id: '1y', l: '1 anno' },
            { id: 'all', l: 'Sempre' },
          ].map(r => {
            const a = range === r.id;
            return (
              <button key={r.id} onClick={() => setRange(r.id)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
                background: a ? T.surfaceHi : 'transparent',
                color: a ? T.text : T.textSec,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: TYPE.family,
              }}>{r.l}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.textTer }}>Costo per km</div>
            <Num size={28} weight={800} style={{ display: 'block', marginTop: 6 }}>0,148<span style={{ color: T.textSec, fontSize: 13, fontWeight: 600 }}> €/km</span></Num>
            <Pill tone="ok" size="sm" style={{ marginTop: 8 }}>
              <Icon name="arrowDown" size={10} strokeWidth={2.4} /> 4%
            </Pill>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.textTer }}>Km percorsi</div>
            <Num size={28} weight={800} style={{ display: 'block', marginTop: 6 }}>4.218<span style={{ color: T.textSec, fontSize: 13, fontWeight: 600 }}> km</span></Num>
            <div style={{ fontSize: 11, color: T.textTer, marginTop: 8, fontFamily: TYPE.mono }}>≈ 703 km/mese</div>
          </Card>
        </div>

        {/* Spend by category — stacked bar chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Spesa per categoria</div>
            <Num size={13} weight={700} color={T.textSec}>1.642,80 €</Num>
          </div>
          <div style={{ fontSize: 11, color: T.textTer, marginBottom: 14 }}>Dicembre 2025 – Maggio 2026</div>
          <StackedBars />
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            {[
              { l: 'Carburante',  c: T.accent, v: '1.124' },
              { l: 'Manutenzione', c: T.info,   v: '278' },
              { l: 'Bollo & RCA',  c: T.warn,   v: '186' },
              { l: 'Altro',        c: T.textTer, v: '54' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{s.l}</div>
                <Num size={12} weight={700} color={T.textTer}>{s.v}€</Num>
              </div>
            ))}
          </div>
        </Card>

        {/* Consumo line chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Consumo medio</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Num size={20} weight={800} color={T.accent}>6,4</Num>
              <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>L/100km</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.textTer, marginBottom: 10 }}>Sotto la media nazionale di 7,1 L/100km</div>
          <ConsumoLineChart />
        </Card>

        {/* Distributors */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Distributori più usati</div>
            <span style={{ fontSize: 11, color: T.textTer }}>12 rifornimenti</span>
          </div>
          {[
            { n: 'Eni Station · Tangenziale Nord', v: 5, p: '1,628' },
            { n: 'Q8 · Milano Est',                 v: 4, p: '1,612' },
            { n: 'IP · A4 Bergamo',                 v: 2, p: '1,694' },
            { n: 'Tamoil · Tangenziale Sud',       v: 1, p: '1,678' },
          ].map((d, i) => (
            <div key={i} style={{ marginTop: i === 0 ? 0 : 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{d.n}</div>
                <div style={{ fontSize: 11, color: T.textTer, fontFamily: TYPE.mono }}>{d.p} €/L medio</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surfaceHi, overflow: 'hidden' }}>
                  <div style={{ width: `${(d.v / 5) * 100}%`, height: '100%', background: T.accent }} />
                </div>
                <Num size={11} weight={700} color={T.textSec} style={{ minWidth: 18, textAlign: 'right' }}>{d.v}×</Num>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// Stacked bar chart — categories per month
function StackedBars() {
  const months = [
    { l: 'DIC', vals: [180, 38, 0,  10] },
    { l: 'GEN', vals: [195, 0,  186, 8] },
    { l: 'FEB', vals: [172, 65, 0,  12] },
    { l: 'MAR', vals: [201, 0,  0,  14] },
    { l: 'APR', vals: [188, 189, 0, 10] },
    { l: 'MAG', vals: [189, 58, 0,  0]  },
  ];
  const cols = [T.accent, T.info, T.warn, T.textTer];
  const max = Math.max(...months.map(m => m.vals.reduce((a, b) => a + b, 0)));

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8, height: 140,
    }}>
      {months.map((m, i) => {
        const total = m.vals.reduce((a, b) => a + b, 0);
        const h = (total / max) * 130;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: '100%', height: h, borderRadius: 6, overflow: 'hidden',
              display: 'flex', flexDirection: 'column-reverse',
              background: T.surfaceHi,
            }}>
              {m.vals.map((v, vi) => (
                v > 0 ? <div key={vi} style={{ height: `${(v / total) * 100}%`, background: cols[vi] }} /> : null
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: i === months.length - 1 ? T.text : T.textTer, letterSpacing: 0.5 }}>{m.l}</div>
          </div>
        );
      })}
    </div>
  );
}

// Line chart for consumo
function ConsumoLineChart() {
  const data = [6.8, 6.9, 6.6, 6.7, 6.5, 6.4];
  const labels = ['DIC', 'GEN', 'FEB', 'MAR', 'APR', 'MAG'];
  const w = 320, h = 110, pad = 8;
  const max = 7.2, min = 6.2;
  const step = (w - pad * 2) / (data.length - 1);
  const y = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const pts = data.map((v, i) => [pad + i * step, y(v)]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ');
  const dFill = `${d} L${pts[pts.length-1][0]} ${h} L${pad} ${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="consG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={T.accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Gridlines */}
        {[6.5, 7.0].map((g, i) => (
          <g key={i}>
            <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke={T.border} strokeDasharray="2 4" />
            <text x={w - pad + 2} y={y(g) + 3} fill={T.textTer} fontSize="9" fontFamily={TYPE.mono}>{g}</text>
          </g>
        ))}
        <path d={dFill} fill="url(#consG)" />
        <path d={d} fill="none" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5}
            fill={i === pts.length - 1 ? T.accent : T.bg}
            stroke={T.accent} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: `0 ${pad}px` }}>
        {labels.map((l, i) => (
          <div key={i} style={{
            fontSize: 10, fontWeight: 700,
            color: i === labels.length - 1 ? T.text : T.textTer, letterSpacing: 0.4,
          }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenScadenze, ScadenzaRow, YearTimeline, ScreenStatistiche, StackedBars, ConsumoLineChart });

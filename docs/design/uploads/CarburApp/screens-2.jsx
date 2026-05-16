// CarburApp — Screens part 2: Storico, Aggiungi rifornimento, Scadenze, Statistiche

// ═══════════════════════════════════════════════════════════
// 3. STORICO — filterable expense history
// ═══════════════════════════════════════════════════════════
function ScreenStorico({ vehicle }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all',   label: 'Tutto' },
    { id: 'fuel',  label: 'Carburante' },
    { id: 'maint', label: 'Manutenzione' },
    { id: 'admin', label: 'Bollo & RCA' },
    { id: 'other', label: 'Altro' },
  ];

  const groups = [
    {
      label: 'Questa settimana', total: '127,40',
      items: [
        { d: '15 mag', day: 'GIO', cat: 'fuel',  ic: 'fuel',   col: T.accent,  t: 'Eni Station',         s: 'Benzina · 38,2 L',     amt: '62,40', km: '47.218' },
        { d: '13 mag', day: 'MAR', cat: 'maint', ic: 'wrench', col: T.info,    t: 'Officina Rossi',      s: 'Cambio pasticche freni',amt: '65,00', km: '47.094' },
      ],
    },
    {
      label: 'Settimana scorsa', total: '184,90',
      items: [
        { d: '09 mag', day: 'VEN', cat: 'fuel',  ic: 'fuel',   col: T.accent,  t: 'Q8 · Milano Est',     s: 'Benzina · 41,1 L',     amt: '68,20', km: '46.871' },
        { d: '07 mag', day: 'MER', cat: 'admin', ic: 'document', col: T.warn,  t: 'Revisione 2026',      s: 'Centro Revisioni Brera', amt: '79,10', km: '46.812' },
        { d: '04 mag', day: 'DOM', cat: 'fuel',  ic: 'fuel',   col: T.accent,  t: 'IP · A4 Bergamo',     s: 'Benzina · 22,8 L',     amt: '37,60', km: '46.503' },
      ],
    },
    {
      label: 'Aprile', total: '312,80',
      items: [
        { d: '28 apr', day: 'LUN', cat: 'fuel',  ic: 'fuel',   col: T.accent,  t: 'Eni Station',         s: 'Benzina · 35,4 L',     amt: '58,40', km: '46.180' },
        { d: '22 apr', day: 'MAR', cat: 'maint', ic: 'oil',    col: T.info,    t: 'Tagliando 45.000 km', s: 'Officina autorizzata', amt: '189,00', km: '45.892' },
        { d: '14 apr', day: 'LUN', cat: 'fuel',  ic: 'fuel',   col: T.accent,  t: 'Tamoil · Tangenziale', s: 'Benzina · 39,0 L',    amt: '65,40', km: '45.612' },
      ],
    },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden auto', paddingBottom: 110 }}>
      <ScreenHeader
        vehicle={vehicle}
        title="Storico"
        subtitle="Tutte le spese, raggruppate."
        action={
          <button style={{
            width: 38, height: 38, borderRadius: 12, background: T.surfaceHi,
            border: `1px solid ${T.border}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer',
          }}>
            <Icon name="search" size={17} />
          </button>
        }
      />

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 8, padding: '4px 20px 14px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {filters.map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: active ? T.text : T.surface,
              color: active ? T.bg : T.textSec,
              border: `1px solid ${active ? T.text : T.border}`,
              borderRadius: 999, padding: '8px 14px',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              fontFamily: TYPE.family,
              flexShrink: 0,
            }}>{f.label}</button>
          );
        })}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {groups.map((g, gi) => {
          const items = filter === 'all' ? g.items : g.items.filter(i => i.cat === filter);
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, padding: '0 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.textTer }}>{g.label}</div>
                <Num size={13} weight={700} color={T.textSec}>{g.total} €</Num>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((it, i) => (
                  <Card key={i} style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Date stamp */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 11,
                        background: T.surfaceLo, border: `1px solid ${T.border}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.textTer, letterSpacing: 0.5 }}>{it.day}</div>
                        <Num size={15} weight={800}>{it.d.split(' ')[0]}</Num>
                      </div>
                      {/* Cat icon */}
                      <div style={{
                        width: 4, height: 36, borderRadius: 2, background: it.col, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</div>
                          <Num size={14} weight={700}>{it.amt}<span style={{ color: T.textTer, fontWeight: 500 }}> €</span></Num>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
                          <div style={{ fontSize: 12, color: T.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.s}</div>
                          <div style={{ fontSize: 11, color: T.textTer, fontFamily: TYPE.mono, flexShrink: 0 }}>{it.km} km</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. AGGIUNGI RIFORNIMENTO — fast bottom sheet
// ═══════════════════════════════════════════════════════════
function SheetAddFuel({ open, onClose }) {
  const [fuelType, setFuelType] = React.useState('benzina');
  const [liters, setLiters]   = React.useState('38,20');
  const [total, setTotal]     = React.useState('62,40');
  const [km, setKm]           = React.useState('47.218');
  const [full, setFull]       = React.useState(true);

  const pricePerL = (parseFloat(total.replace(',', '.')) / parseFloat(liters.replace(',', '.')) || 0).toFixed(3).replace('.', ',');

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .25s', zIndex: 8,
      }} />
      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.surfaceLo,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        border: `1px solid ${T.border}`, borderBottom: 'none',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .3s cubic-bezier(.2,.8,.25,1)',
        padding: '12px 20px 32px',
        zIndex: 9, maxHeight: '85%',
        overflow: 'hidden auto',
      }}>
        {/* Grabber */}
        <div style={{
          width: 38, height: 4, borderRadius: 2, background: T.grabber,
          margin: '6px auto 18px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: T.text }}>Nuovo rifornimento</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Oggi · 16 maggio 2026</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, background: T.surface,
            border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Fuel type — segmented */}
        <div style={{
          display: 'flex', background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: 4, marginBottom: 14, gap: 2,
        }}>
          {[
            { id: 'benzina', l: 'Benzina', c: T.benzina },
            { id: 'diesel',  l: 'Diesel',  c: T.diesel  },
            { id: 'gpl',     l: 'GPL',     c: T.gpl     },
            { id: 'metano',  l: 'Metano',  c: T.metano  },
          ].map(f => {
            const active = fuelType === f.id;
            return (
              <button key={f.id} onClick={() => setFuelType(f.id)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 10,
                background: active ? f.c : 'transparent',
                color: active ? T.textInv : T.textSec,
                border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: TYPE.family,
                transition: 'all .15s',
              }}>{f.l}</button>
            );
          })}
        </div>

        {/* Big inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <BigInput label="Importo totale" value={total} suffix="€" emphasis />
          <BigInput label="Litri" value={liters} suffix="L" />
        </div>

        {/* Derived */}
        <div style={{
          padding: '10px 14px', background: T.accentDim, border: `1px solid ${T.accentLine}`,
          borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Prezzo al litro
          </div>
          <Num size={18} weight={800} color={T.accent}>{pricePerL} €/L</Num>
        </div>

        {/* Odometer */}
        <BigInput label="Contachilometri" value={km} suffix="km" full />

        {/* Pieno toggle */}
        <button onClick={() => setFull(!full)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '14px 16px', marginTop: 10, marginBottom: 10, color: T.text, cursor: 'pointer',
          fontFamily: TYPE.family,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={18} color={full ? T.ok : T.textTer} strokeWidth={2.4} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Pieno effettuato</span>
          </div>
          <div style={{
            width: 38, height: 22, borderRadius: 11, padding: 2,
            background: full ? T.ok : T.surfaceHi, transition: 'background .15s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              transform: full ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform .15s',
            }} />
          </div>
        </button>

        {/* Optional row */}
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: `1px dashed ${T.borderHi}`, borderRadius: 14,
          padding: '12px 16px', marginBottom: 18, color: T.textSec, cursor: 'pointer',
          fontFamily: TYPE.family,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="pin" size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Aggiungi distributore e note</span>
          </div>
          <Icon name="chevR" size={14} />
        </button>

        {/* Save */}
        <button style={{
          width: '100%', background: T.accent, color: '#fff', border: 'none',
          borderRadius: 16, padding: '17px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: TYPE.family,
          boxShadow: `0 10px 28px ${T.accent}40`,
        }}>
          Salva rifornimento
        </button>
      </div>
    </>
  );
}

function BigInput({ label, value, suffix, full, emphasis }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '12px 14px', gridColumn: full ? '1 / -1' : 'auto',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textTer, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        <Num size={emphasis ? 30 : 24} weight={800}>{value}</Num>
        <span style={{ fontSize: 13, color: T.textSec, fontWeight: 600, marginLeft: 4 }}>{suffix}</span>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenStorico, SheetAddFuel, BigInput });

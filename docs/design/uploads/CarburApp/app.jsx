// CarburApp — App shell, navigation, design canvas layout

const VEHICLES = [
  { id: 'fiesta', name: 'Ford Fiesta', plate: 'EX 521 PR', year: 2021 },
  { id: 'panda',  name: 'Fiat Panda',  plate: 'GA 184 KH', year: 2018 },
];

// ───────────────────────────────────────────────────────────
// Wrapper — renders one mobile screen inside an iOS frame.
// Each artboard has its own local nav state so they're independent.
// ───────────────────────────────────────────────────────────
function Phone({ initial = 'dash', vehicle = VEHICLES[0], showSheet = false, dark = true }) {
  const [screen, setScreen] = React.useState(initial);
  const [sheetOpen, setSheetOpen] = React.useState(showSheet);

  const t = window.T;

  const screens = {
    onboarding: <ScreenOnboarding onStart={() => setScreen('dash')} />,
    dash:       <ScreenDashboard  vehicle={vehicle} onAddFuel={() => setSheetOpen(true)} />,
    hist:       <ScreenStorico    vehicle={vehicle} />,
    dead:       <ScreenScadenze   vehicle={vehicle} />,
    stats:      <ScreenStatistiche vehicle={vehicle} />,
  };

  const handleTab = (id) => {
    if (id === 'add') { setSheetOpen(true); return; }
    setScreen(id);
  };

  const tabFor = { dash: 'dash', hist: 'hist', dead: 'dead', stats: 'stats' };

  return (
    <IOSDevice width={402} height={874} dark={dark} title={null}>
      <div style={{
        position: 'absolute', inset: 0,
        background: t.bg,
        color: t.text,
        fontFamily: TYPE.family,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: '54px 0 0 0' }}>
          {screens[screen]}
        </div>
        {screen !== 'onboarding' && (
          <TabBar active={tabFor[screen] || null} onChange={handleTab} />
        )}
        <SheetAddFuel open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
    </IOSDevice>
  );
}

// ───────────────────────────────────────────────────────────
// Tweaks defaults
// ───────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "giorno",
  "accent": "#FF7A3D",
  "vehicleName": "Ford Fiesta",
  "vehiclePlate": "EX 521 PR"
}/*EDITMODE-END*/;

// ───────────────────────────────────────────────────────────
// Root
// ───────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Apply theme (mode + accent) on every tweak change
  React.useEffect(() => { window.applyTheme(t.mode, t.accent); }, [t.mode, t.accent]);
  // Pre-apply once before first render (T mutation)
  React.useMemo(() => { window.applyTheme(t.mode, t.accent); }, []);

  const vehicle = { id: 'v1', name: t.vehicleName, plate: t.vehiclePlate };
  const isDark = t.mode === 'notte';

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        body { font-family: ${TYPE.family}; -webkit-font-smoothing: antialiased; }
        button { font-family: inherit; }
        *::-webkit-scrollbar { display: none; }
      `}</style>

      <DesignCanvas>
        <DCSection
          id="flow"
          title={`CarburApp · ${t.mode === 'giorno' ? 'Tema Giorno' : 'Tema Notte'}`}
          subtitle="6 schermate · navigazione via tab bar inferiore · ogni artboard è interattivo. Premi F per ingrandire."
        >
          <DCArtboard id="ob"    label="01 · Onboarding"            width={420} height={892}>
            <Phone initial="onboarding" vehicle={vehicle} dark={isDark} />
          </DCArtboard>
          <DCArtboard id="dash"  label="02 · Riepilogo (Dashboard)" width={420} height={892}>
            <Phone initial="dash" vehicle={vehicle} dark={isDark} />
          </DCArtboard>
          <DCArtboard id="add"   label="03 · Aggiungi rifornimento" width={420} height={892}>
            <Phone initial="dash" vehicle={vehicle} dark={isDark} showSheet />
          </DCArtboard>
          <DCArtboard id="hist"  label="04 · Storico"               width={420} height={892}>
            <Phone initial="hist" vehicle={vehicle} dark={isDark} />
          </DCArtboard>
          <DCArtboard id="dead"  label="05 · Scadenze"              width={420} height={892}>
            <Phone initial="dead" vehicle={vehicle} dark={isDark} />
          </DCArtboard>
          <DCArtboard id="stats" label="06 · Statistiche"           width={420} height={892}>
            <Phone initial="stats" vehicle={vehicle} dark={isDark} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Tema">
          <TweakRadio
            label="Modalità"
            value={t.mode}
            onChange={v => setTweak('mode', v)}
            options={[{ value: 'giorno', label: 'Giorno' }, { value: 'notte', label: 'Notte' }]}
          />
        </TweakSection>

        <TweakSection title="Colore di accento">
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setTweak('accent', v)}
            options={['#FF7A3D', '#34D399', '#6FA8FF', '#F4B740']}
          />
          <div style={{ fontSize: 11, color: '#8B95A8', marginTop: 8, lineHeight: 1.4 }}>
            Arancio = energia, leggibilità in pieno sole. Verde = positività dati. Blu = neutralità. Giallo = audace.
          </div>
        </TweakSection>

        <TweakSection title="Veicolo">
          <TweakText label="Nome"  value={t.vehicleName}  onChange={v => setTweak('vehicleName',  v)} />
          <TweakText label="Targa" value={t.vehiclePlate} onChange={v => setTweak('vehiclePlate', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

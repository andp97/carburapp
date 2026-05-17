'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon, ICON_PATHS } from './Icon';
import { IconTile } from './IconTile';
import { Num } from './Num';
import { FuelType, Vehicle, FUEL_COLORS, FUEL_LABELS, ExpenseType, EXPENSE_TYPE_LABELS } from '@/lib/types';

type IconName = keyof typeof ICON_PATHS;

interface SheetAddFuelProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSuccess?: () => void;
}

const FUEL_TYPES: FuelType[] = ['benzina', 'diesel', 'gpl', 'metano', 'elettrico'];

const EXPENSE_OPTIONS: { type: ExpenseType; subtitle: string }[] = [
  { type: 'carburante', subtitle: 'Benzina, diesel, GPL...' },
  { type: 'manutenzione', subtitle: 'Tagliando, gomme, freni...' },
  { type: 'altro', subtitle: 'Pedaggi, parcheggi, tasse...' },
];

const EXPENSE_ICON: Record<ExpenseType, string> = {
  carburante: 'fuel',
  manutenzione: 'wrench',
  altro: 'document',
};

const SUBMIT_LABEL: Record<ExpenseType, string> = {
  carburante: 'Salva rifornimento',
  manutenzione: 'Salva manutenzione',
  altro: 'Salva spesa',
};

export function SheetAddFuel({ open, onClose, vehicle, onSuccess }: SheetAddFuelProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [expenseType, setExpenseType] = useState<ExpenseType>('carburante');
  const [maintDate, setMaintDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const [fuelType, setFuelType] = useState<FuelType>('benzina');
  const [liters, setLiters] = useState('');
  const [total, setTotal] = useState('');
  const [odometer, setOdometer] = useState('');
  const [station, setStation] = useState('');
  const [notes, setNotes] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOdometer, setLastOdometer] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const pricePerLiter = liters && total && parseFloat(liters) > 0
    ? (parseFloat(total) / parseFloat(liters)).toFixed(3)
    : null;

  const handleSubmit = async () => {
    if (!vehicle) return;
    setError(null);

    if (expenseType === 'carburante') {
      if (!liters || !total || !odometer) {
        setError('Compila tutti i campi obbligatori');
        return;
      }
      if (lastOdometer !== null && parseInt(odometer) < lastOdometer) {
        setError(`Il chilometraggio non può essere inferiore all'ultimo inserito (${lastOdometer.toLocaleString('it-IT')} km)`);
        return;
      }
    } else if (expenseType === 'manutenzione') {
      if (!total) {
        setError('Il totale è obbligatorio');
        return;
      }
    } else if (expenseType === 'altro') {
      if (!total) {
        setError('Il totale è obbligatorio');
        return;
      }
      if (!description.trim()) {
        setError('La descrizione è obbligatoria');
        return;
      }
    }

    setLoading(true);
    try {
      let body: Record<string, unknown>;

      if (expenseType === 'carburante') {
        body = {
          vehicleId: vehicle.id,
          expenseType,
          fuelType,
          liters: parseFloat(liters),
          total: parseFloat(total),
          odometer: parseInt(odometer),
          station: station || undefined,
          notes: notes || undefined,
          isFull,
        };
      } else if (expenseType === 'manutenzione') {
        body = {
          vehicleId: vehicle.id,
          expenseType,
          total: parseFloat(total),
          station: station || undefined,
          date: maintDate,
          odometer: odometer ? parseInt(odometer) : undefined,
          notes: notes || undefined,
          isFull: false,
        };
      } else {
        body = {
          vehicleId: vehicle.id,
          expenseType,
          total: parseFloat(total),
          notes: description || undefined,
          date: maintDate,
          isFull: false,
        };
      }

      const res = await fetch('/api/refuels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      handleClose();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setExpenseType('carburante');
    setMaintDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setLiters('');
    setTotal('');
    setOdometer('');
    setStation('');
    setNotes('');
    setIsFull(true);
    setError(null);
    setLastOdometer(null);
    onClose();
  };

  // Trap body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Fetch last odometer reading when sheet opens
  useEffect(() => {
    if (!open || !vehicle) return;
    fetch(`/api/refuels?vehicleId=${vehicle.id}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: { odometer: number }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setLastOdometer(data[0].odometer);
        }
      })
      .catch(() => { /* silent failure — hint simply won't show */ });
  }, [open, vehicle]);

  const fuelColor = FUEL_COLORS[fuelType];

  const headerTitle = step === 1 ? 'Aggiungi spesa' : EXPENSE_TYPE_LABELS[expenseType];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(.2,.8,.25,1)',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        data-testid="sheet-add-fuel"
        data-open={String(open)}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          zIndex: 201,
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border-hi)',
          borderBottom: 'none',
          maxHeight: '92dvh',
          overflowY: 'auto',
          transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(.2,.8,.25,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 16px',
        }}>
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              aria-label="Indietro"
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: 'var(--surface-hi)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="chevR" size={18} color="var(--text-sec)" style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : (
            <div />
          )}

          <div style={{ flex: 1, paddingLeft: step === 2 ? '12px' : '0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
              {headerTitle}
            </h2>
            {vehicle && (
              <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '2px' }}>
                {vehicle.name} · {vehicle.plate}
              </p>
            )}
          </div>

          <button
            onClick={handleClose}
            aria-label="Chiudi"
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'var(--surface-hi)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={18} color="var(--text-sec)" />
          </button>
        </div>

        {/* Step 1 — Expense type picker */}
        {step === 1 && (
          <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {EXPENSE_OPTIONS.map(({ type, subtitle }) => (
              <button
                key={type}
                onClick={() => { setExpenseType(type); setStep(2); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  minHeight: '72px',
                  background: 'var(--surface-hi)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <IconTile
                  name={EXPENSE_ICON[type] as IconName}
                  color="var(--accent)"
                  size={20}
                  tileSize={44}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                    {EXPENSE_TYPE_LABELS[type]}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-ter)', marginTop: '2px' }}>
                    {subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Expense form */}
        {step === 2 && (
          <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* === CARBURANTE === */}
            {expenseType === 'carburante' && (
              <>
                {/* Fuel type segmented control */}
                <div>
                  <Label>Tipo carburante</Label>
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    background: 'var(--surface-lo)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    marginTop: '8px',
                    overflowX: 'auto',
                  }}>
                    {FUEL_TYPES.map(ft => {
                      const active = ft === fuelType;
                      const color = FUEL_COLORS[ft];
                      return (
                        <button
                          key={ft}
                          onClick={() => setFuelType(ft)}
                          style={{
                            flex: '1 0 auto',
                            minWidth: ft === 'elettrico' ? '72px' : '56px',
                            padding: '8px 6px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: active ? color : 'transparent',
                            color: active ? '#fff' : 'var(--text-ter)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(.2,.8,.25,1)',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {FUEL_LABELS[ft]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount + Liters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label>Totale (€)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={total}
                      onChange={e => setTotal(e.target.value)}
                      inputMode="decimal"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>{fuelType === 'elettrico' ? 'kWh' : 'Litri'}</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={liters}
                      onChange={e => setLiters(e.target.value)}
                      inputMode="decimal"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Price per liter derived */}
                {pricePerLiter && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--surface-hi)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <Icon name="lightning" size={16} color={fuelColor} />
                    <span style={{ fontSize: '13px', color: 'var(--text-sec)' }}>
                      Prezzo per {fuelType === 'elettrico' ? 'kWh' : 'litro'}:
                    </span>
                    <Num size="14px" weight={700} color={fuelColor}>
                      €{pricePerLiter.replace('.', ',')}
                    </Num>
                  </div>
                )}

                {/* Odometer */}
                <div>
                  <Label>Contachilometri (km)</Label>
                  <Input
                    type="number"
                    placeholder="es. 45230"
                    value={odometer}
                    onChange={e => setOdometer(e.target.value)}
                    inputMode="numeric"
                  />
                  {lastOdometer !== null && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-ter)' }}>
                      Ultimo: {lastOdometer.toLocaleString('it-IT')} km
                    </div>
                  )}
                </div>

                {/* Full tank toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface-hi)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon name="fuel" size={18} color="var(--text-sec)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        Pieno completo
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-ter)' }}>
                        Per calcolare il consumo
                      </div>
                    </div>
                  </div>
                  <Toggle value={isFull} onChange={setIsFull} aria-checked={isFull} />
                </div>

                {/* Station */}
                <div>
                  <Label>Distributore (opzionale)</Label>
                  <Input
                    type="text"
                    placeholder="es. ENI, Q8, Shell…"
                    value={station}
                    onChange={e => setStation(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label>Note (opzionale)</Label>
                  <Input
                    type="text"
                    placeholder="Aggiungi una nota…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* === MANUTENZIONE === */}
            {expenseType === 'manutenzione' && (
              <>
                <div>
                  <Label>Totale (€)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={total}
                    onChange={e => setTotal(e.target.value)}
                    inputMode="decimal"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Input
                    type="text"
                    placeholder="Es. Tagliando, Gomme, Freni…"
                    value={station}
                    onChange={e => setStation(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={maintDate}
                    onChange={e => setMaintDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Contachilometri (km) — opzionale</Label>
                  <Input
                    type="number"
                    placeholder="es. 45230"
                    value={odometer}
                    onChange={e => setOdometer(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <Label>Note (opzionale)</Label>
                  <Input
                    type="text"
                    placeholder="Aggiungi una nota…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* === ALTRO === */}
            {expenseType === 'altro' && (
              <>
                <div>
                  <Label>Totale (€)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={total}
                    onChange={e => setTotal(e.target.value)}
                    inputMode="decimal"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Descrizione</Label>
                  <Input
                    type="text"
                    placeholder="Es. Pedaggio A1, Parcheggio…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={maintDate}
                    onChange={e => setMaintDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: '13px',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Icon name="x" size={16} color="var(--danger)" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
                border: 'none',
                minHeight: '56px',
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Icon name={EXPENSE_ICON[expenseType] as IconName} size={20} color="#fff" />
                  {SUBMIT_LABEL[expenseType]}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-ter)',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: 'var(--surface-lo)',
        border: '1px solid var(--border-hi)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        fontSize: '16px',
        fontWeight: 500,
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
        WebkitAppearance: 'none',
        appearance: 'none',
        ...props.style,
      }}
    />
  );
}

function Toggle({ value, onChange, 'aria-checked': ariaChecked }: { value: boolean; onChange: (v: boolean) => void; 'aria-checked'?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={ariaChecked ?? value}
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        background: value ? 'var(--ok)' : 'var(--surface)',
        border: '1px solid var(--border-hi)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 22 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s cubic-bezier(.2,.8,.25,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}

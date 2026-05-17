'use client';

import React, { useState } from 'react';
import { Icon } from '../Icon';
import { VehicleFormFields } from '../VehicleFormFields';
import { Vehicle } from '@/lib/types';

interface OnboardingProps {
  onComplete: (vehicle: Vehicle) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'landing' | 'form'>('landing');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !plate || !year) {
      setError('Compila tutti i campi');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, plate: plate.toUpperCase(), year: parseInt(year) }),
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      const vehicle: Vehicle = await res.json();
      onComplete(vehicle);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      setLoading(false);
    }
  };

  if (step === 'form') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '60px 24px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setStep('landing')}
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="chevR" size={18} color="var(--text-sec)" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
              La tua auto
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-ter)', marginTop: '2px' }}>
              Aggiungi i dati del veicolo
            </p>
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          <VehicleFormFields
            name={name} onNameChange={setName}
            plate={plate} onPlateChange={setPlate}
            year={year} onYearChange={setYear}
          />

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '18px',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'Salvataggio…' : (
              <>
                <Icon name="check" size={20} color="#fff" />
                Crea veicolo
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Hero visual */}
      <div style={{
        flex: '1 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 40px',
        position: 'relative',
      }}>
        {/* Glow effect */}
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

        {/* Logo icon */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #FF5A1A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(255,122,61,0.35)',
          position: 'relative',
          zIndex: 1,
        }}>
          <Icon name="fuel" size={48} color="#fff" strokeWidth={1.5} />
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
          Il tracker spese auto pensato per gli italiani. Rifornimenti, scadenze, statistiche — tutto in un posto.
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
          {FEATURES.map((f, i) => (
            <div
              key={i}
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
                width: 38, height: 38,
                borderRadius: '10px',
                background: `rgba(${f.rgb},0.12)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={f.icon as any} size={20} color={`rgb(${f.rgb})`} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '1px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: '16px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <button
          onClick={() => setStep('form')}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '18px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '17px',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            minHeight: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(255,122,61,0.4)',
          }}
        >
          <Icon name="car" size={22} color="#fff" />
          Aggiungi la tua prima auto
        </button>
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-ter)',
        }}>
          Dati sincronizzati in cloud · Sempre al sicuro
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: 'fuel', title: 'Rifornimenti', desc: 'Tieni traccia di ogni rifornimento', rgb: '111,168,255' },
  { icon: 'bell', title: 'Scadenze', desc: 'Bollo, assicurazione, revisione', rgb: '244,183,64' },
  { icon: 'chart', title: 'Statistiche', desc: 'Analizza i tuoi consumi nel tempo', rgb: '74,222,128' },
];


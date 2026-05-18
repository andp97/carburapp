'use client';

import React, { useState } from 'react';
import { VehicleFormFields } from '../VehicleFormFields';
import { Vehicle } from '@/lib/types';

interface OnboardingProps {
  onComplete: (vehicle: Vehicle) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName]   = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

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

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '60px 24px 32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
          La tua auto
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-ter)', marginTop: '2px' }}>
          Aggiungi i dati del veicolo per iniziare
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
        <VehicleFormFields
          name={name}   onNameChange={setName}
          plate={plate} onPlateChange={setPlate}
          year={year}   onYearChange={setYear}
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
          {loading ? 'Salvataggio…' : 'Crea veicolo'}
        </button>
      </div>
    </div>
  );
}

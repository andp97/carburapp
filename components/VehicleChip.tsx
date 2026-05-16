'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';
import { Vehicle } from '@/lib/types';

interface VehicleChipProps {
  vehicles: Vehicle[];
  selected: Vehicle | null;
  onSelect: (vehicle: Vehicle) => void;
}

export function VehicleChip({ vehicles, selected, onSelect }: VehicleChipProps) {
  const [open, setOpen] = useState(false);

  if (!selected) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--surface-hi)',
          border: '1px solid var(--border-hi)',
          borderRadius: '100px',
          padding: '8px 12px 8px 10px',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        <Icon name="car" size={16} color="var(--accent)" />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {selected.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-ter)', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
            {selected.plate}
          </div>
        </div>
        <Icon name="chevD" size={14} color="var(--text-ter)" />
      </button>

      {open && vehicles.length > 1 && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border-hi)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
              minWidth: '180px',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => { onSelect(v); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: v.id === selected.id ? 'var(--surface-hi)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <Icon name="car" size={16} color={v.id === selected.id ? 'var(--accent)' : 'var(--text-ter)'} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-ter)', fontFamily: 'var(--font-mono)' }}>{v.plate}</div>
                </div>
                {v.id === selected.id && <Icon name="check" size={14} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

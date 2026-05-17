'use client';

import React from 'react';

interface VehicleFormFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  plate: string;
  onPlateChange: (v: string) => void;
  year: string;
  onYearChange: (v: string) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-ter)',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-lo)',
  border: '1px solid var(--border-hi)',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  WebkitAppearance: 'none',
  appearance: 'none',
  boxSizing: 'border-box',
};

const fieldStyle: React.CSSProperties = { marginBottom: '14px' };

export function VehicleFormFields({
  name, onNameChange,
  plate, onPlateChange,
  year, onYearChange,
}: VehicleFormFieldsProps) {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <div style={fieldStyle}>
        <label style={labelStyle}>Nome</label>
        <input
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="es. Panda 1.2, Golf TDI…"
          autoComplete="off"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Targa</label>
        <input
          type="text"
          value={plate}
          onChange={e => onPlateChange(e.target.value.toUpperCase())}
          placeholder="es. AB123CD"
          autoComplete="off"
          maxLength={9}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Anno</label>
        <input
          type="number"
          value={year}
          onChange={e => onYearChange(e.target.value)}
          placeholder={String(currentYear)}
          autoComplete="off"
          inputMode="numeric"
          min="1900"
          max={currentYear + 1}
          style={inputStyle}
        />
      </div>
    </>
  );
}

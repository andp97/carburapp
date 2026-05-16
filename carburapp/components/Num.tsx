'use client';

import React from 'react';

interface NumProps {
  children: React.ReactNode;
  size?: number | string;
  weight?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function Num({ children, size = 'inherit', weight = 600, color = 'inherit', style }: NumProps) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        fontWeight: weight,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

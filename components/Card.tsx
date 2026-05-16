'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  padding?: string | number;
  elevated?: boolean;
}

export function Card({ children, style, onClick, padding = '18px', elevated = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding,
        boxShadow: elevated ? '0 4px 24px rgba(0,0,0,0.18)' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'opacity 0.15s' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

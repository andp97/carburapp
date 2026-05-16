'use client';

import React from 'react';

type PillTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info';

interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
  style?: React.CSSProperties;
}

const TONE_COLORS: Record<PillTone, { bg: string; text: string }> = {
  neutral: { bg: 'var(--surface-hi)', text: 'var(--text-sec)' },
  accent: { bg: 'rgba(255,122,61,0.15)', text: 'var(--accent)' },
  ok: { bg: 'rgba(74,222,128,0.12)', text: 'var(--ok)' },
  warn: { bg: 'rgba(244,183,64,0.12)', text: 'var(--warn)' },
  danger: { bg: 'rgba(248,113,113,0.12)', text: 'var(--danger)' },
  info: { bg: 'rgba(111,168,255,0.12)', text: 'var(--info)' },
};

export function Pill({ children, tone = 'neutral', style }: PillProps) {
  const colors = TONE_COLORS[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '100px',
        background: colors.bg,
        color: colors.text,
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

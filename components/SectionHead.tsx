'use client';

import React from 'react';

interface SectionHeadProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export function SectionHead({ title, action, onAction, style }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-ter)',
        }}
      >
        {title}
      </span>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

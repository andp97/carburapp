'use client';

import React from 'react';
import { Icon, ICON_PATHS } from './Icon';

interface IconTileProps {
  name: keyof typeof ICON_PATHS;
  color?: string;
  size?: number;
  tileSize?: number;
  style?: React.CSSProperties;
}

export function IconTile({ name, color = 'var(--accent)', size = 20, tileSize = 44, style }: IconTileProps) {
  // Convert CSS color variable to rgba background
  const bgStyle = color.startsWith('var(')
    ? { background: `color-mix(in srgb, ${color} 15%, transparent)` }
    : { background: hexToRgba(color, 0.15) };

  return (
    <div
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...bgStyle,
        ...style,
      }}
    >
      <Icon name={name} size={size} color={color} />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

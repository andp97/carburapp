'use client';

import React from 'react';

export const ICON_PATHS: Record<string, string | string[]> = {
  fuel: 'M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5',
  car: 'M5 17h14M5 17l1.5-5.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 17M5 17v2M19 17v2M3 12h2M19 12h2M8 14h.01M16 14h.01',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M9 21a3 3 0 0 0 6 0',
  chart: 'M3 21h18M7 17V11M12 17V7M17 17v-4',
  plus: 'M12 5v14M5 12h14',
  home: 'M3 12 12 3l9 9M5 10v10h14V10',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
  receipt: 'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3M8 8h8M8 12h8M8 16h5',
  filter: 'M3 5h18M6 12h12M10 19h4',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  chevU: 'M18 15l-6-6-6 6',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  trend: 'M3 17l6-6 4 4 8-8M21 7h-4M21 7v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  pin: 'M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  document: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5',
  tire: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z', 'M12 3v4M12 17v4M3 12h4M17 12h4'],
  oil: 'M12 3l-4 6a5 5 0 1 0 8 0l-4-6z',
  euro: 'M18 7a6 6 0 1 0 0 10M4 10h10M4 14h10',
  road: 'M6 21l3-18M18 21l-3-18M12 5v2M12 11v2M12 17v2',
  speedo: ['M3 13a9 9 0 1 1 18 0', 'M12 13l4-4'],
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  lightning: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  settings: ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1-.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
};

interface IconProps {
  name: keyof typeof ICON_PATHS;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.75, style }: IconProps) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;

  const pathArray = Array.isArray(paths) ? paths : [paths];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {pathArray.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

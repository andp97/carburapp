'use client';

import React from 'react';

interface SparkProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Spark({ data, width = 80, height = 28, color = 'var(--accent)', strokeWidth = 2, style }: SparkProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} style={style} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  // Create area fill path
  const firstX = 0;
  const lastX = width;
  const fillPath = `M${firstX},${height} L${points.join(' L')} L${lastX},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#spark-gradient)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

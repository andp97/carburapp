'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '@/lib/types';

interface ThemeContextValue {
  mode: ThemeMode;
  accent: string;
  toggleMode: () => void;
  setAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'notte',
  accent: '#FF7A3D',
  toggleMode: () => {},
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('notte');
  const [accent, setAccentState] = useState('#FF7A3D');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('carburapp-theme') as ThemeMode | null;
    const savedAccent = localStorage.getItem('carburapp-accent');
    if (savedMode) setMode(savedMode);
    if (savedAccent) setAccentState(savedAccent);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    localStorage.setItem('carburapp-theme', mode);
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    // Derive glow from accent
    const hex = accent.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
    localStorage.setItem('carburapp-accent', accent);
  }, [accent, mounted]);

  const toggleMode = () => {
    setMode(prev => prev === 'notte' ? 'giorno' : 'notte');
  };

  const setAccent = (color: string) => {
    setAccentState(color);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

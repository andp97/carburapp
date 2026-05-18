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
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const savedAccent = localStorage.getItem('carburapp-accent');
    if (savedAccent) setAccentState(savedAccent);

    // User override takes priority; otherwise follow system
    const saved = localStorage.getItem('carburapp-theme');
    if (saved === 'notte' || saved === 'giorno') {
      setMode(saved);
    } else {
      setMode(mq.matches ? 'notte' : 'giorno');
    }

    // Track system changes when there is no manual override
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('carburapp-theme')) {
        setMode(e.matches ? 'notte' : 'giorno');
      }
    };
    mq.addEventListener('change', handler);
    setMounted(true);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    const hex = accent.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
    localStorage.setItem('carburapp-accent', accent);
  }, [accent, mounted]);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'notte' ? 'giorno' : 'notte';
      localStorage.setItem('carburapp-theme', next);
      return next;
    });
  };

  const setAccent = (color: string) => setAccentState(color);

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
